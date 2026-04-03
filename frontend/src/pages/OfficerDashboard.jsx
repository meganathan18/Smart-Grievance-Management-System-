import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Card, CardContent, Typography, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, LinearProgress, Avatar, Select, MenuItem,
    FormControl, InputLabel, TextField, InputAdornment, Dialog,
    DialogTitle, DialogContent, DialogActions, Tabs, Tab, Tooltip, Chip
} from '@mui/material';
import {
    Visibility, Search, Refresh, CheckCircle, Pending, AccessTime,
    Warning, Assignment, ArrowUpward
} from '@mui/icons-material';
import { grievanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';

const statusColors = {
    pending: 'warning',
    assigned: 'info',
    in_progress: 'primary',
    resolved: 'success',
    closed: 'default',
    escalated: 'error',
    rejected: 'error',
};

const priorityColors = {
    low: 'success',
    normal: 'info',
    high: 'warning',
    urgent: 'error',
};

const OfficerDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    useAuth();
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState(0);
    const [filters, setFilters] = useState({
        priority: '',
        search: '',
    });
    const [statusDialog, setStatusDialog] = useState({ open: false, grievance: null });
    const [newStatus, setNewStatus] = useState('');
    const [statusNote, setStatusNote] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchGrievances = React.useCallback(async () => {
        setLoading(true);
        try {
            const statusFilters = {
                0: '', // All
                1: 'assigned',
                2: 'in_progress',
                3: 'resolved',
            };

            const params = {};
            if (statusFilters[selectedTab]) params.status = statusFilters[selectedTab];
            if (filters.priority) params.priority = filters.priority;
            if (filters.search) params.search = filters.search;

            const response = await grievanceAPI.getAll(params);
            setGrievances(response.data.grievances);
        } catch (error) {
            console.error('Error fetching grievances:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedTab, filters.priority, filters.search]);

    useEffect(() => {
        fetchGrievances();
    }, [fetchGrievances]);

    const handleUpdateStatus = async () => {
        if (!statusDialog.grievance || !newStatus) return;

        setUpdating(true);
        try {
            await grievanceAPI.updateStatus(statusDialog.grievance._id, {
                status: newStatus,
                note: statusNote,
            });
            setStatusDialog({ open: false, grievance: null });
            setNewStatus('');
            setStatusNote('');
            fetchGrievances();
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleEscalate = async (grievance) => {
        try {
            await grievanceAPI.escalate(grievance._id, {
                reason: t('officer.escalateDefaultReason', 'Escalated for higher priority attention')
            });
            fetchGrievances();
        } catch (error) {
            console.error('Error escalating:', error);
        }
    };

    const stats = {
        total: grievances.length,
        assigned: grievances.filter(g => g.status === 'assigned').length,
        inProgress: grievances.filter(g => g.status === 'in_progress').length,
        resolved: grievances.filter(g => ['resolved', 'closed'].includes(g.status)).length,
        urgent: grievances.filter(g => g.priority === 'urgent').length,
    };

    const StatCard = ({ title, value, icon, color }) => (
        <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">{title}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color }}>{value}</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>{icon}</Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <Layout title={t('officer.dashboardTitle')}>
            <Container maxWidth="xl" sx={{ py: 3 }}>
                {/* Stats */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={4} md={2.4}>
                        <StatCard title={t('officer.totalAssigned')} value={stats.total} icon={<Assignment />} color="#667eea" />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                        <StatCard title={t('officer.newAssigned')} value={stats.assigned} icon={<Pending />} color="#f59e0b" />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                        <StatCard title={t('common.in_progress')} value={stats.inProgress} icon={<AccessTime />} color="#3b82f6" />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                        <StatCard title={t('common.resolved')} value={stats.resolved} icon={<CheckCircle />} color="#10b981" />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2.4}>
                        <StatCard title={t('common.urgent')} value={stats.urgent} icon={<Warning />} color="#ef4444" />
                    </Grid>
                </Grid>

                {/* Tabs and Filters */}
                <Card sx={{ mb: 3 }}>
                    <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tab label={t('common.all')} />
                        <Tab label={t('officer.newAssigned')} />
                        <Tab label={t('common.in_progress')} />
                        <Tab label={t('common.resolved')} />
                    </Tabs>
                    <CardContent sx={{ py: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={t('common.search')}
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    onKeyPress={(e) => e.key === 'Enter' && fetchGrievances()}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>{t('common.priority')}</InputLabel>
                                    <Select
                                        value={filters.priority}
                                        label={t('common.priority')}
                                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                                    >
                                        <MenuItem value="">{t('common.all')}</MenuItem>
                                        <MenuItem value="urgent">{t('common.urgent')}</MenuItem>
                                        <MenuItem value="high">{t('common.high')}</MenuItem>
                                        <MenuItem value="normal">{t('common.normal')}</MenuItem>
                                        <MenuItem value="low">{t('common.low')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item>
                                <Tooltip title={t('common.refresh')}>
                                    <IconButton onClick={fetchGrievances}><Refresh /></IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Grievances Table */}
                <Card>
                    {loading && <LinearProgress />}
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('common.trackingId')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('common.title')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('common.category')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('officer.citizen')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('common.priority')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{t('common.date')}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">{t('common.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {grievances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                                            <Typography color="text.secondary">{t('citizen.noGrievances')}</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    grievances.map((g) => (
                                        <TableRow key={g._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/grievance/${g._id}`)}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                    {g.trackingId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {g.title}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={t(`categories.${g.category}`, g.category?.replace(/_/g, ' '))} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    sx={{ textTransform: 'capitalize' }} 
                                                />
                                            </TableCell>
                                            <TableCell>{g.citizen?.name || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Chip label={t(`common.${g.priority}`)} size="small" color={priorityColors[g.priority]} sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={t(`common.${g.status}`)} size="small" color={statusColors[g.status]} sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {new Date(g.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                <Tooltip title={t('citizen.viewDetails')}>
                                                    <IconButton size="small" color="primary" onClick={() => navigate(`/grievance/${g._id}`)}>
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title={t('officer.updateStatus')}>
                                                    <IconButton size="small" color="info" onClick={() => { setStatusDialog({ open: true, grievance: g }); setNewStatus(g.status); }}>
                                                        <Assignment fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {g.status !== 'escalated' && (
                                                    <Tooltip title={t('officer.escalate')}>
                                                        <IconButton size="small" color="warning" onClick={() => handleEscalate(g)}>
                                                            <ArrowUpward fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>

                {/* Status Update Dialog */}
                <Dialog open={statusDialog.open} onClose={() => setStatusDialog({ open: false, grievance: null })} maxWidth="sm" fullWidth>
                    <DialogTitle>{t('officer.updateGrievanceStatus')}</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
                            <InputLabel>{t('officer.newStatus')}</InputLabel>
                            <Select value={newStatus} label={t('officer.newStatus')} onChange={(e) => setNewStatus(e.target.value)}>
                                <MenuItem value="in_progress">{t('common.in_progress')}</MenuItem>
                                <MenuItem value="resolved">{t('common.resolved')}</MenuItem>
                                <MenuItem value="rejected">{t('common.rejected')}</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label={t('officer.note')}
                            value={statusNote}
                            onChange={(e) => setStatusNote(e.target.value)}
                            placeholder={t('officer.statusNotePlaceholder')}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setStatusDialog({ open: false, grievance: null })}>{t('common.cancel')}</Button>
                        <Button variant="contained" onClick={handleUpdateStatus} disabled={updating}>
                            {updating ? t('officer.updating') : t('officer.updateStatus')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Layout>
    );
};

export default OfficerDashboard;
