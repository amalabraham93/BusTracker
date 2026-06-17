const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    parentEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    parentPassword: {
        type: String,
        select: false
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
        },
        name: {
            type: String,
            trim: true
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
});

StudentSchema.index({ pickupLocation: '2dsphere' });
// Compound index for finding students in a school/class
StudentSchema.index({ schoolId: 1, classGrade: 1, section: 1 });

// Pre-save hook to hash password
StudentSchema.pre('save', async function() {
    if (!this.isModified('parentPassword')) return;
    this.parentPassword = await bcrypt.hash(this.parentPassword, 12);
});

// Pre-update hooks to hash password if updating directly
const hashPasswordInUpdate = async function() {
    const update = this.getUpdate();
    if (update && update.parentPassword) {
        if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(update.parentPassword)) {
            update.parentPassword = await bcrypt.hash(update.parentPassword, 12);
        }
    }
};

StudentSchema.pre('findOneAndUpdate', hashPasswordInUpdate);
StudentSchema.pre('updateMany', hashPasswordInUpdate);
StudentSchema.pre('updateOne', hashPasswordInUpdate);

module.exports = mongoose.model('Student', StudentSchema);
