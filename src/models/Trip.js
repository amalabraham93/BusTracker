const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled'],
        default: 'Active',
        index: true
    },
    path: [{
        lat: Number,
        lng: Number,
        timestamp: Date
    }]
});

TripSchema.index({ driverId: 1, status: 1 });
TripSchema.index({ schoolId: 1, status: 1 });

module.exports = mongoose.model('Trip', TripSchema);
