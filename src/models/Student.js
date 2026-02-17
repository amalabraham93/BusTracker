const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    studentRollId: { // Renamed from generic studentID for clarity, UI shows "Student ID: RPS-STU-001"
        type: String,
        required: true,
        trim: true
    },
    classGrade: { // Renamed from class (reserved keyword)
        type: String,
        required: true,
        trim: true
    },
    section: {
        type: String,
        required: true
    },
    parentPhone: {
        type: String,
        required: true,
        index: true // Critical for "Super-Parent" feature
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },
    assignedBus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        index: true // For finding all students on a bus
    },
    assignedRoute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        index: true
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0] // Default to 0,0 if not provided
        }
    }
});

StudentSchema.index({ pickupLocation: '2dsphere' });
// Compound index for finding students in a school/class
StudentSchema.index({ schoolId: 1, classGrade: 1, section: 1 });

module.exports = mongoose.model('Student', StudentSchema);
