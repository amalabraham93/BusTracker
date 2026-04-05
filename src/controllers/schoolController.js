const BusRepository = require('../repositories/BusRepository');
const RouteRepository = require('../repositories/RouteRepository');
const StudentRepository = require('../repositories/StudentRepository');
const DriverRepository = require('../repositories/DriverRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// --- BUS MANAGEMENT (SCHOOL) ---

exports.getBuses = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const result = await BusRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['busNumber'],
        filter,
        populate: 'assignedDriver assignedRoute'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createBus = catchAsync(async (req, res, next) => {
    const data = { ...req.body, schoolId: req.user.id };
    const bus = await BusRepository.create(data);
    
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'CREATE',
        resource: 'Bus',
        resourceId: bus._id,
        details: data
    });

    res.status(201).json({ status: 'success', data: { bus } });
});

exports.updateBus = catchAsync(async (req, res, next) => {
    const bus = await BusRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!bus) return next(new AppError('Bus not found or access denied', 404));

    const updatedBus = await BusRepository.update(req.params.id, req.body);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Bus',
        resourceId: bus._id,
        details: req.body
    });
    res.status(200).json({ status: 'success', data: { bus: updatedBus } });
});

exports.deleteBus = catchAsync(async (req, res, next) => {
    const bus = await BusRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!bus) return next(new AppError('Bus not found or access denied', 404));

    await BusRepository.delete(req.params.id);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'DELETE',
        resource: 'Bus',
        resourceId: req.params.id
    });
    res.status(204).json({ status: 'success', data: null });
});

// --- DRIVER MANAGEMENT (SCHOOL) ---

exports.getDrivers = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const result = await DriverRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['name', 'phone', 'licenseNumber'],
        filter,
        populate: 'assignedBus'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createDriver = catchAsync(async (req, res, next) => {
    const data = { ...req.body, schoolId: req.user.id };
    const driver = await DriverRepository.create(data);
    
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'CREATE',
        resource: 'Driver',
        resourceId: driver._id,
        details: data
    });

    res.status(201).json({ status: 'success', data: { driver } });
});

exports.updateDriver = catchAsync(async (req, res, next) => {
    const driver = await DriverRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!driver) return next(new AppError('Driver not found or access denied', 404));

    const updatedDriver = await DriverRepository.update(req.params.id, req.body);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Driver',
        resourceId: driver._id,
        details: req.body
    });
    res.status(200).json({ status: 'success', data: { driver: updatedDriver } });
});

exports.deleteDriver = catchAsync(async (req, res, next) => {
    const driver = await DriverRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!driver) return next(new AppError('Driver not found or access denied', 404));

    await DriverRepository.delete(req.params.id);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'DELETE',
        resource: 'Driver',
        resourceId: req.params.id
    });
    res.status(204).json({ status: 'success', data: null });
});

// --- ROUTE MANAGEMENT (SCHOOL) ---

exports.getRoutes = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const result = await RouteRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['routeName'],
        filter
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createRoute = catchAsync(async (req, res, next) => {
    const data = { ...req.body, schoolId: req.user.id };
    const route = await RouteRepository.create(data);
    
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'CREATE',
        resource: 'Route',
        resourceId: route._id,
        details: data
    });
    res.status(201).json({ status: 'success', data: { route } });
});

exports.updateRoute = catchAsync(async (req, res, next) => {
    const route = await RouteRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!route) return next(new AppError('Route not found or access denied', 404));

    const updatedRoute = await RouteRepository.update(req.params.id, req.body);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Route',
        resourceId: route._id,
        details: req.body
    });
    res.status(200).json({ status: 'success', data: { route: updatedRoute } });
});

exports.deleteRoute = catchAsync(async (req, res, next) => {
    const route = await RouteRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!route) return next(new AppError('Route not found or access denied', 404));

    await RouteRepository.delete(req.params.id);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'DELETE',
        resource: 'Route',
        resourceId: req.params.id
    });
    res.status(204).json({ status: 'success', data: null });
});

// --- STUDENT MANAGEMENT (SCHOOL) ---

exports.getStudents = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, classGrade } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (classGrade) filter.classGrade = classGrade;

    const result = await StudentRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['name', 'studentRollId', 'parentPhone'],
        filter,
        populate: 'assignedBus assignedRoute'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createStudent = catchAsync(async (req, res, next) => {
    const data = { ...req.body, schoolId: req.user.id };
    const student = await StudentRepository.create(data);
    
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'CREATE',
        resource: 'Student',
        resourceId: student._id,
        details: data
    });
    res.status(201).json({ status: 'success', data: { student } });
});

exports.updateStudent = catchAsync(async (req, res, next) => {
    const student = await StudentRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!student) return next(new AppError('Student not found or access denied', 404));

    const updatedStudent = await StudentRepository.update(req.params.id, req.body);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Student',
        resourceId: student._id,
        details: req.body
    });
    res.status(200).json({ status: 'success', data: { student: updatedStudent } });
});

exports.deleteStudent = catchAsync(async (req, res, next) => {
    const student = await StudentRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!student) return next(new AppError('Student not found or access denied', 404));

    await StudentRepository.delete(req.params.id);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'DELETE',
        resource: 'Student',
        resourceId: req.params.id
    });
    res.status(204).json({ status: 'success', data: null });
});

// --- DASHBOARD & REPORTS (SCHOOL) ---

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const [busCount, routeCount, studentCount, driverCount] = await Promise.all([
        BusRepository.model.countDocuments({ schoolId }),
        RouteRepository.model.countDocuments({ schoolId }),
        StudentRepository.model.countDocuments({ schoolId }),
        DriverRepository.model.countDocuments({ schoolId })
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            buses: busCount,
            routes: routeCount,
            students: studentCount,
            drivers: driverCount
        }
    });
});

exports.getAttendance = catchAsync(async (req, res, next) => {
    const { date } = req.query;
    const schoolId = req.user.id;
    const AttendanceRepository = require('../repositories/AttendanceRepository');
    
    let query = {};
    if (date) {
        const queryDate = new Date(date);
        const nextDay = new Date(queryDate);
        nextDay.setDate(queryDate.getDate() + 1);
        query.date = { $gte: queryDate, $lt: nextDay };
    } else {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        query.date = { $gte: startOfDay };
    }

    const studentIds = await StudentRepository.model.find({ schoolId }).distinct('_id');
    query.studentId = { $in: studentIds };

    const stats = await AttendanceRepository.model.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const statsObj = { total: 0, boarded: 0, dropped: 0, absent: 0 };
    stats.forEach(s => {
        statsObj.total += s.count;
        if (s._id === 'Boarded') statsObj.boarded = s.count;
        if (s._id === 'Dropped') statsObj.dropped = s.count;
        if (s._id === 'Absent') statsObj.absent = s.count;
    });

    const attendance = await AttendanceRepository.model.find(query)
        .populate({
            path: 'studentId',
            select: 'name studentRollId'
        })
        .populate('tripId', 'busId')
        .sort('-timestamp')
        .limit(100);

    res.status(200).json({
        status: 'success',
        data: { stats: statsObj, attendance }
    });
});

exports.getLiveTracking = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const drivers = await DriverRepository.model.find({
        schoolId,
        currentLocation: { $exists: true },
        isActive: true
    }).select('name phone currentLocation assignedBus currentTripId')
      .populate('assignedBus', 'busNumber');

    res.status(200).json({
        status: 'success',
        results: drivers.length,
        data: { drivers }
    });
});
