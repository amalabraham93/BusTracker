const TripService = require('../services/TripService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.startTrip = catchAsync(async (req, res, next) => {
    const { busId, routeId, schoolId } = req.body;
    const driverId = req.user.id; // From Auth Middleware

    if (!busId || !routeId || !schoolId) {
        return next(new AppError('Missing trip details', 400));
    }

    const trip = await TripService.startTrip(driverId, busId, routeId, schoolId);

    res.status(201).json({
        status: 'success',
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
    // 1. Get Driver Details with populated Bus and Route
    // We need to fetch Driver again to populate references if not already in req.user
    // However, req.user from protect middleware usually has the raw document.
    // Let's refetch to be safe and populate.
    const DriverRepository = require('../repositories/DriverRepository'); // Direct repo access for simpler read

    // Find driver and populate assignedBus and its route
    // Note: Schema structure: Driver -> assignedBus (Bus) -> assignedRoute (Route - optional/if in Bus)
    // Actually Driver schema has 'currentTripId' but static assignment might differ.
    // The requirement says "Should select the bus, in that bus the route should be added already".
    // This implies Bus has a Route.

    const driver = await DriverRepository.model.findById(driverId)
        .populate({
            path: 'assignedBus',
            populate: { path: 'assignedRoute' } // Assuming Bus has assignedRoute
        });

    if (!driver) {
        return next(new AppError('Driver not found', 404));
    }

    let students = [];
    if (driver.assignedBus && driver.assignedBus.assignedRoute) {
        const routeId = driver.assignedBus.assignedRoute._id;
        // Fetch students on this route
        const StudentRepository = require('../repositories/StudentRepository');
        students = await StudentRepository.model.find({ assignedRoute: routeId });
    } else {
        // Method 2: Maybe Driver is directly assigned to a route? 
        // Our Driver model doesn't seem to have 'assignedRoute', but Bus does?
        // Let's check Bus Schema later. If Bus has no route, check if Driver has it?
        // For now assuming Bus -> Route.
    }

    res.status(200).json({
        status: 'success',
        data: {
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
