const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    userId: {
        type: String, // String or ObjectId depending on role (mock admin vs school ID)
        required: true,
        index: true
    },
    userRole: {
        type: String,
        enum: ['admin', 'school', 'driver', 'parent'],
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'TOGGLE_STATUS', 'LOGIN', 'LOGOUT']
    },
    resource: {
        type: String,
        required: true,
        enum: ['School', 'Bus', 'Route', 'Student', 'Driver', 'Attendance', 'Trip']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
