const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const multer = require('multer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer setup for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
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
                { name: 'Public Works (Roads)', code: 'PWR', categories: ['roads'] }
            ]);
            console.log('Seeded departments');
        }
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

// Auth Routes
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
            password, // In a real app, this would be hashed
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
    url: `/api/uploads/${file.filename}`
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
        const newGrievance = await Grievance.create({
            trackingId: 'SGMS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            title,
            description,
            category: category || 'General',
            location,
            status: 'pending',
            priority: priority || 'normal',
            attachments,
            voiceMessage: directVoiceFile || voiceMessage,
            citizen: req.user.id
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
        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.status = status;
        if (note) {
            grievance.comments.push({
                text: `Status updated to ${status}. Note: ${note}`,
                user: { name: req.user.name, role: req.user.role }
            });
        }
        await grievance.save();
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
        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.status = 'escalated';
        grievance.priority = 'urgent';
        await grievance.save();
        res.json({ grievance });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/grievances/:id/feedback', authenticateToken, async (req, res) => {
    const { satisfaction, feedback } = req.body;
    try {
        const grievance = await Grievance.findById(req.params.id);
        if (!grievance) return res.status(404).json({ message: 'Grievance not found' });

        grievance.resolution = { satisfaction, feedback };
        grievance.status = 'closed';
        await grievance.save();
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
