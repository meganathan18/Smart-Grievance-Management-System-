const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['citizen', 'officer', 'admin'],
        default: 'citizen'
    },
    language: {
        type: String,
        default: 'en'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    otpCode: {
        type: String,
        default: null
    },
    otpExpiry: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
