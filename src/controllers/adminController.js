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
