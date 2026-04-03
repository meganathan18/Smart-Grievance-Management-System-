import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button, Typography, Link,
    InputAdornment, IconButton, Alert, CircularProgress,
    Container, Grid, Divider, LinearProgress
} from '@mui/material';
import {
    Visibility, VisibilityOff, Email, Lock, Person, Phone,
    VerifiedUser, ArrowBack, Refresh
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const OTP_EXPIRY_SECONDS = 600; // 10 minutes

const Register = () => {
    useTranslation();
    const navigate = useNavigate();
    const { registerRequest, registerVerify } = useAuth();

    // Step 1: form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    // Step 2: OTP
    const [step, setStep] = useState(1); // 1 = form, 2 = otp
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const otpRefs = useRef([]);

    // Countdown
    const [countdown, setCountdown] = useState(OTP_EXPIRY_SECONDS);
    const timerRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Start countdown when entering step 2
    useEffect(() => {
        if (step === 2) {
            setCountdown(OTP_EXPIRY_SECONDS);
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [step]);

    const formatCountdown = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    // --- Step 1: Send OTP ---
    const handleSendOtp = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await registerRequest({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
            });
            setStep(2);
            setSuccess(`A 6-digit verification code was sent to ${formData.email}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send verification email.');
        } finally {
            setLoading(false);
        }
    };

    // --- Resend OTP ---
    const handleResend = async () => {
        setResendLoading(true);
        setError('');
        setSuccess('');
        try {
            await registerRequest({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
            });
            setOtp(['', '', '', '', '', '']);
            setCountdown(OTP_EXPIRY_SECONDS);
            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) { clearInterval(timerRef.current); return 0; }
                    return prev - 1;
                });
            }, 1000);
            setSuccess('A new OTP has been sent to your email.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setResendLoading(false);
        }
    };

    // --- OTP digit input handler ---
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            otpRefs.current[5]?.focus();
        }
        e.preventDefault();
    };

    // --- Step 2: Verify OTP ---
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length < 6) {
            setError('Please enter the complete 6-digit code.');
            return;
        }
        if (countdown === 0) {
            setError('OTP has expired. Please request a new one.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const user = await registerVerify(formData.email, otpString);
            navigate(user.role === 'admin' ? '/admin' : user.role === 'officer' ? '/officer' : '/citizen');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Gradient background shared
    const bgStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top left, #4F46E5 0%, #7C3AED 100%)',
        py: 4,
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
            content: '""',
            position: 'absolute',
            width: '150%',
            height: '150%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)',
            top: '-25%',
            left: '-25%',
            animation: 'pulse 15s ease-in-out infinite',
        }
    };

    return (
        <Box sx={bgStyle}>
            <Container maxWidth="sm">
                <Card
                    sx={{
                        borderRadius: 6,
                        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.3)',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.97)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                    }}
                    className="scale-in"
                >
                    {/* Header */}
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            py: step === 2 ? 4 : 5,
                            px: 3,
                            textAlign: 'center',
                            position: 'relative',
                        }}
                    >
                        {step === 2 && (
                            <IconButton
                                onClick={() => { setStep(1); setError(''); setSuccess(''); clearInterval(timerRef.current); }}
                                sx={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'white' }}
                            >
                                <ArrowBack />
                            </IconButton>
                        )}
                        <Box sx={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: 32,
                        }}>
                            {step === 1 ? '📝' : '✉️'}
                        </Box>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
                            {step === 1 ? 'Create Account' : 'Verify Your Email'}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: 15 }}>
                            {step === 1 ? 'Join the Smart Grievance Management System' : `Code sent to ${formData.email}`}
                        </Typography>

                        {/* Step indicator */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
                            {[1, 2].map(s => (
                                <Box key={s} sx={{
                                    width: s === step ? 28 : 10, height: 10,
                                    borderRadius: 5,
                                    background: s === step ? 'white' : 'rgba(255,255,255,0.4)',
                                    transition: 'all 0.3s ease',
                                }} />
                            ))}
                        </Box>
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>
                        )}

                        {/* ───── STEP 1: Registration Form ───── */}
                        {step === 1 && (
                            <form onSubmit={handleSendOtp}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth name="name" label="Full Name"
                                            value={formData.name} onChange={handleChange} required
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><Person color="action" /></InputAdornment>) }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth name="email" type="email" label="Email Address"
                                            value={formData.email} onChange={handleChange} required
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><Email color="action" /></InputAdornment>) }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth name="phone" label="Phone Number (optional)"
                                            value={formData.phone} onChange={handleChange}
                                            placeholder="10-digit mobile number"
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><Phone color="action" /></InputAdornment>) }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            label="Password" value={formData.password}
                                            onChange={handleChange} required
                                            InputProps={{
                                                startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>),
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                        </IconButton>
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth name="confirmPassword"
                                            type={showPassword ? 'text' : 'password'}
                                            label="Confirm Password" value={formData.confirmPassword}
                                            onChange={handleChange} required
                                            InputProps={{ startAdornment: (<InputAdornment position="start"><Lock color="action" /></InputAdornment>) }}
                                        />
                                    </Grid>
                                </Grid>

                                <Button
                                    type="submit" fullWidth variant="contained" size="large"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Email />}
                                    sx={{ py: 1.5, mt: 3, mb: 2, fontWeight: 700, fontSize: 15 }}
                                >
                                    {loading ? 'Sending Verification Code…' : 'Send Verification Code'}
                                </Button>
                            </form>
                        )}

                        {/* ───── STEP 2: OTP Entry ───── */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                                    Enter the 6-digit code sent to your email inbox. Check your spam folder if you don't see it.
                                </Typography>

                                {/* OTP boxes */}
                                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 3 }} onPaste={handleOtpPaste}>
                                    {otp.map((digit, index) => (
                                        <Box
                                            key={index}
                                            component="input"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            ref={el => otpRefs.current[index] = el}
                                            onChange={e => handleOtpChange(index, e.target.value)}
                                            onKeyDown={e => handleOtpKeyDown(index, e)}
                                            sx={{
                                                width: 52, height: 60,
                                                textAlign: 'center',
                                                fontSize: 24, fontWeight: 800,
                                                fontFamily: 'Courier New, monospace',
                                                border: '2px solid',
                                                borderColor: digit ? '#4F46E5' : '#e0e0e0',
                                                borderRadius: 2,
                                                outline: 'none',
                                                background: digit ? '#f0f0ff' : 'white',
                                                color: '#4F46E5',
                                                cursor: 'text',
                                                transition: 'all 0.2s ease',
                                                '&:focus': {
                                                    borderColor: '#7C3AED',
                                                    boxShadow: '0 0 0 3px rgba(124,58,237,0.15)',
                                                    background: '#f5f0ff',
                                                },
                                            }}
                                        />
                                    ))}
                                </Box>

                                {/* Countdown + progress */}
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">Code expires in</Typography>
                                        <Typography variant="caption" fontWeight={700} color={countdown < 60 ? 'error.main' : 'primary.main'}>
                                            {formatCountdown(countdown)}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(countdown / OTP_EXPIRY_SECONDS) * 100}
                                        sx={{
                                            borderRadius: 5, height: 6,
                                            backgroundColor: '#eee',
                                            '& .MuiLinearProgress-bar': {
                                                background: countdown < 60
                                                    ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                                    : 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                                                borderRadius: 5,
                                            }
                                        }}
                                    />
                                </Box>

                                <Button
                                    type="submit" fullWidth variant="contained" size="large"
                                    disabled={loading || otp.join('').length < 6 || countdown === 0}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <VerifiedUser />}
                                    sx={{ py: 1.5, mb: 2, fontWeight: 700, fontSize: 15 }}
                                >
                                    {loading ? 'Verifying…' : 'Verify & Create Account'}
                                </Button>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Didn't receive the code?
                                    </Typography>
                                    <Button
                                        variant="outlined" size="small"
                                        startIcon={resendLoading ? <CircularProgress size={16} /> : <Refresh />}
                                        onClick={handleResend}
                                        disabled={resendLoading || countdown > OTP_EXPIRY_SECONDS - 30}
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {resendLoading ? 'Sending…' : 'Resend OTP'}
                                    </Button>
                                    {countdown > OTP_EXPIRY_SECONDS - 30 && (
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                            Wait {30 - (OTP_EXPIRY_SECONDS - countdown)}s before resending
                                        </Typography>
                                    )}
                                </Box>
                            </form>
                        )}

                        <Divider sx={{ my: 3 }}>
                            <Typography variant="body2" color="text.secondary">OR</Typography>
                        </Divider>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Already have an account?{' '}
                                <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
                                    Sign In
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'rgba(255,255,255,0.8)' }}>
                    Smart Grievance Management System © 2024
                </Typography>
            </Container>
        </Box>
    );
};

export default Register;
