import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button, Typography, Link,
    InputAdornment, IconButton, Alert, CircularProgress,
    Container, Grid, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone, PersonAdd } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Register = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError(t('profile.passwordMismatch'));
            return;
        }

        if (formData.password.length < 6) {
            setError(t('profile.passwordShort'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
            });
            navigate('/citizen');
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
                py: 4,
                px: 2,
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
                            {t('auth.registerTitle')}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                            {t('auth.registerSubtitle')}
                        </Typography>
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        label={t('auth.fullName')}
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        type="email"
                                        label={t('auth.email')}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="phone"
                                        label={t('auth.phone')}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="10-digit mobile number"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        label={t('auth.password')}
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock color="action" />
                                                </InputAdornment>
                                            ),
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
                                        fullWidth
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        label={t('profile.confirmPassword')}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAdd />}
                                sx={{ py: 1.5, mt: 3, mb: 2 }}
                            >
                                {loading ? t('auth.registering') : t('auth.registerBtn')}
                            </Button>
                        </form>

                        <Divider sx={{ my: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('common.or', 'OR')}
                            </Typography>
                        </Divider>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {t('auth.alreadyHaveAccount')}{' '}
                                <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
                                    {t('common.login')}
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
