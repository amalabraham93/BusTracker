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
