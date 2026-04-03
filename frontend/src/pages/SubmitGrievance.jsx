import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Card, CardContent, Typography, TextField, Button,
    Grid, FormControl, InputLabel, Select, MenuItem, Alert, Chip,
    LinearProgress, Paper, IconButton, List, ListItem, ListItemIcon,
    ListItemText, Divider
} from '@mui/material';
import {
    Send, AttachFile, Delete, CloudUpload, CheckCircle,
    Category, LocationOn, Title, PriorityHigh, GraphicEq
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { grievanceAPI } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';

import { useTranslation } from 'react-i18next';

const categories = [
    { value: 'water_supply', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'roads', label: 'Roads & Infrastructure' },
    { value: 'sanitation', label: 'Sanitation' },
    { value: 'public_transport', label: 'Public Transport' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'law_enforcement', label: 'Law Enforcement' },
    { value: 'housing', label: 'Housing' },
    { value: 'environment', label: 'Environment' },
    { value: 'corruption', label: 'Corruption' },
    { value: 'other', label: 'Other' },
];

const priorities = [
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'urgent', label: 'Urgent' },
];

const SubmitGrievance = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [trackingId, setTrackingId] = useState('');
    const [locationStatus, setLocationStatus] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        priority: '',
        location: {
            address: '',
            city: '',
            state: '',
            pincode: '',
            latitude: null,
            longitude: null,
        },
        attachments: [],
        voiceMessage: null,
    });

    const getLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not supported by your browser');
            return;
        }

        setLocationStatus('Capturing location...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    }
                }));
                setLocationStatus('Location captured successfully!');
            },
            () => {
                setLocationStatus('Unable to retrieve your location');
            }
        );
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('location.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                location: { ...prev.location, [field]: value },
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        setError('');
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            getLocation();
        }
        const validFiles = files.filter(file => {

            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            return validTypes.includes(file.type) && file.size <= maxSize;
        });

        if (validFiles.length !== files.length) {
            setError('Some files were skipped. Allowed: JPEG, PNG, GIF, PDF, DOC (max 5MB each)');
        }

        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...validFiles].slice(0, 5),
        }));
    };

    const handleVoiceSave = async (file) => {
        try {
            const voiceFormData = new FormData();
            voiceFormData.append('voice', file);

            const response = await grievanceAPI.uploadVoice(voiceFormData);

            setFormData(prev => ({
                ...prev,
                voiceMessage: response.data.file
            }));

            // Trigger location capture if not already done
            if (!formData.location.latitude) {
                getLocation();
            }
        } catch (err) {
            console.error('Failed to upload voice message:', err);
            setError('Failed to upload voice message. Please try again.');
        }
    };

    const removeVoiceMessage = () => {
        setFormData(prev => ({ ...prev, voiceMessage: null }));
    };

    const removeFile = (index) => {
        setFormData(prev => {
            const newAttachments = [...prev.attachments];
            newAttachments.splice(index, 1);
            return { ...prev, attachments: newAttachments };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.location.address || !formData.location.city) {
            setError(t('citizen.formIncomplete', 'Please fill in all required fields, including location address and city.'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Include voice message in description or attachments if needed
            const submissionData = { ...formData };
            if (formData.voiceMessage) {
                submissionData.description += `\n\n[Voice Message Attached: ${formData.voiceMessage.filename}]`;
            }

            const response = await grievanceAPI.create(submissionData);
            setSuccess(true);
            setTrackingId(response.data.grievance.trackingId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit grievance. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Layout title={t('citizen.submitGrievance')}>
                <Container maxWidth="md" sx={{ py: 4 }}>
                    <Card sx={{ textAlign: 'center', py: 6 }}>
                        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                            {t('citizen.submitSuccess', 'Grievance Submitted Successfully!')}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {t('citizen.submitSuccessSubtitle', 'Your grievance has been registered and will be processed shortly.')}
                        </Typography>
                        <Paper sx={{ display: 'inline-block', p: 3, bgcolor: 'grey.100', borderRadius: 2, mb: 4 }}>
                            <Typography variant="body2" color="text.secondary">{t('common.trackingId')}</Typography>
                            <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>
                                {trackingId}
                            </Typography>
                        </Paper>
                        <Box>
                            <Button variant="contained" onClick={() => navigate('/citizen')} sx={{ mr: 2 }}>
                                {t('common.dashboard')}
                            </Button>
                            <Button variant="outlined" onClick={() => { setSuccess(false); setFormData({ title: '', description: '', category: '', location: { address: '', city: '', state: '', pincode: '' }, attachments: [] }); }}>
                                {t('citizen.submitAnother', 'Submit Another')}
                            </Button>
                        </Box>
                    </Card>
                </Container>
            </Layout>
        );
    }

    return (
        <Layout title={t('citizen.submitGrievance')}>
            <Container maxWidth="md" sx={{ py: 3 }}>
                <Card>
                    <Box sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', py: 3, px: 4 }}>
                        <Typography variant="h5" sx={{ color: 'white', fontWeight: 600 }}>
                            {t('citizen.submitNew')}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {t('citizen.submitSubtitle', "Describe your issue and we'll route it to the appropriate department using AI")}
                        </Typography>
                    </Box>

                    {loading && <LinearProgress />}

                    <CardContent sx={{ p: 4 }}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                        )}

                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="title"
                                        label={t('citizen.formTitle')}
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('citizen.formTitlePlaceholder', 'Brief title describing your issue')}
                                        InputProps={{
                                            startAdornment: <Title color="action" sx={{ mr: 1 }} />,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="description"
                                        label={t('citizen.formDescription')}
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        multiline
                                        rows={5}
                                        placeholder={t('citizen.formDescriptionPlaceholder', 'Provide a detailed description of your grievance.')}
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                        💡 {t('citizen.aiInstruction', 'AI will analyze your description to determine category and priority')}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>{t('citizen.formCategory')}</InputLabel>
                                        <Select
                                            name="category"
                                            value={formData.category}
                                            label={t('citizen.formCategory')}
                                            onChange={handleChange}
                                            startAdornment={<Category color="action" sx={{ mr: 1 }} />}
                                        >
                                            <MenuItem value="">{t('categories.letAiSuggest')}</MenuItem>
                                            {categories.map((cat) => (
                                                <MenuItem key={cat.value} value={cat.value}>
                                                    {t(`categories.${cat.value}`, cat.label)}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>


                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }}>
                                        <Chip label={t('common.location')} size="small" />
                                    </Divider>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        name="location.address"
                                        label={t('common.location') + " *"}
                                        value={formData.location.address}
                                        onChange={handleChange}
                                        required
                                        placeholder={t('citizen.formLocationPlaceholder', 'Street address or area name')}
                                        InputProps={{
                                            startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />,
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        name="location.city"
                                        label="City *"
                                        value={formData.location.city}
                                        onChange={handleChange}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        name="location.state"
                                        label="State"
                                        value={formData.location.state}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        name="location.pincode"
                                        label="Pincode"
                                        value={formData.location.pincode}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }}>
                                        <Chip label={t('citizen.formVoice')} size="small" />
                                    </Divider>
                                    <Box sx={{ mt: 1 }}>
                                        {formData.voiceMessage ? (
                                            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(118, 75, 162, 0.05)', border: '1px solid', borderColor: 'primary.light' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <GraphicEq sx={{ mr: 1, color: 'primary.main' }} />
                                                    <Typography variant="body2">{formData.voiceMessage.originalName || formData.voiceMessage.name}</Typography>
                                                </Box>
                                                <IconButton size="small" color="error" onClick={removeVoiceMessage}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Paper>
                                        ) : (
                                            <VoiceRecorder onSave={handleVoiceSave} />
                                        )}
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }}>
                                        <Chip label={t('citizen.formAttachments')} size="small" />
                                    </Divider>
                                </Grid>

                                <Grid item xs={12}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        multiple
                                        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                                        style={{ display: 'none' }}
                                    />
                                    <Button
                                        variant="outlined"
                                        startIcon={<CloudUpload />}
                                        onClick={() => fileInputRef.current.click()}
                                        disabled={formData.attachments.length >= 5}
                                    >
                                        {t('citizen.uploadFiles', 'Upload Files (Max 5)')}
                                    </Button>

                                    {locationStatus && (
                                        <Chip
                                            label={locationStatus}
                                            size="small"
                                            color={locationStatus.includes('successfully') ? 'success' : 'info'}
                                            sx={{ ml: 2 }}
                                        />
                                    )}


                                    {formData.attachments.length > 0 && (
                                        <List dense sx={{ mt: 1 }}>
                                            {formData.attachments.map((file, index) => (
                                                <ListItem
                                                    key={index}
                                                    secondaryAction={
                                                        <IconButton edge="end" onClick={() => removeFile(index)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    }
                                                >
                                                    <ListItemIcon><AttachFile fontSize="small" /></ListItemIcon>
                                                    <ListItemText
                                                        primary={file.name}
                                                        secondary={`${(file.size / 1024).toFixed(1)} KB`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    )}
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            size="large"
                                            startIcon={<Send />}
                                            disabled={loading}
                                            sx={{ flex: 1 }}
                                        >
                                            {loading ? t('citizen.submitting') : t('citizen.submitGrievance')}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="large"
                                            onClick={() => navigate('/citizen')}
                                            disabled={loading}
                                        >
                                            {t('common.cancel')}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Container>
        </Layout>
    );
};

export default SubmitGrievance;
