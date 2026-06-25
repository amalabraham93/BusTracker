const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SchoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true,
        select: false // Do not return password by default
    },
    address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: [true, 'School phone number is required'],
        validate: {
            validator: function(v) {
                if(!v) return false;
                const stripped = v.replace(/[\s-]/g, '');
                return /^(\+91|91|0)?[6789]\d{9}$/.test(stripped);
            },
            message: props => `${props.value} is not a valid Indian phone number!`
        }
    },
    schoolID: {
        type: String,
        unique: true,
        sparse: true, // Optional for existing ones, required for new
        index: true
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
    },
    otp: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date,
        select: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for searching schools, though usually by ID or Email
SchoolSchema.index({ name: 'text' });

// Pre-save hook to hash password
SchoolSchema.pre('save', async function() {
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

SchoolSchema.pre('findOneAndUpdate', hashPasswordInUpdate);
SchoolSchema.pre('updateMany', hashPasswordInUpdate);
SchoolSchema.pre('updateOne', hashPasswordInUpdate);

module.exports = mongoose.model('School', SchoolSchema);
