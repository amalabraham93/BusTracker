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
        message: 'Attendance marked'
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
        });

    if (!driver) {
        return next(new AppError('Driver not found', 404));
    }

    // Check if trip is active
    const activeTripId = await redisClient.get(`driver:trip:${driverId}`);
    const tripStatus = activeTripId ? 'Ongoing' : 'pending';

    let students = [];
    if (activeTripId && driver.assignedBus && driver.assignedBus.assignedRoute) {
        const routeId = driver.assignedBus.assignedRoute._id;
        const StudentRepository = require('../repositories/StudentRepository');
        students = await StudentRepository.model.find({ assignedRoute: routeId });
    }

    res.status(200).json({
        status: 'success',
        data: {
            tripStatus,
            driver: {
                name: driver.name,
                phone: driver.phone,
                schoolId: driver.schoolId
            },
            bus: driver.assignedBus,
            route: driver.assignedBus ? driver.assignedBus.assignedRoute : null,
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
    const students = await StudentRepository.model.find({ assignedRoute: routeId, assignedBus: busId });
    
    res.status(200).json({
        status: 'success',
        data: { students }
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

    const driver = await DriverRepository.model.findById(driverId).populate('assignedBus');
    if (!driver || !driver.assignedBus || !driver.assignedBus.assignedRoute) {
        return next(new AppError('No active route found for this driver', 400));
    }

    const alertData = {
        type,
        message: message || `There is a ${type} for your child's bus route.`,
        timestamp: new Date()
    };

    // 1. Emit Socket Alert to trip room instead of route room
    await NotificationService.sendRealTimeAlert(`trip:${activeTripId}`, 'routeAlert', alertData);

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

    const schoolId = driver.schoolId;
    const alertData = {
        driverName: driver.name,
        driverPhone: driver.phone,
        busId: driver.assignedBus,
        tripId: activeTripId,
        message: 'EMERGENCY: Panic button pressed!',
        timestamp: new Date()
    };

    // 1. Emit Socket Alert to School
    await NotificationService.sendRealTimeAlert(`school:${schoolId}`, 'emergencyAlert', alertData);

    // 2. Log Action
    await AuditLogRepository.logAction({
        userId: driverId,
        userRole: 'driver',
        action: 'UPDATE',
        resource: 'School',
        resourceId: schoolId,
        details: { emergency: true, message: alertData.message }
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
