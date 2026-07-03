const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ParentSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true
    },
    password: {
        type: String,
        select: false
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Pre-save hook to hash password
ParentSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    if (this.password) {
        // Only hash if it's not already a bcrypt hash
        if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password)) {
            this.password = await bcrypt.hash(this.password, 12);
        }
    }
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

ParentSchema.pre('findOneAndUpdate', hashPasswordInUpdate);
ParentSchema.pre('updateMany', hashPasswordInUpdate);
ParentSchema.pre('updateOne', hashPasswordInUpdate);



module.exports = mongoose.model('Parent', ParentSchema);
