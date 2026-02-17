const DriverRepository = require('../repositories/DriverRepository');
const BusRepository = require('../repositories/BusRepository');
const RouteRepository = require('../repositories/RouteRepository');
const StudentRepository = require('../repositories/StudentRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createDriver = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const { name, licenseNumber, phone, assignedBus } = req.body;

    const driver = await DriverRepository.create({
        name, licenseNumber, phone, schoolId, assignedBus
    });

    res.status(201).json({ status: 'success', data: { driver } });
});

exports.createBus = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const { busNumber, capacity, assignedDriver, assignedRoute, gpsDeviceId, attender } = req.body;

    const bus = await BusRepository.create({
        busNumber, capacity, schoolId, assignedDriver, assignedRoute, gpsDeviceId, attender
    });

    res.status(201).json({ status: 'success', data: { bus } });
});

exports.createRoute = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const { routeName, stops } = req.body;

    const route = await RouteRepository.create({
        routeName, stops, schoolId
    });

    res.status(201).json({ status: 'success', data: { route } });
});

exports.createStudent = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    // req.body should invoke studentRollId and classGrade
    const data = { ...req.body, schoolId };

    const student = await StudentRepository.create(data);

    res.status(201).json({ status: 'success', data: { student } });
});

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;

    // 1. Count Routes
    const routeCount = await RouteRepository.model.countDocuments({ schoolId });
    // 2. Count Buses
    const busCount = await BusRepository.model.countDocuments({ schoolId });
    // 3. Count Students
    const studentCount = await StudentRepository.model.countDocuments({ schoolId });
    // 4. Count Drivers
    const driverCount = await DriverRepository.model.countDocuments({ schoolId });

    res.status(200).json({
        status: 'success',
        data: {
            routes: routeCount,
            buses: busCount,
            students: studentCount,
            drivers: driverCount
        }
    });
});

exports.getAttendance = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const { date } = req.query;
    const AttendanceRepository = require('../repositories/AttendanceRepository');

    // 1. Date Filter
    let dateQuery = {};
    if (date) {
        const queryDate = new Date(date);
        const nextDay = new Date(queryDate);
        nextDay.setDate(queryDate.getDate() + 1);
        dateQuery = { $gte: queryDate, $lt: nextDay };
    } else {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        dateQuery = { $gte: startOfDay };
    }

    // 2. Find students of this school
    const studentIds = await StudentRepository.model.find({ schoolId }).distinct('_id');

    // 3. Build Main Query
    const query = {
        studentId: { $in: studentIds },
        date: dateQuery
    };

    // 4. Statistics (Aggregation)
    const stats = await AttendanceRepository.model.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

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

    // 5. List Records
    const attendance = await AttendanceRepository.model.find(query)
        .populate('studentId', 'name studentRollId classGrade section')
        .populate('tripId', 'busId')
        .sort('-timestamp');

    res.status(200).json({
        status: 'success',
        results: attendance.length,
        data: {
            stats: statsObj,
            attendance
        }
    });
});

exports.getLiveTracking = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const DriverRepository = require('../repositories/DriverRepository');

    // Find active drivers for this school
    const drivers = await DriverRepository.model.find({
        schoolId: schoolId,
        currentLocation: { $exists: true },
        isActive: true
    }).select('name phone currentLocation assignedBus currentTripId')
        .populate('assignedBus', 'busNumber assignedRoute')
        .populate({
            path: 'assignedBus',
            populate: { path: 'assignedRoute', select: 'routeName' }
        });

    res.status(200).json({
        status: 'success',
        results: drivers.length,
        data: { drivers }
    });
});

// --- LIST ENDPOINTS FOR MANAGEMENT UI ---

exports.getDrivers = catchAsync(async (req, res, next) => {
    const drivers = await DriverRepository.model.find({ schoolId: req.user.id })
        .populate('assignedBus', 'busNumber');

    res.status(200).json({ status: 'success', results: drivers.length, data: { drivers } });
});

exports.getBuses = catchAsync(async (req, res, next) => {
    const buses = await BusRepository.model.find({ schoolId: req.user.id })
        .populate('assignedDriver', 'name phone')
        .populate('assignedRoute', 'routeName');

    res.status(200).json({ status: 'success', results: buses.length, data: { buses } });
});

exports.getRoutes = catchAsync(async (req, res, next) => {
    const routes = await RouteRepository.model.find({ schoolId: req.user.id });

    res.status(200).json({ status: 'success', results: routes.length, data: { routes } });
});

exports.getStudents = catchAsync(async (req, res, next) => {
    const students = await StudentRepository.model.find({ schoolId: req.user.id })
        .populate('assignedBus', 'busNumber')
        .populate('assignedRoute', 'routeName');

    res.status(200).json({ status: 'success', results: students.length, data: { students } });
});
