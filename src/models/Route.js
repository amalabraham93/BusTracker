const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: true
    },
    stops: [{
        stopName: String,
        location: {
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
    }],
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    }
});

module.exports = mongoose.model('Route', RouteSchema);
