const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: true
    },
    stops: [{
        type: String,
        trim: true
    }],
    startPoint: {
        type: String,
        trim: true
    },
    endPoint: {
        type: String,
        trim: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Route', RouteSchema);
