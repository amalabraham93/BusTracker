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
    const { busNumber, capacity, assignedDriver } = req.body;

    const bus = await BusRepository.create({
        busNumber, capacity, schoolId, assignedDriver
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
