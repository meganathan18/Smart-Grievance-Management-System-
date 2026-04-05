const axios = require('axios');

// Using the production Vercel URL
const VERCEL_API_URL = process.env.VERCEL_API_URL || 'https://smart-grievance-management-system.vercel.app';
const EMAIL_ENDPOINT = `${VERCEL_API_URL}/api/sendEmail`;

const sendEmailViaVercel = async (payload) => {
    if (!process.env.INTERNAL_API_SECRET) {
        console.error('INTERNAL_API_SECRET is missing. Cannot authenticate with Vercel.');
        throw new Error('Email configuration missing.');
    }

    try {
        const response = await axios.post(EMAIL_ENDPOINT, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_API_SECRET}`
            },
            timeout: 10000 // 10 second timeout
        });
        
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Vercel API error:', error.response.data);
            throw new Error(`Vercel API error: ${error.response.data.error || error.response.statusText}`);
        } else {
            console.error('Network error reaching Vercel API:', error.message);
            throw new Error('Network error reaching email service.');
        }
    }
};

const sendRegistrationOTPEmail = async (to, otp, name) => {
    try {
        const subject = 'Verify Your Email – Smart Grievance System';
        const html = `
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
        `;

        await sendEmailViaVercel({ to, subject, html });
        console.log('Registration OTP email routed via Vercel');
        return { success: true };
    } catch (error) {
        console.error('Exception sending registration OTP email:', error.message);
        return { success: false, error: error.message };
    }
};

const sendOTPEmail = async (to, otp) => {
    try {
        const subject = 'Your Login OTP – Smart Grievance System';
        const html = `
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
        `;

        await sendEmailViaVercel({ to, subject, html });
        console.log('OTP Email routed via Vercel');
        return { success: true };
    } catch (error) {
        console.error('Exception sending OTP email:', error.message);
        return { success: false, error: error.message };
    }
};

const sendStatusUpdateEmail = async (to, trackingId, newStatus, citizenName = '', note = '', grievanceTitle = '') => {
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

        const subject = `${cfg.icon} Grievance ${trackingId} — Status: ${cfg.label}`;
        const html = `
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
        `;

        await sendEmailViaVercel({ to, subject, html });
        console.log('Status update email routed via Vercel');
        return { success: true };
    } catch (error) {
        console.error('Exception sending status update email:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendRegistrationOTPEmail,
    sendOTPEmail,
    sendStatusUpdateEmail
};
