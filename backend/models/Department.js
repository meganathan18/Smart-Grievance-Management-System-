const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    categories: [{
        type: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Department', departmentSchema);
