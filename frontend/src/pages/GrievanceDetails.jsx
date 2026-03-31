import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Container, Card, CardContent, Typography, Chip, Grid, Button,
    Divider, LinearProgress, Avatar, TextField, List, ListItem,
    ListItemAvatar, ListItemText, Dialog, DialogTitle, DialogContent,
    DialogActions, Rating
} from '@mui/material';
import {
    ArrowBack, AccessTime, Person, Category, PriorityHigh,
    Send, Business, CheckCircle
} from '@mui/icons-material';
import Layout from '../components/Layout';
import MultimediaPreview from '../components/MultimediaPreview';
import { grievanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const statusColors = {
    pending: 'warning', assigned: 'info', in_progress: 'primary',
    resolved: 'success', closed: 'default', escalated: 'error', rejected: 'error',
};

const priorityColors = {
    low: 'success', normal: 'info', high: 'warning', urgent: 'error',
};

const GrievanceDetails = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [grievance, setGrievance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [feedbackDialog, setFeedbackDialog] = useState(false);
    const [feedback, setFeedback] = useState({ satisfaction: 0, feedback: '' });

    const fetchGrievance = React.useCallback(async () => {
        setLoading(true); // Set loading to true before fetching
        try {
            const response = await grievanceAPI.getById(id);
            setGrievance(response.data.grievance);
        } catch (error) {
            console.error('Error fetching grievance:', error);
        } finally {
            setLoading(false);
        }
    }, [id]); // Dependency on 'id'

    useEffect(() => {
        fetchGrievance();
    }, [fetchGrievance]);

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        setSubmittingComment(true);
        try {
            await grievanceAPI.addComment(id, { text: comment });
            setComment('');
            fetchGrievance();
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleSubmitFeedback = async () => {
        try {
            await grievanceAPI.submitFeedback(id, feedback);
            setFeedbackDialog(false);
            fetchGrievance();
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    if (loading) {
        return <Layout title={t('common.loading')}><LinearProgress /></Layout>;
    }

    if (!grievance) {
        return (
            <Layout title={t('common.noData')}>
                <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="h5">{t('citizen.noGrievances')}</Typography>
                    <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>{t('common.back')}</Button>
                </Container>
            </Layout>
        );
    }

    const InfoItem = ({ icon, label, value, chipColor }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.600', mr: 2, width: 36, height: 36 }}>{icon}</Avatar>
            <Box>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                {chipColor ? (
                    <Chip label={value} size="small" color={chipColor} sx={{ display: 'block', mt: 0.5 }} />
                ) : (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{value}</Typography>
                )}
            </Box>
        </Box>
    );

    return (
        <Layout title={`${t('details.title')} ${grievance.trackingId}`}>
            <Container maxWidth="lg" sx={{ py: 3 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>{t('common.back')}</Button>

                <Grid container spacing={3}>
                    {/* Main Content */}
                    <Grid item xs={12} md={8}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>{grievance.title}</Typography>
                                    <Chip label={t(`common.${grievance.status}`)} color={statusColors[grievance.status]} sx={{ textTransform: 'capitalize' }} />
                                </Box>

                                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary', mb: 2 }}>
                                    {grievance.trackingId}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('details.description')}</Typography>
                                <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
                                    {grievance.description}
                                </Typography>

                                {grievance.location && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>{t('details.location')}</Typography>
                                        <Typography variant="body2">
                                            {[grievance.location.address, grievance.location.city, grievance.location.state, grievance.location.pincode].filter(Boolean).join(', ')}
                                        </Typography>
                                    </>
                                )}

                                <MultimediaPreview
                                    files={grievance.attachments}
                                    voiceMessage={grievance.voiceMessage}
                                />
                            </CardContent>
                        </Card>


                        {/* Comments */}
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{t('details.comments')}</Typography>

                                {grievance.comments?.length === 0 ? (
                                    <Typography color="text.secondary" sx={{ py: 2 }}>{t('details.noComments')}</Typography>
                                ) : (
                                    <List>
                                        {grievance.comments?.map((c, i) => (
                                            <ListItem key={i} alignItems="flex-start" sx={{ px: 0 }}>
                                                <ListItemAvatar>
                                                    <Avatar sx={{ bgcolor: c.user?.role === 'citizen' ? 'primary.main' : 'secondary.main' }}>
                                                        {c.user?.name?.[0] || 'U'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="subtitle2">{c.user?.name}</Typography>
                                                            <Chip label={c.user?.role} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" sx={{ mt: 0.5 }}>{c.text}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(c.createdAt).toLocaleString()}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={t('details.addComment')}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                                    />
                                    <Button variant="contained" startIcon={<Send />} onClick={handleAddComment} disabled={submittingComment}>
                                        {t('common.submit')}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Sidebar */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ mb: 3 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{t('common.details')}</Typography>
                                <InfoItem icon={<Category fontSize="small" />} label={t('common.category')} value={t(`categories.${grievance.category}`, grievance.category?.replace(/_/g, ' '))} />
                                <InfoItem icon={<PriorityHigh fontSize="small" />} label={t('common.priority')} value={t(`common.${grievance.priority}`)} chipColor={priorityColors[grievance.priority]} />
                                <InfoItem icon={<Business fontSize="small" />} label={t('details.department')} value={grievance.department?.name || t('details.notAssigned')} />
                                <InfoItem icon={<Person fontSize="small" />} label={t('details.assignedTo')} value={grievance.assignedTo?.name || t('details.notAssigned')} />
                                <InfoItem icon={<AccessTime fontSize="small" />} label={t('details.submitted')} value={new Date(grievance.createdAt).toLocaleDateString()} />
                            </CardContent>
                        </Card>

                        {/* Feedback */}
                        {user?.role === 'citizen' && ['resolved', 'closed'].includes(grievance.status) && !grievance.resolution?.satisfaction && (
                            <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom><CheckCircle sx={{ color: 'success.main', mr: 1, verticalAlign: 'middle' }} />{t('details.feedbackTitle')}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {t('details.feedbackSubtitle')}
                                    </Typography>
                                    <Button variant="contained" color="success" onClick={() => setFeedbackDialog(true)}>
                                        {t('details.rateExperience')}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {grievance.resolution?.satisfaction && (
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>{t('details.yourFeedback')}</Typography>
                                    <Rating value={grievance.resolution.satisfaction} readOnly />
                                    {grievance.resolution.feedback && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            "{grievance.resolution.feedback}"
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </Grid>
                </Grid>

                {/* Feedback Dialog */}
                <Dialog open={feedbackDialog} onClose={() => setFeedbackDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{t('details.rateTitle')}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography gutterBottom>{t('details.rateSatisfaction')}</Typography>
                            <Rating
                                value={feedback.satisfaction}
                                onChange={(e, value) => setFeedback({ ...feedback, satisfaction: value })}
                                size="large"
                            />
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label={t('details.additionalComments')}
                            value={feedback.feedback}
                            onChange={(e) => setFeedback({ ...feedback, feedback: e.target.value })}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setFeedbackDialog(false)}>{t('common.cancel')}</Button>
                        <Button variant="contained" onClick={handleSubmitFeedback} disabled={!feedback.satisfaction}>{t('common.submit')}</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Layout>
    );
};

export default GrievanceDetails;
