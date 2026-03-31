import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box, Container, Card, CardContent, Typography, TextField, Button,
    Stepper, Step, StepLabel, Chip, Paper, Divider, Alert, InputAdornment
} from '@mui/material';
import { Search, AccessTime, ArrowForward } from '@mui/icons-material';
import { grievanceAPI } from '../services/api';
import { useTranslation } from 'react-i18next';


const getStepIndex = (status) => {
    const map = { pending: 0, assigned: 1, in_progress: 2, resolved: 3, closed: 3, escalated: 2 };
    return map[status] || 0;
};

const TrackGrievance = () => {
    const { t } = useTranslation();
    const [trackingId, setTrackingId] = useState('');
    const [grievance, setGrievance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!trackingId.trim()) {
            setError(t('track.enterId'));
            return;
        }
        setLoading(true);
        setError('');
        setGrievance(null);

        try {
            const response = await grievanceAPI.track(trackingId.trim());
            setGrievance(response.data.grievance);
        } catch (err) {
            setError(err.response?.data?.message || t('track.notFound'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                        {t('track.title')}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {t('track.subtitle')}
                    </Typography>
                </Box>

                <Card sx={{ mb: 4, overflow: 'visible' }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                value={trackingId}
                                onChange={(e) => { setTrackingId(e.target.value.toUpperCase()); setError(''); }}
                                placeholder={t('track.placeholder')}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search color="action" />
                                        </InputAdornment>
                                    ),
                                    sx: { fontSize: '1.1rem', fontFamily: 'monospace' }
                                }}
                            />
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleSearch}
                                disabled={loading}
                                sx={{ px: 4 }}
                            >
                                {loading ? t('track.tracking') : t('track.trackBtn')}
                            </Button>
                        </Box>

                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </CardContent>
                </Card>

                {grievance && (
                    <Card className="fade-in">
                        <CardContent sx={{ p: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>{grievance.title}</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                                        {grievance.trackingId}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={t(`common.${grievance.status}`)}
                                    color={grievance.status === 'resolved' || grievance.status === 'closed' ? 'success' : grievance.status === 'escalated' ? 'error' : 'primary'}
                                    sx={{ textTransform: 'capitalize' }}
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('track.progress')}</Typography>
                            <Stepper activeStep={getStepIndex(grievance.status)} alternativeLabel sx={{ mb: 4 }}>
                                {['pending', 'assigned', 'in_progress', 'resolved'].map((status) => (
                                    <Step key={status}>
                                        <StepLabel>{t(`common.${status}`)}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('track.history')}</Typography>
                                {grievance.statusHistory?.length > 0 ? (
                                    grievance.statusHistory.map((history, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
                                            <AccessTime fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                <strong style={{ textTransform: 'capitalize' }}>{t(`common.${history.status}`)}</strong>
                                                {' - '}
                                                {new Date(history.changedAt).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    ))
                                ) : (
                                    <Typography variant="body2" color="text.secondary">No history available</Typography>
                                )}
                            </Paper>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Paper sx={{ flex: 1, p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="caption" color="text.secondary">{t('common.category')}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                                        {t(`categories.${grievance.category}`, grievance.category?.replace(/_/g, ' '))}
                                    </Typography>
                                </Paper>
                                <Paper sx={{ flex: 1, p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="caption" color="text.secondary">{t('common.priority')}</Typography>
                                    <Chip label={t(`common.${grievance.priority}`)} size="small" color={grievance.priority === 'urgent' ? 'error' : grievance.priority === 'high' ? 'warning' : 'default'} sx={{ mt: 0.5 }} />
                                </Paper>
                                <Paper sx={{ flex: 1, p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="caption" color="text.secondary">{t('details.department')}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{grievance.department?.name || t('common.pending')}</Typography>
                                </Paper>
                                <Paper sx={{ flex: 1, p: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="caption" color="text.secondary">{t('details.submitted')}</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{new Date(grievance.createdAt).toLocaleDateString()}</Typography>
                                </Paper>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                        {t('track.haveAccount')}
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/login"
                        variant="outlined"
                        endIcon={<ArrowForward />}
                        sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        {t('track.loginToDashboard')}
                    </Button>
                </Box>
            </Container>
        </Box>
    );
};

export default TrackGrievance;
