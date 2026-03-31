const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
    trackingId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'General'
    },
    location: {
        address: String,
        city: String,
        state: String,
        pincode: String,
        latitude: Number,
        longitude: Number
    },
    status: {
        type: String,
        enum: ['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'escalated', 'rejected'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'medium', 'high', 'urgent'],
        default: 'normal'
    },
    attachments: [{
        originalName: String,
        filename: String,
        mimetype: String,
        size: Number,
        url: String
    }],
    voiceMessage: {
        originalName: String,
        filename: String,
        mimetype: String,
        size: Number,
        url: String
    },
    citizen: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department'
    },
    comments: [{
        text: String,
        user: {
            name: String,
            role: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    resolution: {
        satisfaction: Number,
        feedback: String
    },
    aiAnalysis: {
        sentiment: String,
        urgencyScore: Number,
        suggestedCategory: String,
        confidence: Number,
        keywords: [String]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Grievance', grievanceSchema);
