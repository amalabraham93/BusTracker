const SchoolRepository = require('../repositories/SchoolRepository');
const BusRepository = require('../repositories/BusRepository');
const RouteRepository = require('../repositories/RouteRepository');
const StudentRepository = require('../repositories/StudentRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// --- SCHOOL MANAGEMENT ---

exports.getSchools = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const result = await SchoolRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['name', 'email', 'schoolID'],
        filter
    });

    res.status(200).json({
        status: 'success',
        ...result
    });
});

exports.createSchool = catchAsync(async (req, res, next) => {
    const { name, email, password, address, schoolID } = req.body;

    const existingSchool = await SchoolRepository.findByEmail(email);
    if (existingSchool) {
        return next(new AppError('School with this email already exists', 400));
    }

    const school = await SchoolRepository.create({
        name, email, password, address, schoolID
    });

    school.password = undefined;

    await AuditLogRepository.logAction({
        userId: 'admin', // Mock admin for now
        userRole: 'admin',
        action: 'CREATE',
        resource: 'School',
        resourceId: school._id,
        details: { name: school.name, schoolID }
    });

    res.status(201).json({
        status: 'success',
        message: 'School created successfully!',
        data: { school }
    });
});

exports.updateSchool = catchAsync(async (req, res, next) => {
    const school = await SchoolRepository.update(req.params.id, req.body);
    if (!school) return next(new AppError('School not found', 404));

    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'UPDATE',
        resource: 'School',
        resourceId: school._id,
        details: req.body
    });

    res.status(200).json({
        status: 'success',
        message: 'School updated successfully!',
        data: { school }
    });
});

exports.deleteSchool = catchAsync(async (req, res, next) => {
    const school = await SchoolRepository.delete(req.params.id);
    if (!school) return next(new AppError('School not found', 404));

    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'DELETE',
        resource: 'School',
        resourceId: req.params.id
    });

    res.status(200).json({
        status: 'success',
        message: 'School deleted successfully!',
        data: null
    });
});

// --- BUS MANAGEMENT (ADMIN) ---

exports.getBuses = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, schoolId } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (schoolId) filter.schoolId = schoolId;

    const result = await BusRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['busNumber'],
        filter,
        populate: 'schoolId assignedDriver assignedRoute'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createBus = catchAsync(async (req, res, next) => {
    const bus = await BusRepository.create(req.body);
    
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'CREATE',
        resource: 'Bus',
        resourceId: bus._id,
        details: req.body
    });

    res.status(201).json({ status: 'success', data: { bus } });
});

exports.updateBus = catchAsync(async (req, res, next) => {
    const bus = await BusRepository.update(req.params.id, req.body);
    if (!bus) return next(new AppError('Bus not found', 404));

    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'UPDATE',
        resource: 'Bus',
        resourceId: bus._id,
        details: req.body
    });

    res.status(200).json({ 
        status: 'success', 
        message: 'Bus updated successfully!',
        data: { bus } 
    });
});

exports.deleteBus = catchAsync(async (req, res, next) => {
    await BusRepository.delete(req.params.id);
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'DELETE',
        resource: 'Bus',
        resourceId: req.params.id
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Bus deleted successfully!',
        data: null 
    });
});

// --- ROUTE MANAGEMENT (ADMIN) ---

exports.getRoutes = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, schoolId } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (schoolId) filter.schoolId = schoolId;

    const result = await RouteRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['routeName'],
        filter,
        populate: 'schoolId'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createRoute = catchAsync(async (req, res, next) => {
    const route = await RouteRepository.create(req.body);
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'CREATE',
        resource: 'Route',
        resourceId: route._id,
        details: req.body
    });
    res.status(201).json({ status: 'success', data: { route } });
});

exports.updateRoute = catchAsync(async (req, res, next) => {
    const route = await RouteRepository.update(req.params.id, req.body);
    if (!route) return next(new AppError('Route not found', 404));
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'UPDATE',
        resource: 'Route',
        resourceId: route._id,
        details: req.body
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Route updated successfully!',
        data: { route } 
    });
});

exports.deleteRoute = catchAsync(async (req, res, next) => {
    await RouteRepository.delete(req.params.id);
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'DELETE',
        resource: 'Route',
        resourceId: req.params.id
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Route deleted successfully!',
        data: null 
    });
});

// --- STUDENT MANAGEMENT (ADMIN) ---

exports.getStudents = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, schoolId, classGrade } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (schoolId) filter.schoolId = schoolId;
    if (classGrade) filter.classGrade = classGrade;

    const result = await StudentRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['name', 'studentRollId', 'parentPhone'],
        filter,
        populate: 'schoolId assignedBus assignedRoute'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createStudent = catchAsync(async (req, res, next) => {
    const student = await StudentRepository.create(req.body);
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'CREATE',
        resource: 'Student',
        resourceId: student._id,
        details: req.body
    });
    res.status(201).json({ status: 'success', data: { student } });
});

exports.updateStudent = catchAsync(async (req, res, next) => {
    const student = await StudentRepository.update(req.params.id, req.body);
    if (!student) return next(new AppError('Student not found', 404));
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'UPDATE',
        resource: 'Student',
        resourceId: student._id,
        details: req.body
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Student updated successfully!',
        data: { student } 
    });
});

exports.deleteStudent = catchAsync(async (req, res, next) => {
    await StudentRepository.delete(req.params.id);
    await AuditLogRepository.logAction({
        userId: 'admin',
        userRole: 'admin',
        action: 'DELETE',
        resource: 'Student',
        resourceId: req.params.id
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Student deleted successfully!',
        data: null 
    });
});

// --- OTHER ADMIN FEATURES ---

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const schoolCount = await SchoolRepository.model.countDocuments();
    const busCount = await BusRepository.model.countDocuments();
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
    const DriverRepository = require('../repositories/DriverRepository');
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

    if (schoolId) {
        const studentIds = await StudentRepository.model.find({ schoolId }).distinct('_id');
        query.studentId = { $in: studentIds };
    }

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
            select: 'name studentRollId schoolId',
            populate: { path: 'schoolId', select: 'name' }
        })
        .populate('tripId', 'busId')
        .sort('-timestamp')
        .limit(100);

    res.status(200).json({
        status: 'success',
        data: { stats: statsObj, attendance }
    });
});
