const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    // Vercel handles CORS locally if configured, but adding basic CORS headers is safe:
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    // 1. Authenticate Request
    const authHeader = req.headers.authorization;
    if (!process.env.INTERNAL_API_SECRET) {
        console.error('INTERNAL_API_SECRET is not configured on Vercel.');
        return res.status(500).json({ success: false, error: 'Server configuration error.' });
    }

    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
        return res.status(401).json({ success: false, error: 'Unauthorized.' });
    }

    // 2. Parse payload
    const { to, subject, html, fromOverride } = req.body;
    if (!to || !subject || !html) {
        return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, html' });
    }

    // 3. Configure Transporter
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('SMTP credentials are not configured on Vercel.');
        return res.status(500).json({ success: false, error: 'SMTP configuration error.' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        family: 4
    });

    const mailOptions = {
        from: fromOverride || `"Smart Grievance System" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    };

    // 4. Send Email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully via Vercel Functions -> %s', info.messageId);
        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Error sending email via Vercel Functions:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
