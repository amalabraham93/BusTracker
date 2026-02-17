const SchoolRepository = require('../repositories/SchoolRepository');
const BusRepository = require('../repositories/BusRepository');
const StudentRepository = require('../repositories/StudentRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createSchool = catchAsync(async (req, res, next) => {
    // Only Super Admin can create schools
    const { name, email, password, address } = req.body;

    // Check if email exists
    const existingSchool = await SchoolRepository.findByEmail(email);
    if (existingSchool) {
        return next(new AppError('School with this email already exists', 400));
    }

    const school = await SchoolRepository.create({
        name, email, password, address
    });

    // Remove password from output
    school.password = undefined;

    res.status(201).json({
        status: 'success',
        data: { school }
    });
});

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    // 1. Count Schools
    const schoolCount = await SchoolRepository.model.countDocuments();
    // 2. Count Buses
    const busCount = await BusRepository.model.countDocuments();
    // 3. Count Students
    const studentCount = await StudentRepository.model.countDocuments();

    res.status(200).json({
        status: 'success',
        data: {
            schools: schoolCount,
            buses: busCount,
            students: studentCount
        }
    });
});

exports.getLiveTracking = catchAsync(async (req, res, next) => {
    // Get all drivers who are currently verified and have a location
    // Optionally filter by 'isActive' or 'currentTripId' if we only want drivers on a trip
    const DriverRepository = require('../repositories/DriverRepository');

    // We want drivers with non-null currentLocation
    const drivers = await DriverRepository.model.find({
        currentLocation: { $exists: true },
        isActive: true
    }).select('name phone schoolId currentLocation assignedBus currentTripId')
        .populate('schoolId', 'name')
        .populate('assignedBus', 'busNumber');

    res.status(200).json({
        status: 'success',
        results: drivers.length,
        data: { drivers }
    });
});

exports.getAllAttendance = catchAsync(async (req, res, next) => {
    const { date, schoolId } = req.query;
    const AttendanceRepository = require('../repositories/AttendanceRepository');

    let query = {};

    // Date Filter
    if (date) {
        const queryDate = new Date(date);
        const nextDay = new Date(queryDate);
        nextDay.setDate(queryDate.getDate() + 1);
        query.date = { $gte: queryDate, $lt: nextDay };
    } else {
        // Default to today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        query.date = { $gte: startOfDay };
    }

    // School Filter
    // Attendance doesn't strictly have schoolId, but it has studentId -> schoolId
    // If filtering by school, we need to find students of that school first OR aggregate
    // For performance, let's Aggregate.

    // But first, let's just get the raw list and aggregation for stats.

    // If schoolId is provided, we need to filter students.
    if (schoolId) {
        const studentIds = await StudentRepository.model.find({ schoolId }).distinct('_id');
        query.studentId = { $in: studentIds };
    }

    // A. Statistics (Aggregation)
    const stats = await AttendanceRepository.model.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    // Format stats
    const statsObj = {
        total: 0,
        boarded: 0,
        dropped: 0,
        absent: 0
    };

    stats.forEach(s => {
        statsObj.total += s.count;
        if (s._id === 'Boarded') statsObj.boarded = s.count;
        if (s._id === 'Dropped') statsObj.dropped = s.count;
        if (s._id === 'Absent') statsObj.absent = s.count;
    });

    // B. List Records (populated)
    const attendance = await AttendanceRepository.model.find(query)
        .populate({
            path: 'studentId',
            select: 'name studentRollId schoolId',
            populate: { path: 'schoolId', select: 'name' }
        })
        .populate('tripId', 'busId')
        .sort('-timestamp')
        .limit(100); // Pagination needed in real app

    res.status(200).json({
        status: 'success',
        data: {
            stats: statsObj,
            attendance
        }
    });
});
