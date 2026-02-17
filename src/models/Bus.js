const mongoose = require('mongoose');

const BusSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: true,
        unique: true
    },
    capacity: {
        type: Number,
        required: true
    },
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    assignedRoute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route'
    },
    gpsDeviceId: {
        type: String,
        unique: true, // Assuming one device per bus
        sparse: true  // Allows multiple nulls if not all buses have GPS yet
    },
    attender: {
        type: String, // Storing name/phone as string or object. UI just says "Select Attender".
        // If we need more details:
        // type: { name: String, phone: String }
        // For MVP string is fine.
    }
});

module.exports = mongoose.model('Bus', BusSchema);
