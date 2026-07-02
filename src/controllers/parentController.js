const StudentRepository = require('../repositories/StudentRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getChildren = catchAsync(async (req, res, next) => {
    // Expect phone from user token or query? 
    // If authenticated as parent, phone is in req.user.phone
    // If authenticated as Admin, query param might be allowed.
    // Let's assume Parent role uses req.user.phone

    let parentId;
    if (req.user.role === 'parent') {
        parentId = req.user.id;
    } else {
        // Fallback for admin if needed
        parentId = req.query.parentId;
    }

    if (!parentId) {
        return next(new AppError('Parent ID required', 400));
    }

    const children = await StudentRepository.model.find({ parentId, isDeleted: { $ne: true } })
        .populate('assignedRoute assignedBus schoolId');
    const TripRepository = require('../repositories/TripRepository');

    const childrenWithTripInfo = await Promise.all(children.map(async (child) => {
        let tripStatus = 'pending';
        let tripId = '';

        if (child.assignedRoute && child.assignedBus) {
            const routeId = child.assignedRoute._id || child.assignedRoute;
            const busId = child.assignedBus._id || child.assignedBus;
            
            const trip = await TripRepository.findActiveTripByRouteAndBus(routeId, busId);
            if (trip) {
                tripStatus = 'ongoing';
                tripId = trip._id;
            }
        }

        const childObj = child.toObject();
        childObj.tripStatus = tripStatus;
        childObj.tripId = tripId;
        
        return childObj;
    }));

    res.status(200).json({
        status: 'success',
        results: childrenWithTripInfo.length,
        data: { children: childrenWithTripInfo }
    });
});

const TripRepository = require('../repositories/TripRepository');
const AttendanceRepository = require('../repositories/AttendanceRepository');

exports.getStudentActivity = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const parentId = req.user.id;

    // Verify student belongs to parent
    const student = await StudentRepository.model.findOne({ _id: id, parentId })
        .populate('schoolId', 'name address phone email')
        .populate('assignedRoute', 'routeName startPoint endPoint')
        .populate('assignedBus', 'busNumber capacity');

    if (!student) {
        return next(new AppError('Student not found or access denied', 404));
    }

    if (!student.assignedRoute || !student.assignedBus) {
        return res.status(200).json({
            status: 'success',
            data: {
                tripStatus: 'not started',
                tripId: null,
                tripType: null,
                lastLocation: null,
                student,
                school: student.schoolId,
                route: student.assignedRoute,
                bus: student.assignedBus,
                activity: []
            }
        });
    }

    const trip = await TripRepository.findActiveTripByRouteAndBus(student.assignedRoute._id, student.assignedBus._id);
    
    if (!trip) {
        return res.status(200).json({
            status: 'success',
            data: {
                tripStatus: 'not started',
                tripId: null,
                tripType: null,
                lastLocation: null,
                student,
                school: student.schoolId,
                route: student.assignedRoute,
                bus: student.assignedBus,
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
            tripType: trip.type,
            lastLocation: trip.driverId && trip.driverId.currentLocation ? trip.driverId.currentLocation : null,
            student,
            school: student.schoolId,
            route: student.assignedRoute,
            bus: student.assignedBus,
            activity
        }
    });
});

exports.getStudentAttendance = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const parentId = req.user.id;
    const { month } = req.query; // format YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return next(new AppError('Valid month required in format YYYY-MM', 400));
    }

    const student = await StudentRepository.model.findOne({ _id: id, parentId })
        .populate('schoolId', 'name address phone email')
        .populate('assignedRoute', 'routeName startPoint endPoint')
        .populate('assignedBus', 'busNumber capacity');

    if (!student) {
        return next(new AppError('Student not found or access denied', 404));
    }

    const [year, m] = month.split('-');
    const attendance = await AttendanceRepository.findByStudentAndMonth(id, parseInt(year), parseInt(m));

    res.status(200).json({
        status: 'success',
        results: attendance.length,
        data: { 
            student,
            attendance 
        }
    });
});
