const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    date: {
        type: Date,
        default: Date.now,
        index: true // For daily reports
    },
    status: {
        type: String,
        enum: ['Boarded', 'Dropped', 'Absent'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Compound index for uniqueness (one status per trip per student? or multiple updates allowed?)
// Usually we want to quickly find attendance for a student on a specific date
AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ tripId: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
