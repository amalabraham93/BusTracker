const TripService = require('../services/TripService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.startTrip = catchAsync(async (req, res, next) => {
    const { busId, routeId, schoolId, type } = req.body;
    const driverId = req.user.id; // From Auth Middleware

    if (!busId || !routeId || !schoolId || !type) {
        return next(new AppError('Missing trip details', 400));
    }

    const trip = await TripService.startTrip(driverId, busId, routeId, schoolId, type);

    res.status(201).json({
        status: 'success',
        data: { trip }
    });
});

exports.endTrip = catchAsync(async (req, res, next) => {
    const driverId = req.user.id;
    const trip = await TripService.endTrip(driverId);
    
    res.status(200).json({
        status: 'success',
        message: 'Trip ended successfully',
        data: { trip }
    });
});

exports.updateLocation = catchAsync(async (req, res, next) => {
    const { lat, lng } = req.body;
    const driverId = req.user.id;

    if (!lat || !lng) {
        return next(new AppError('Coordinates required', 400));
    }

    await TripService.updateLocation(driverId, lat, lng);

    res.status(200).json({
        status: 'success',
        message: 'Location updated'
    });
});

exports.markAttendance = catchAsync(async (req, res, next) => {
    const { studentId, status } = req.body;
    const driverId = req.user.id;

    if (!studentId || !status) {
        return next(new AppError('Student ID and Status required', 400));
    }

    // Lazy load service to avoid circular dependency if any (none here but good practice)
    const AttendanceService = require('../services/AttendanceService');
    await AttendanceService.markAttendance(driverId, studentId, status);

    res.status(200).json({
        status: 'success',
        message: 'Attendance marked',
        attendanceStatus: status,
        studentId: studentId
    });
});

exports.getDashboard = catchAsync(async (req, res, next) => {
    const driverId = req.user.id;
    const DriverRepository = require('../repositories/DriverRepository'); 
    const { client: redisClient } = require('../config/redis');

    const driver = await DriverRepository.model.findById(driverId)
        .populate({
            path: 'assignedBus',
            populate: { path: 'assignedRoute' } 
        })
        .populate('schoolId', 'name email address phone');

    if (!driver) {
        return next(new AppError('Driver not found', 404));
    }

    // Check if trip is active
    const activeTripId = await redisClient.get(`driver:trip:${driverId}`);
    const tripStatus = activeTripId ? 'Ongoing' : 'pending';

    let students = [];
    let currentBus = driver.assignedBus;
    let currentRoute = driver.assignedBus ? driver.assignedBus.assignedRoute : null;

    if (activeTripId) {
        const TripRepository = require('../repositories/TripRepository');
        const trip = await TripRepository.model.findById(activeTripId).populate('busId routeId');
        if (trip) {
            currentBus = trip.busId;
            currentRoute = trip.routeId;
            
            const StudentRepository = require('../repositories/StudentRepository');
            students = await StudentRepository.model.find({ 
                assignedRoute: trip.routeId._id || trip.routeId,
                assignedBus: trip.busId._id || trip.busId 
            });
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            tripStatus,
            tripId: activeTripId || null,
            driver: {
                name: driver.name,
                phone: driver.phone,
                schoolId: driver.schoolId
            },
            bus: currentBus,
            route: currentRoute,
            students
        }
    });
});

exports.getStudentsByRouteAndBus = catchAsync(async (req, res, next) => {
    const { routeId, busId } = req.query;
    if (!routeId || !busId) {
        return next(new AppError('Route ID and Bus ID are required', 400));
    }
    
    const StudentRepository = require('../repositories/StudentRepository');
    const RouteRepository = require('../repositories/RouteRepository');
    const BusRepository = require('../repositories/BusRepository');
    const { client: redisClient } = require('../config/redis');

    const driverId = req.user.id;
    const activeTripId = await redisClient.get(`driver:trip:${driverId}`);

    const [students, route, bus] = await Promise.all([
        StudentRepository.model.find({ assignedRoute: routeId, assignedBus: busId }),
        RouteRepository.model.findById(routeId),
        BusRepository.model.findById(busId)
    ]);
    
    res.status(200).json({
        status: 'success',
        data: { tripId: activeTripId || null, route, bus, students }
    });
});

exports.sendAlertToParents = catchAsync(async (req, res, next) => {
    const { type, message } = req.body;
    const driverId = req.user.id;
    const DriverRepository = require('../repositories/DriverRepository');
    const NotificationService = require('../services/NotificationService');
    const AuditLogRepository = require('../repositories/AuditLogRepository');
    const { client: redisClient } = require('../config/redis');

    const activeTripId = await redisClient.get(`driver:trip:${driverId}`);
    if (!activeTripId) {
        return next(new AppError('Cannot send alert. No ongoing trip.', 400));
    }

    if (!['Route Change', 'Delay', 'Breakdown'].includes(type)) {
        return next(new AppError('Invalid alert type', 400));
    }

    const TripRepository = require('../repositories/TripRepository');
    const trip = await TripRepository.model.findById(activeTripId).populate('routeId busId');
    if (!trip || !trip.routeId) {
        return next(new AppError('No active route found for this trip', 400));
    }

    const alertData = {
        type,
        message: message || `There is a ${type} for your child's bus route.`,
        timestamp: new Date(),
        student_name: '',
        student_id: '',
        route_name: trip.routeId ? trip.routeId.routeName : '',
        busNumber: trip.busId ? trip.busId.busNumber : '',
        busId: trip.busId ? trip.busId._id.toString() : ''
    };

    // 1. Emit Socket Alert to trip room instead of route room
    await NotificationService.sendRealTimeAlert(`trip:${activeTripId}`, 'routeAlert', alertData);

    // 1.5 Emit Firebase Push Notification to all parents on this route
    const StudentRepository = require('../repositories/StudentRepository');
    const students = await StudentRepository.model.find({ assignedRoute: trip.routeId, assignedBus: trip.busId, isActive: true });
    const parentPhones = [...new Set(students.map(s => s.parentPhone))];
    for (const phone of parentPhones) {
        await NotificationService.sendPushNotification('parent', phone, alertData.type, alertData.message, { type: alertData.type });
    }

    // 2. Log Action
    await AuditLogRepository.logAction({
        userId: driverId,
        userRole: 'driver',
        action: 'UPDATE',
        resource: 'Trip',
        resourceId: activeTripId,
        details: { alertType: type, message: alertData.message }
    });

    res.status(200).json({
        status: 'success',
        message: `Alert sent to parents for ${type}`
    });
});

exports.sendEmergencyAlert = catchAsync(async (req, res, next) => {
    const driverId = req.user.id;
    const DriverRepository = require('../repositories/DriverRepository');
    const NotificationService = require('../services/NotificationService');
    const AuditLogRepository = require('../repositories/AuditLogRepository');
    const { client: redisClient } = require('../config/redis');

    const activeTripId = await redisClient.get(`driver:trip:${driverId}`);
    if (!activeTripId) {
        return next(new AppError('Cannot send emergency alert. No ongoing trip.', 400));
    }

    const driver = await DriverRepository.findById(driverId);
    if (!driver) return next(new AppError('Driver not found', 404));

    const TripRepository = require('../repositories/TripRepository');
    const trip = await TripRepository.model.findById(activeTripId).populate('routeId busId');
    if (!trip || !trip.routeId) {
        return next(new AppError('No active route found for this driver', 400));
    }

    const schoolId = driver.schoolId;
    const emergencyData = {
        driverName: driver.name,
        driverPhone: driver.phone,
        busId: trip.busId ? trip.busId._id.toString() : '',
        busNumber: trip.busId ? trip.busId.busNumber : '',
        routeName: trip.routeId ? trip.routeId.routeName : '',
        tripId: activeTripId,
        message: 'EMERGENCY: Panic button pressed!',
        timestamp: new Date()
    };

    // 1. Emit Socket Alert to School
    await NotificationService.sendRealTimeAlert(`school:${schoolId}`, 'emergencyAlert', emergencyData);

    // 1.5 Emit Firebase Push Notification to School
    const schoolMsg = `SOS - Alert from ${emergencyData.routeName || 'Unknown Route'} and ${emergencyData.busNumber || 'Unknown Bus'}`;
    await NotificationService.sendPushNotification('school', schoolId.toString(), 'Emergency Alert', schoolMsg, { type: 'Emergency' });

    // 1.6 Emit Firebase Push Notification to Parents on this Route
    const StudentRepository = require('../repositories/StudentRepository');
    const students = await StudentRepository.model.find({ assignedRoute: trip.routeId, assignedBus: trip.busId, isActive: true });
    const parentPhones = [...new Set(students.map(s => s.parentPhone))];
    const parentMsg = "Alert - driver message and don't panic";
    for (const phone of parentPhones) {
        await NotificationService.sendPushNotification('parent', phone, 'Emergency Alert', parentMsg, { type: 'Emergency' });
    }

    // 2. Log Action
    await AuditLogRepository.logAction({
        userId: driverId,
        userRole: 'driver',
        action: 'UPDATE',
        resource: 'School',
        resourceId: schoolId,
        details: { emergency: true, message: emergencyData.message }
    });

    res.status(200).json({
        status: 'success',
        message: 'Emergency alert sent to school administration'
    });
});

exports.getRoutes = catchAsync(async (req, res, next) => {
    const driverId = req.user.id;
    const DriverRepository = require('../repositories/DriverRepository');
    const RouteRepository = require('../repositories/RouteRepository');

    const driver = await DriverRepository.findById(driverId);
    if (!driver) return next(new AppError('Driver not found', 404));

    const routes = await RouteRepository.model.find({ schoolId: driver.schoolId });
    
    res.status(200).json({
        status: 'success',
        results: routes.length,
        data: { routes }
    });
});

exports.getBusesByRoute = catchAsync(async (req, res, next) => {
    const { routeId } = req.params;
    const driverId = req.user.id;
    const DriverRepository = require('../repositories/DriverRepository');
    const RouteRepository = require('../repositories/RouteRepository');
    const BusRepository = require('../repositories/BusRepository');

    const driver = await DriverRepository.findById(driverId);
    if (!driver) return next(new AppError('Driver not found', 404));

    const route = await RouteRepository.model.findOne({ _id: routeId, schoolId: driver.schoolId });
    if (!route) return next(new AppError('Route not found or access denied', 404));

    const buses = await BusRepository.model.find({ assignedRoute: routeId, schoolId: driver.schoolId });
    
    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: { buses }
    });
});

exports.getAttendanceStatus = catchAsync(async (req, res, next) => {
    const driverId = req.user.id;
    const { client: redisClient } = require('../config/redis');

    const activeTripId = await redisClient.get(`driver:trip:${driverId}`);
    if (!activeTripId) {
        return next(new AppError('No active trip found to fetch attendance', 400));
    }

    const TripRepository = require('../repositories/TripRepository');
    const trip = await TripRepository.model.findById(activeTripId);
    if (!trip) return next(new AppError('Trip not found', 404));

    const StudentRepository = require('../repositories/StudentRepository');
    const AttendanceRepository = require('../repositories/AttendanceRepository');

    const students = await StudentRepository.model.find({ 
        assignedRoute: trip.routeId,
        assignedBus: trip.busId 
    }).lean();

    const attendances = await AttendanceRepository.model.find({ tripId: activeTripId }).lean();

    const attendanceMap = {};
    attendances.forEach(a => {
        if (!attendanceMap[a.studentId.toString()] || new Date(a.timestamp) > new Date(attendanceMap[a.studentId.toString()].timestamp)) {
            attendanceMap[a.studentId.toString()] = {
                status: a.status,
                timestamp: a.timestamp
            };
        }
    });

    const studentsWithAttendance = students.map(student => ({
        ...student,
        attendanceStatus: attendanceMap[student._id.toString()]?.status || 'Pending',
        attendanceTimestamp: attendanceMap[student._id.toString()]?.timestamp || null
    }));

    res.status(200).json({
        status: 'success',
        data: { 
            tripType: trip.type,
            students: studentsWithAttendance 
        }
    });
});
