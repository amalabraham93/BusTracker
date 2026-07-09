const BusRepository = require('../repositories/BusRepository');
const RouteRepository = require('../repositories/RouteRepository');
const StudentRepository = require('../repositories/StudentRepository');
const DriverRepository = require('../repositories/DriverRepository');
const AuditLogRepository = require('../repositories/AuditLogRepository');
const Parent = require('../models/Parent');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// --- BUS MANAGEMENT (SCHOOL) ---

exports.getBuses = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, isDeleted } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === 'true';

    const result = await BusRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['busNumber', 'busId'],
        filter,
        populate: 'assignedDriver assignedRoute'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.createBus = catchAsync(async (req, res, next) => {
    if (req.body.assignedRoute) {
        const route = await RouteRepository.findOne({ _id: req.body.assignedRoute, schoolId: req.user.id });
        if (!route) return next(new AppError('Assigned route not found or access denied', 400));
    }

    const data = { ...req.body, schoolId: req.user.id };
    let bus = await BusRepository.create(data);
    bus = await bus.populate('assignedDriver assignedRoute');
    
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'CREATE',
        resource: 'Bus',
        resourceId: bus._id,
        details: data
    });

    res.status(201).json({ 
        status: 'success', 
        message: 'Bus created successfully!',
        data: { bus } 
    });
});

exports.updateBus = catchAsync(async (req, res, next) => {
    const bus = await BusRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!bus) return next(new AppError('Bus not found or access denied', 404));

    if (req.body.assignedRoute) {
        const route = await RouteRepository.findOne({ _id: req.body.assignedRoute, schoolId: req.user.id });
        if (!route) return next(new AppError('Assigned route not found or access denied', 400));
    }

    let updatedBus = await BusRepository.update(req.params.id, req.body);
    updatedBus = await updatedBus.populate('assignedDriver assignedRoute');

    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Bus',
        resourceId: bus._id,
        details: req.body
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Bus updated successfully!',
        data: { bus: updatedBus } 
    });
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
    res.status(200).json({ 
        status: 'success', 
        message: 'Bus deleted successfully!',
        data: null 
    });
});

exports.hardDeleteBus = catchAsync(async (req, res, next) => {
    const bus = await BusRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!bus) return next(new AppError('Bus not found or access denied', 404));

    await BusRepository.hardDelete(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'HARD_DELETE', resource: 'Bus', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Bus permanently deleted!' });
});

exports.restoreBus = catchAsync(async (req, res, next) => {
    const bus = await BusRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!bus) return next(new AppError('Bus not found or access denied', 404));

    await BusRepository.restore(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'RESTORE', resource: 'Bus', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Bus restored successfully!' });
});

// --- DRIVER MANAGEMENT (SCHOOL) ---

exports.getDrivers = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, isDeleted } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === 'true';

    const result = await DriverRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['name', 'phone', 'licenseNumber', 'email'],
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

    res.status(201).json({ 
        status: 'success', 
        message: 'Driver created successfully!',
        data: { driver } 
    });
});

exports.updateDriver = catchAsync(async (req, res, next) => {
    const driver = await DriverRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!driver) return next(new AppError('Driver not found or access denied', 404));

    const updateData = { ...req.body };
    if (!updateData.password) {
        delete updateData.password;
    }

    const updatedDriver = await DriverRepository.update(req.params.id, updateData);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Driver',
        resourceId: driver._id,
        details: updateData
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Driver updated successfully!',
        data: { driver: updatedDriver } 
    });
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
    res.status(200).json({ 
        status: 'success', 
        message: 'Driver deleted successfully!',
        data: null 
    });
});

exports.hardDeleteDriver = catchAsync(async (req, res, next) => {
    const driver = await DriverRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!driver) return next(new AppError('Driver not found or access denied', 404));

    await DriverRepository.hardDelete(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'HARD_DELETE', resource: 'Driver', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Driver permanently deleted!' });
});

exports.restoreDriver = catchAsync(async (req, res, next) => {
    const driver = await DriverRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!driver) return next(new AppError('Driver not found or access denied', 404));

    await DriverRepository.restore(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'RESTORE', resource: 'Driver', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Driver restored successfully!' });
});

// --- ROUTE MANAGEMENT (SCHOOL) ---

exports.getRoutes = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, isDeleted } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === 'true';

    const result = await RouteRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['routeName'],
        filter
    });

    res.status(200).json({ status: 'success', ...result });
});

const extractName = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return val.name || val.stopName || '';
};

const mapRoutePayload = (body) => {
    const data = { ...body };
    if (data.startPoint) data.startPoint = extractName(data.startPoint);
    if (data.endPoint) data.endPoint = extractName(data.endPoint);
    if (data.stops && Array.isArray(data.stops)) {
        data.stops = data.stops.map(extractName).filter(Boolean);
    }
    return data;
};

exports.createRoute = catchAsync(async (req, res, next) => {
    const data = mapRoutePayload(req.body);
    data.schoolId = req.user.id;
    const route = await RouteRepository.create(data);
    
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'CREATE',
        resource: 'Route',
        resourceId: route._id,
        details: data
    });
    res.status(201).json({ 
        status: 'success', 
        message: 'Route created successfully!',
        data: { route } 
    });
});

exports.updateRoute = catchAsync(async (req, res, next) => {
    const route = await RouteRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!route) return next(new AppError('Route not found or access denied', 404));

    const data = mapRoutePayload(req.body);
    const updatedRoute = await RouteRepository.update(req.params.id, data);
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Route',
        resourceId: route._id,
        details: data
    });
    res.status(200).json({ 
        status: 'success', 
        message: 'Route updated successfully!',
        data: { route: updatedRoute } 
    });
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
    res.status(200).json({ 
        status: 'success', 
        message: 'Route deleted successfully!',
        data: null 
    });
});

exports.hardDeleteRoute = catchAsync(async (req, res, next) => {
    const route = await RouteRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!route) return next(new AppError('Route not found or access denied', 404));

    await RouteRepository.hardDelete(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'HARD_DELETE', resource: 'Route', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Route permanently deleted!' });
});

exports.restoreRoute = catchAsync(async (req, res, next) => {
    const route = await RouteRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!route) return next(new AppError('Route not found or access denied', 404));

    await RouteRepository.restore(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'RESTORE', resource: 'Route', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Route restored successfully!' });
});

exports.getBusesByRoute = catchAsync(async (req, res, next) => {
    const { routeId } = req.params;
    const route = await RouteRepository.findOne({ _id: routeId, schoolId: req.user.id });
    if (!route) return next(new AppError('Route not found or access denied', 404));

    const buses = await BusRepository.findAll({ assignedRoute: routeId, schoolId: req.user.id });
    res.status(200).json({
        status: 'success',
        results: buses.length,
        data: { buses }
    });
});

// --- STUDENT MANAGEMENT (SCHOOL) ---

exports.getStudents = catchAsync(async (req, res, next) => {
    const { page, limit, search, isActive, classGrade, isDeleted } = req.query;
    const filter = { schoolId: req.user.id };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isDeleted !== undefined) filter.isDeleted = isDeleted === 'true';
    if (classGrade) filter.classGrade = classGrade;

    const result = await StudentRepository.findPaged({
        page,
        limit,
        search,
        searchFields: ['name', 'studentRollId', 'parentPhone', 'parentEmail'],
        filter,
        populate: 'assignedBus assignedRoute'
    });

    res.status(200).json({ status: 'success', ...result });
});

exports.getStudentsList = catchAsync(async (req, res, next) => {
    const { classGrade, section, isDeleted } = req.query;
    const filter = { schoolId: req.user.id };
    
    if (classGrade) filter.classGrade = classGrade;
    if (section) filter.section = section;
    if (isDeleted !== undefined) {
        filter.isDeleted = isDeleted === 'true';
    } else {
        filter.isDeleted = { $ne: true };
    }

    const students = await StudentRepository.model.find(filter)
        .populate('assignedBus assignedRoute')
        .sort({ name: 1 });

    res.status(200).json({
        status: 'success',
        results: students.length,
        data: { students }
    });
});

exports.checkParentExists = catchAsync(async (req, res, next) => {
    const { phone, email } = req.query;
    if (!phone && !email) {
        return next(new AppError('Phone number or email is required', 400));
    }
    
    let orQuery = [];
    if (phone) orQuery.push({ phone });
    if (email) orQuery.push({ email: email.toLowerCase().trim() });

    const parent = await Parent.findOne({ $or: orQuery }).select('email phone');
    if (parent) {
        res.status(200).json({ status: 'success', exists: true, parent: { email: parent.email, phone: parent.phone } });
    } else {
        res.status(200).json({ status: 'success', exists: false });
    }
});

exports.createStudent = catchAsync(async (req, res, next) => {
    const { assignedRoute, assignedBus } = req.body;

    if (assignedRoute) {
        const route = await RouteRepository.findOne({ _id: assignedRoute, schoolId: req.user.id });
        if (!route) return next(new AppError('Assigned route not found or access denied', 400));
    }

    if (assignedBus) {
        const bus = await BusRepository.findOne({ _id: assignedBus, schoolId: req.user.id });
        if (!bus) return next(new AppError('Assigned bus not found or access denied', 400));

        if (assignedRoute && bus.assignedRoute && bus.assignedRoute.toString() !== assignedRoute.toString()) {
            return next(new AppError('The selected bus is not assigned to this route', 400));
        }
    }

    const data = { ...req.body, schoolId: req.user.id };
    
    if (req.body.lat !== undefined && req.body.lng !== undefined) {
        data.pickupLocation = {
            type: 'Point',
            coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
        };
        if (req.body.locationName) {
            data.pickupLocation.name = req.body.locationName;
        }
    }

    // Handle Parent mapping
    let parent = null;
    if (req.body.parentPhone) {
        parent = await Parent.findOne({ phone: req.body.parentPhone });
    }
    if (!parent && req.body.parentEmail) {
        parent = await Parent.findOne({ email: req.body.parentEmail.toLowerCase().trim() });
    }

    if (parent) {
        if (req.body.parentPhone && parent.phone !== req.body.parentPhone) {
            return next(new AppError(`Email is already registered with a different phone number (${parent.phone}).`, 400));
        }
        if (req.body.parentEmail && parent.email && parent.email !== req.body.parentEmail.toLowerCase().trim()) {
            return next(new AppError(`Phone number is already registered with a different email (${parent.email}).`, 400));
        }
    } else {
        if (!req.body.parentPhone) {
            return next(new AppError('Parent phone is required', 400));
        }
        if (!req.body.parentPassword) {
            return next(new AppError('Parent password is required for new parents', 400));
        }
        parent = await Parent.create({
            phone: req.body.parentPhone,
            email: req.body.parentEmail,
            password: req.body.parentPassword
        });
    }

    data.parentId = parent._id;
    data.parentEmail = parent.email;
    data.parentPhone = parent.phone;

    let student = await StudentRepository.create(data);
    student = await student.populate('assignedBus assignedRoute');
    
    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'CREATE',
        resource: 'Student',
        resourceId: student._id,
        details: data
    });
    res.status(201).json({ 
        status: 'success', 
        message: 'Student created successfully!',
        data: { student } 
    });
});

exports.updateStudent = catchAsync(async (req, res, next) => {
    const student = await StudentRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!student) return next(new AppError('Student not found or access denied', 404));

    const assignedRoute = req.body.assignedRoute !== undefined ? req.body.assignedRoute : student.assignedRoute;
    const assignedBus = req.body.assignedBus !== undefined ? req.body.assignedBus : student.assignedBus;

    if (assignedRoute) {
        const route = await RouteRepository.findOne({ _id: assignedRoute, schoolId: req.user.id });
        if (!route) return next(new AppError('Assigned route not found or access denied', 400));
    }

    if (assignedBus) {
        const bus = await BusRepository.findOne({ _id: assignedBus, schoolId: req.user.id });
        if (!bus) return next(new AppError('Assigned bus not found or access denied', 400));

        if (assignedRoute && bus.assignedRoute && bus.assignedRoute.toString() !== assignedRoute.toString()) {
            return next(new AppError('The selected bus is not assigned to this route', 400));
        }
    }

    const data = { ...req.body };
    if (req.body.parentPassword) {
        const parent = await Parent.findById(student.parentId);
        if (parent) {
            parent.password = req.body.parentPassword;
            await parent.save();
        }
        delete data.parentPassword;
    }

    if (req.body.lat !== undefined && req.body.lng !== undefined) {
        data.pickupLocation = {
            type: 'Point',
            coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)]
        };
        if (req.body.locationName) {
            data.pickupLocation.name = req.body.locationName;
        }
    }

    // Handle Parent phone/email update if changed
    if (req.body.parentPhone) {
        let parent = await Parent.findOne({ phone: req.body.parentPhone });
        if (!parent) {
             return next(new AppError('Cannot change to a non-existent parent. Please create the parent first or keep the existing phone.', 400));
        }
        if (req.body.parentEmail && parent.email && parent.email !== req.body.parentEmail.toLowerCase().trim()) {
             return next(new AppError(`Phone number is already registered with a different email (${parent.email}).`, 400));
        }
        data.parentId = parent._id;
        data.parentEmail = parent.email;
        data.parentPhone = parent.phone;
    } else if (req.body.parentEmail) {
        let parent = await Parent.findById(student.parentId);
        if (parent && parent.email && parent.email !== req.body.parentEmail.toLowerCase().trim()) {
             return next(new AppError(`Cannot change parent email. Phone number is registered to ${parent.email}.`, 400));
        }
        data.parentEmail = parent ? parent.email : req.body.parentEmail;
    }

    const updatedStudent = await StudentRepository.update(req.params.id, data);
    const populated = await StudentRepository.model.findById(req.params.id)
        .populate('assignedBus assignedRoute');

    await AuditLogRepository.logAction({
        userId: req.user.id,
        userRole: 'school',
        action: 'UPDATE',
        resource: 'Student',
        resourceId: updatedStudent._id,
        details: req.body
    });

    res.status(200).json({ 
        status: 'success', 
        message: 'Student updated successfully!',
        data: { student: populated } 
    });
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
    res.status(200).json({ 
        status: 'success', 
        message: 'Student deleted successfully!',
        data: null 
    });
});

exports.hardDeleteStudent = catchAsync(async (req, res, next) => {
    const student = await StudentRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!student) return next(new AppError('Student not found or access denied', 404));

    await StudentRepository.hardDelete(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'HARD_DELETE', resource: 'Student', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Student permanently deleted!' });
});

exports.restoreStudent = catchAsync(async (req, res, next) => {
    const student = await StudentRepository.findOne({ _id: req.params.id, schoolId: req.user.id });
    if (!student) return next(new AppError('Student not found or access denied', 404));

    await StudentRepository.restore(req.params.id);
    await AuditLogRepository.logAction({ userId: req.user.id, userRole: 'school', action: 'RESTORE', resource: 'Student', resourceId: req.params.id });
    res.status(200).json({ status: 'success', message: 'Student restored successfully!' });
});

exports.getStudentAttendance = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const schoolId = req.user.id;
    const { month } = req.query; // format YYYY-MM
    const AttendanceRepository = require('../repositories/AttendanceRepository');

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return next(new AppError('Valid month required in format YYYY-MM', 400));
    }

    const student = await StudentRepository.model.findOne({ _id: id, schoolId: schoolId })
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

exports.getActiveTrips = catchAsync(async (req, res, next) => {
    const schoolId = req.user.id;
    const TripRepository = require('../repositories/TripRepository');

    // Get active trips and populate driver location for map view
    const activeTrips = await TripRepository.model.find({ schoolId, status: 'Active' })
        .populate('driverId', 'name phone currentLocation')
        .populate('busId', 'busNumber capacity')
        .populate('routeId', 'routeName');

    res.status(200).json({
        status: 'success',
        results: activeTrips.length,
        data: { activeTrips }
    });
});
