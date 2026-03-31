import React, { useState } from 'react';
import {
    Container, Card, CardContent, Typography, TextField, Button,
    Grid, Avatar, Alert, InputAdornment, IconButton
} from '@mui/material';
import { Person, Email, Phone, Lock, Visibility, VisibilityOff, Save } from '@mui/icons-material';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const Profile = () => {
    const { t } = useTranslation();
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await updateProfile({ name: profileData.name, phone: profileData.phone });
            setSuccess(t('profile.updateSuccess'));
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError(t('profile.passwordMismatch'));
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError(t('profile.passwordShort'));
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.put('/auth/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            setSuccess(t('profile.passwordSuccess'));
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title={t('profile.title')}>
            <Container maxWidth="md" sx={{ py: 3 }}>
                {(success || error) && (
                    <Alert severity={success ? 'success' : 'error'} sx={{ mb: 3 }} onClose={() => { setSuccess(''); setError(''); }}>
                        {success || error}
                    </Alert>
                )}

                {/* Profile Header */}
                <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                        <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 2, fontSize: 40, bgcolor: 'white', color: 'primary.main' }}>
                            {user?.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>{user?.name}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' }}>{user?.role}</Typography>
                    </CardContent>
                </Card>

                {/* Profile Information */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>{t('profile.info')}</Typography>
                        <form onSubmit={handleProfileUpdate}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        label={t('auth.fullName')}
                                        value={profileData.name}
                                        onChange={handleProfileChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        label={t('auth.email')}
                                        value={profileData.email}
                                        disabled
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="phone"
                                        label={t('auth.phone')}
                                        value={profileData.phone}
                                        onChange={handleProfileChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>
                                        {t('profile.updateBtn')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>{t('profile.changePassword')}</Typography>
                        <form onSubmit={handlePasswordUpdate}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="currentPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        label={t('profile.currentPassword')}
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        label={t('profile.newPassword')}
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        name="confirmPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        label={t('profile.confirmPassword')}
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Lock /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Button type="submit" variant="contained" startIcon={<Save />} disabled={loading}>
                                        {t('profile.changePasswordBtn')}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Layout>
    );
};

export default Profile;
