const nodemailer = require('nodemailer');

const createTransporter = () => {
    // Switching to Port 465 (SMTPS) as port 587 may be blocked in some regions on Render's network.
    // Adding debug/logger to capture detailed connection steps in the hosted logs.
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // Use SSL
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        connectionTimeout: 20000, // 20 seconds
        greetingTimeout: 20000,   // 20 seconds
        debug: true,              // Enable debug output
        logger: true              // Log to console
    });
};

const sendRegistrationOTPEmail = async (to, otp, name) => {
    const transporter = createTransporter();
    try {
        const mailOptions = {
            from: `"Smart Grievance System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject: 'Verify Your Email – Smart Grievance System',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background-color: #f0f4ff;">
                    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(79,70,229,0.15);">
                        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">✉️ Verify Your Email</h1>
                            <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 16px;">Smart Grievance Management System</p>
                        </div>
                        <div style="padding: 40px 36px;">
                            <p style="font-size: 17px; color: #333; margin-top: 0;">Hello <strong>${name || 'there'}</strong>,</p>
                            <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                Thank you for registering! Please use the verification code below to complete your account creation.
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 12px; padding: 18px 40px;">
                                    <span style="font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                                </div>
                            </div>
                            <p style="font-size: 14px; color: #888; text-align: center;">⏱️ This code expires in <strong>10 minutes</strong>.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />
                            <p style="font-size: 13px; color: #aaa; text-align: center;">If you did not create an account, you can safely ignore this email.<br/>Do not share this code with anyone.</p>
                        </div>
                        <div style="background: #f8f9fc; padding: 20px; text-align: center;">
                            <p style="font-size: 12px; color: #bbb; margin: 0;">© 2024 Smart Grievance Management System. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Registration OTP email sent: %s', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Error sending registration OTP email:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        return { success: false, error: error.message };
    }
};

const sendOTPEmail = async (to, otp) => {
    const transporter = createTransporter();
    try {
        const mailOptions = {
            from: `"Smart Grievance System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject: 'Your Login OTP – Smart Grievance System',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; background-color: #f0f4ff;">
                    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(79,70,229,0.15);">
                        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🔐 Login Verification</h1>
                            <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0; font-size: 16px;">Smart Grievance Management System</p>
                        </div>
                        <div style="padding: 40px 36px;">
                            <p style="font-size: 17px; color: #333; margin-top: 0;">Hello,</p>
                            <p style="font-size: 15px; color: #555; line-height: 1.6;">
                                Your One-Time Password (OTP) for login is:
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <div style="display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 12px; padding: 18px 40px;">
                                    <span style="font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                                </div>
                            </div>
                            <p style="font-size: 14px; color: #888; text-align: center;">⏱️ This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />
                            <p style="font-size: 13px; color: #aaa; text-align: center;">If you did not request this, please ignore this email.</p>
                        </div>
                        <div style="background: #f8f9fc; padding: 20px; text-align: center;">
                            <p style="font-size: 12px; color: #bbb; margin: 0;">© 2024 Smart Grievance Management System. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP Email sent: %s', info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Error sending OTP email:', {
            message: error.message,
            code: error.code
        });
        return { success: false, error: error.message };
    }
};

const sendStatusUpdateEmail = async (to, trackingId, newStatus, citizenName = '', note = '', grievanceTitle = '') => {
    const transporter = createTransporter();
    try {
        const statusConfig = {
            pending:     { color: '#F59E0B', bg: '#FFFBEB', icon: '🕐', label: 'Pending Review' },
            assigned:    { color: '#6366F1', bg: '#EEF2FF', icon: '👤', label: 'Assigned' },
            in_progress: { color: '#3B82F6', bg: '#EFF6FF', icon: '⚙️', label: 'In Progress' },
            resolved:    { color: '#10B981', bg: '#ECFDF5', icon: '✅', label: 'Resolved' },
            closed:      { color: '#6B7280', bg: '#F9FAFB', icon: '🔒', label: 'Closed' },
            escalated:   { color: '#EF4444', bg: '#FEF2F2', icon: '🚨', label: 'Escalated' },
            rejected:    { color: '#DC2626', bg: '#FEF2F2', icon: '❌', label: 'Rejected' },
        };
        const cfg = statusConfig[newStatus] || { color: '#4F46E5', bg: '#EEF2FF', icon: '📋', label: newStatus };

        const noteSection = note ? `
            <div style="background: #f8f9fc; border-left: 4px solid ${cfg.color}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
                <p style="font-size: 13px; font-weight: 700; color: #555; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.5px;">Note from the officer</p>
                <p style="font-size: 15px; color: #333; margin: 0; line-height: 1.6;">${note}</p>
            </div>` : '';

        const titleSection = grievanceTitle ? `<p style="font-size: 14px; color: #888; text-align: center; margin-top: -12px; margin-bottom: 24px;">📄 ${grievanceTitle}</p>` : '';

        const mailOptions = {
            from: `"Smart Grievance System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to,
            subject: `${cfg.icon} Grievance ${trackingId} — Status: ${cfg.label}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f0f4ff; padding: 0; margin: 0;">
                    <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(79,70,229,0.15);">

                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 36px 30px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 12px;">${cfg.icon}</div>
                            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Grievance Status Update</h1>
                            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Smart Grievance Management System</p>
                        </div>

                        <!-- Body -->
                        <div style="padding: 36px;">
                            <p style="font-size: 17px; color: #333; margin-top: 0;">
                                Hello <strong>${citizenName || 'Citizen'}</strong>,
                            </p>
                            <p style="font-size: 15px; color: #555; line-height: 1.7;">
                                Your grievance <strong style="color: #4F46E5;">${trackingId}</strong> has been updated.
                            </p>

                            ${titleSection}

                            <!-- Status Badge -->
                            <div style="text-align: center; margin: 28px 0;">
                                <div style="display: inline-block; background: ${cfg.bg}; border: 2px solid ${cfg.color}; border-radius: 50px; padding: 14px 40px;">
                                    <span style="font-size: 18px; font-weight: 800; color: ${cfg.color}; text-transform: uppercase; letter-spacing: 3px;">${cfg.label}</span>
                                </div>
                            </div>

                            ${noteSection}

                            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 24px;">
                                Log in to your dashboard to view full details and track progress.
                            </p>

                            <!-- Tracking ID box -->
                            <div style="background: #f8f9fc; border-radius: 10px; padding: 16px; text-align: center; margin-top: 24px;">
                                <p style="font-size: 12px; color: #aaa; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Tracking ID</p>
                                <p style="font-size: 20px; font-weight: 800; color: #4F46E5; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 2px;">${trackingId}</p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="background: #f8f9fc; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                            <p style="font-size: 12px; color: #bbb; margin: 0;">
                                © 2024 Smart Grievance Management System. All rights reserved.<br/>
                                This is an automated notification — please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Status update email sent to %s: %s', to, info.messageId);
        return { success: true };
    } catch (error) {
        console.error('Error sending status update email:', {
            message: error.message,
            code: error.code
        });
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendRegistrationOTPEmail,
    sendOTPEmail,
    sendStatusUpdateEmail
};
