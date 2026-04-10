const mongoose = require('mongoose');

const PhoneAuthSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['driver', 'parent'],
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: '10m' } // TTL index: auto-delete after expiry (roughly 10m from createdAt if we use a fixed field, but here we use expiresAt)
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure uniqueness for a phone-role pair
PhoneAuthSchema.index({ phone: 1, role: 1 }, { unique: true });

module.exports = mongoose.model('PhoneAuth', PhoneAuthSchema);
