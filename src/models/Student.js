const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    studentID: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
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
            required: true
        }
    }
});

StudentSchema.index({ pickupLocation: '2dsphere' });
// Compound index for finding students in a school/class
StudentSchema.index({ schoolId: 1, class: 1, section: 1 });

module.exports = mongoose.model('Student', StudentSchema);
