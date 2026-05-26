const StudentRepository = require('../repositories/StudentRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getChildren = catchAsync(async (req, res, next) => {
    // Expect phone from user token or query? 
    // If authenticated as parent, phone is in req.user.phone
    // If authenticated as Admin, query param might be allowed.
    // Let's assume Parent role uses req.user.phone

    let phone;
    if (req.user.role === 'parent') {
        phone = req.user.id;
    } else {
        phone = req.query.phone;
    }

    if (!phone) {
        return next(new AppError('Phone number required', 400));
    }

    const children = await StudentRepository.findByParentPhone(phone);

    res.status(200).json({
        status: 'success',
        results: children.length,
        data: { children }
    });
});

const TripRepository = require('../repositories/TripRepository');
const AttendanceRepository = require('../repositories/AttendanceRepository');

exports.getStudentActivity = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const phone = req.user.id;

    // Verify student belongs to parent
    const student = await StudentRepository.model.findOne({ _id: id, parentPhone: phone });
    if (!student) {
        return next(new AppError('Student not found or access denied', 404));
    }

    if (!student.assignedRoute || !student.assignedBus) {
        return res.status(200).json({
            status: 'success',
            data: {
                tripStatus: 'not started',
                tripId: null,
                lastLocation: null,
                activity: []
            }
        });
    }

    const trip = await TripRepository.findActiveTripByRouteAndBus(student.assignedRoute, student.assignedBus);
    
    if (!trip) {
        return res.status(200).json({
            status: 'success',
            data: {
                tripStatus: 'not started',
                tripId: null,
                lastLocation: null,
                activity: []
            }
        });
    }

    const activity = [];
    activity.push({
        action: `Trip Started (${trip.type})`,
        time: trip.startTime
    });

    const attendances = await AttendanceRepository.model.find({ tripId: trip._id, studentId: id }).sort({ timestamp: 1 });
    attendances.forEach(a => {
        activity.push({
            action: a.status,
            time: a.timestamp || a.date
        });
    });

    res.status(200).json({
        status: 'success',
        data: {
            tripStatus: 'ongoing',
            tripId: trip._id,
            lastLocation: trip.driverId && trip.driverId.currentLocation ? trip.driverId.currentLocation : null,
            activity
        }
    });
});

exports.getStudentAttendance = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const phone = req.user.id;
    const { month } = req.query; // format YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return next(new AppError('Valid month required in format YYYY-MM', 400));
    }

    const student = await StudentRepository.model.findOne({ _id: id, parentPhone: phone });
    if (!student) {
        return next(new AppError('Student not found or access denied', 404));
    }

    const [year, m] = month.split('-');
    const attendance = await AttendanceRepository.findByStudentAndMonth(id, parseInt(year), parseInt(m));

    res.status(200).json({
        status: 'success',
        results: attendance.length,
        data: { attendance }
    });
});
