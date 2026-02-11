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
        phone = req.user.phone;
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
