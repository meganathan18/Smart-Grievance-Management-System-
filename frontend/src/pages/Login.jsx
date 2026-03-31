import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button, Typography, Link,
    InputAdornment, IconButton, Alert, CircularProgress,
    Container, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Login as LoginIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Login = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const user = await login(formData.email, formData.password);
            const dashboardMap = {
                citizen: '/citizen',
                officer: '/officer',
                admin: '/admin',
            };
            navigate(dashboardMap[user.role] || '/citizen');
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at top left, #4F46E5 0%, #7C3AED 100%)',
                p: 2,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    width: '150%',
                    height: '150%',
                    background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    top: '-25%',
                    left: '-25%',
                    animation: 'pulse 15s ease-in-out infinite',
                }
            }}
        >
            <Container maxWidth="sm">
                <Card
                    sx={{
                        borderRadius: 6,
                        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.3)',
                        overflow: 'hidden',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                    }}
                    className="scale-in"
                >
                    <Box
                        sx={{
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            py: 5,
                            px: 3,
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1.5, letterSpacing: '-0.02em' }}>
                            {t('auth.welcomeBack')}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                            {t('auth.loginSubtitle')}
                        </Typography>
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                name="email"
                                type="email"
                                label={t('auth.email')}
                                value={formData.email}
                                onChange={handleChange}
                                required
                                sx={{ mb: 3 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                label={t('auth.password')}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                sx={{ mb: 3 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                                sx={{ py: 1.5, mb: 3 }}
                            >
                                {loading ? t('auth.loggingIn') : t('auth.loginBtn')}
                            </Button>
                        </form>

                        <Divider sx={{ my: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('common.or', 'OR')}
                            </Typography>
                        </Divider>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('auth.noAccount')}{' '}
                                <Link component={RouterLink} to="/register" sx={{ fontWeight: 600 }}>
                                    {t('common.register')}
                                </Link>
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Link component={RouterLink} to="/track" sx={{ fontSize: '0.875rem' }}>
                                {t('track.title')}
                            </Link>
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

export default Login;
