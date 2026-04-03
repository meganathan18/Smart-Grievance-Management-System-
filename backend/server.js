const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');

// Fix Windows DNS issues (SRV/MongoDB Atlas + Gmail SMTP)
require('dns').setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'smart_grievance',
        resource_type: 'auto', // Important to support audio/video/raw
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp3', 'wav', 'webm', 'ogg', 'pdf', 'doc', 'docx']
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadFields = upload.fields([
    { name: 'attachments', maxCount: 5 },
    { name: 'voice', maxCount: 1 }
]);

const User = require('./models/User');
const Grievance = require('./models/Grievance');
const Department = require('./models/Department');
const { sendOTPEmail, sendStatusUpdateEmail, sendRegistrationOTPEmail } = require('./services/emailService');
const { analyzeGrievance } = require('./services/aiService');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Secure file serving middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    try {
        if (token.startsWith('mock-jwt-token-')) {
            const userId = token.replace('mock-jwt-token-', '');
            const user = await User.findById(userId);
            if (!user) return res.sendStatus(403);
            req.user = user;
            next();
        } else {
            return res.sendStatus(403);
        }
    } catch (error) {
        return res.sendStatus(500);
    }
};

app.get('/api/uploads/:filename', authenticateToken, (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    res.sendFile(filePath);
});

// Basic Route for testing
app.get('/', (req, res) => {
    res.send('Smart Grievance API is running...');
});

// Seed data function
const initializeData = async () => {
    try {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount === 0) {
            await User.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin',
                language: 'en'
            });
            console.log('Seeded admin user');
        }

        const officerCount = await User.countDocuments({ role: 'officer' });
        if (officerCount === 0) {
            await User.create({
                name: 'Officer User',
                email: 'officer@example.com',
                password: 'password123',
                role: 'officer',
                language: 'en'
            });
            console.log('Seeded officer user');
        }

        const deptCount = await Department.countDocuments();
        if (deptCount === 0) {
            await Department.create([
                { name: 'Water Department', code: 'WAT', categories: ['water_supply'] },
                { name: 'Electricity Board', code: 'ELE', categories: ['electricity'] },
                { name: 'Public Works (Roads)', code: 'PWR', categories: ['roads'] },
                { name: 'Sanitation Dept', code: 'SAN', categories: ['sanitation'] },
                { name: 'Public Transport', code: 'TRA', categories: ['public_transport'] }
            ]);
            console.log('Seeded departments');
        }
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

// Temporary in-memory store for pending registrations (OTP not yet verified)
const pendingRegistrations = new Map();

// Auth Routes
// Step 1: Request registration OTP
app.post('/api/auth/register-request', async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

        pendingRegistrations.set(email, { name, email, password, phone, otpCode, otpExpiry });

        const emailResult = await sendRegistrationOTPEmail(email, otpCode, name);
        if (!emailResult.success) {
            return res.status(500).json({ 
                message: 'Failed to send verification email.',
                error: emailResult.error,
                suggestion: 'Please verify your SMTP configuration and ensure App Passwords are correct.'
            });
        }

        res.json({ success: true, message: 'Verification OTP sent to your email.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Step 2: Verify OTP and create account
app.post('/api/auth/register-verify', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const pending = pendingRegistrations.get(email);

        if (!pending) {
            return res.status(400).json({ message: 'No pending registration found. Please request OTP again.' });
        }
        if (pending.otpCode !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }
        if (Date.now() > pending.otpExpiry) {
            pendingRegistrations.delete(email);
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Double-check no account was created in the meantime
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            pendingRegistrations.delete(email);
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const newUser = await User.create({
            name: pending.name,
            email: pending.email,
            password: pending.password,
            phone: pending.phone,
            role: 'citizen',
            language: 'en'
        });

        pendingRegistrations.delete(email);

        res.json({
            token: 'mock-jwt-token-' + newUser._id,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                language: newUser.language
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Legacy register (no OTP — kept for backward compatibility)
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            phone,
            role: 'citizen',
            language: 'en'
        });

        res.json({
            token: 'mock-jwt-token-' + newUser._id,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                language: newUser.language
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            token: 'mock-jwt-token-' + user._id,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                language: user.language
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.otpCode !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        user.otpCode = null;
        user.otpExpiry = null;
        await user.save();

        res.json({
            token: 'mock-jwt-token-' + user._id,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                language: user.language
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            language: req.user.language
        }
    });
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
    const { language, name, phone } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (language) user.language = language;
        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();
        res.json({ user: { ...user.toObject(), password: undefined } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Internal helper for formatting file objects
const formatFile = (file) => ({
    originalName: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    url: file.path // Cloudinary direct URL
});

app.post('/api/grievances', authenticateToken, uploadFields, async (req, res) => {
    let { title, description, category, location, priority, voiceMessage } = req.body;

    if (typeof location === 'string') {
        try {
            location = JSON.parse(location);
        } catch (e) {
            location = {};
        }
    }

    // Sanitize coordinates to prevent Mongoose cast errors
    if (location) {
        if (!location.address || !location.city) {
            return res.status(400).json({ message: 'Location address and city are mandatory.' });
        }
        if (location.latitude === 'null' || location.latitude === '') location.latitude = null;
        if (location.longitude === 'null' || location.longitude === '') location.longitude = null;

        // Ensure they are numbers if they exist
        if (location.latitude !== null && location.latitude !== undefined) {
            location.latitude = Number(location.latitude);
        }
        if (location.longitude !== null && location.longitude !== undefined) {
            location.longitude = Number(location.longitude);
        }
    }

    if (typeof voiceMessage === 'string') {
        try {
            voiceMessage = JSON.parse(voiceMessage);
        } catch (e) {
            voiceMessage = null;
        }
    }

    const attachments = req.files['attachments'] ? req.files['attachments'].map(formatFile) : [];
    const directVoiceFile = req.files['voice'] ? formatFile(req.files['voice'][0]) : null;

    try {
        // AI Analysis
        const aiResults = analyzeGrievance(title, description);
        
        // Auto-assign if "Let AI Suggest" (empty string) or "other" is selected
        const finalCategory = (category === '' || category === 'other') ? aiResults.suggestedCategory : category;
        
        // Auto-elevate priority if AI suggests a higher urgency than 'normal'
        // or if user selected "Let AI Suggest" (empty string)
        let finalPriority = priority || '';
        if (finalPriority === '' || (finalPriority === 'normal' && (aiResults.suggestedPriority === 'high' || aiResults.suggestedPriority === 'urgent'))) {
            finalPriority = (finalPriority === '') ? aiResults.suggestedPriority : finalPriority;
        }
        // Ensure we always have a valid priority
        if (finalPriority === '') finalPriority = 'normal';

        const newGrievance = await Grievance.create({
            trackingId: 'SGMS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            title,
            description,
            category: finalCategory || 'other',
            location,
            status: 'pending',
            priority: finalPriority,
            attachments,
            voiceMessage: directVoiceFile || voiceMessage,
            citizen: req.user.id,
            aiAnalysis: aiResults
        });

        res.status(201).json({ grievance: newGrievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/upload-voice', authenticateToken, upload.single('voice'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No voice file uploaded' });
    }
    res.json({
        message: 'Voice message uploaded successfully',
        file: formatFile(req.file)
    });
});

app.get('/api/grievances', authenticateToken, async (req, res) => {
    const { status, priority, search } = req.query;
    try {
        const query = {};
        if (req.user.role === 'citizen') query.citizen = req.user.id;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { trackingId: { $regex: search, $options: 'i' } }
            ];
        }

        const grievances = await Grievance.find(query).populate('citizen', 'name');
        res.json({ grievances });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/grievances/:id', authenticateToken, async (req, res) => {
    try {
        const grievance = await Grievance.findById(req.params.id)
            .populate('citizen', 'name email')
            .populate('assignedTo', 'name role')
            .populate('department', 'name code');

        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
        res.json({ grievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/grievances/track/:trackingId', async (req, res) => {
    try {
        const grievance = await Grievance.findOne({ trackingId: req.params.trackingId });
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });
        res.json({ grievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/grievances/:id/status', authenticateToken, async (req, res) => {
    const { status, note } = req.body;
    try {
        const grievance = await Grievance.findById(req.params.id).populate('citizen', 'name email');
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.status = status;
        if (note) {
            grievance.comments.push({
                text: `Status updated to ${status}. Note: ${note}`,
                user: { name: req.user.name, role: req.user.role }
            });
        }
        await grievance.save();

        // Send email notification to citizen
        if (grievance.citizen && grievance.citizen.email) {
            sendStatusUpdateEmail(
                grievance.citizen.email,
                grievance.trackingId,
                status,
                grievance.citizen.name,
                note || '',
                grievance.title
            ).then(res => {
                if (!res.success) console.error('Email notification failed:', res.error);
            }).catch(err => console.error('Email notification failed:', err));
        }

        res.json({ grievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/grievances/:id/comments', authenticateToken, async (req, res) => {
    const { text } = req.body;
    try {
        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.comments.push({
            text,
            user: { name: req.user.name, role: req.user.role }
        });
        await grievance.save();
        res.json({ grievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/grievances/:id/escalate', authenticateToken, async (req, res) => {
    try {
        const grievance = await Grievance.findById(req.params.id).populate('citizen', 'name email');
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.status = 'escalated';
        grievance.priority = 'urgent';
        await grievance.save();

        // Notify citizen about escalation
        if (grievance.citizen && grievance.citizen.email) {
            sendStatusUpdateEmail(
                grievance.citizen.email,
                grievance.trackingId,
                'escalated',
                grievance.citizen.name,
                'Your grievance has been escalated for urgent attention.',
                grievance.title
            ).catch(err => console.error('Escalation email failed:', err));
        }

        res.json({ grievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/grievances/:id/feedback', authenticateToken, async (req, res) => {
    const { satisfaction, feedback } = req.body;
    try {
        const grievance = await Grievance.findById(req.params.id).populate('citizen', 'name email');
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.resolution = { satisfaction, feedback };
        grievance.status = 'closed';
        await grievance.save();

        // Notify citizen that grievance is closed
        if (grievance.citizen && grievance.citizen.email) {
            sendStatusUpdateEmail(
                grievance.citizen.email,
                grievance.trackingId,
                'closed',
                grievance.citizen.name,
                'Thank you for your feedback. Your grievance has been closed.',
                grievance.title
            ).catch(err => console.error('Closure email failed:', err));
        }

        res.json({ grievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
    try {
        const total = await Grievance.countDocuments();
        const pending = await Grievance.countDocuments({ status: 'pending' });
        const resolved = await Grievance.countDocuments({ status: 'resolved' });

        const stats = {
            totalGrievances: total,
            pendingGrievances: pending,
            resolvedGrievances: resolved,
            resolutionRate: total ? Math.round((resolved / total) * 100) : 0
        };
        res.json({
            analytics: {
                overview: stats,
                grievancesByStatus: { pending, resolved },
                grievancesByPriority: { normal: total },
                sentimentDistribution: { positive: 0, neutral: total, negative: 0 },
                dailyTrend: []
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/departments', authenticateToken, async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true });
        res.json({ departments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/notifications', authenticateToken, (req, res) => {
    res.json({
        notifications: [
            { _id: 'n1', title: 'Welcome', message: 'Welcome to the Smart Grievance Management System!', isRead: false, createdAt: new Date() }
        ],
        unreadCount: 1
    });
});

app.post('/api/notifications/:id/read', (req, res) => {
    res.json({ success: true });
});




// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_grievance';
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB Connected');
        initializeData();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
    });
