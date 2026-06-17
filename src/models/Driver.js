const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        select: false
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
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
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

// Pre-save hook to hash password
DriverSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Pre-update hooks to hash password if updating directly
const hashPasswordInUpdate = async function() {
    const update = this.getUpdate();
    if (update && update.password) {
        if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(update.password)) {
            update.password = await bcrypt.hash(update.password, 12);
        }
    }
};

DriverSchema.pre('findOneAndUpdate', hashPasswordInUpdate);
DriverSchema.pre('updateMany', hashPasswordInUpdate);
DriverSchema.pre('updateOne', hashPasswordInUpdate);

module.exports = mongoose.model('Driver', DriverSchema);
