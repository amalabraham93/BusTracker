const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true // Important for lookup
    },
    otpSecret: {
        type: String,
        select: false
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0] // [longitude, latitude]
        }
    },
    isActive: {
        type: Boolean,
        default: false
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true // For filtering by school
    },
    assignedBus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus'
    },
    currentTripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip'
    }
});

// Geospatial index for proximity searches
DriverSchema.index({ currentLocation: '2dsphere' });
// Compound index if we frequently search drivers by school
DriverSchema.index({ schoolId: 1, isActive: 1 });

module.exports = mongoose.model('Driver', DriverSchema);
