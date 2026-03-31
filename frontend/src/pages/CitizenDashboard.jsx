import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Card, CardContent, Typography, Button, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, LinearProgress, Avatar, Tooltip, TextField,
    InputAdornment, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
    Add, Visibility, Search, Refresh, AccessTime,
    CheckCircle, Pending, Assignment
} from '@mui/icons-material';
import Layout from '../components/Layout';
import { grievanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

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

const CitizenDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
    });
    const [filters, setFilters] = useState({
        search: '',
        status: '',
    });

    const fetchGrievances = React.useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.search) params.search = filters.search;

            const response = await grievanceAPI.getAll(params);
            const data = response.data.grievances;
            setGrievances(data);

            // Calculate stats
            setStats({
                total: data.length,
                pending: data.filter(g => ['pending', 'assigned'].includes(g.status)).length,
                inProgress: data.filter(g => g.status === 'in_progress').length,
                resolved: data.filter(g => ['resolved', 'closed'].includes(g.status)).length,
            });
        } catch (error) {
            console.error('Error fetching grievances:', error);
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.search]);

    useEffect(() => {
        fetchGrievances();
    }, [fetchGrievances]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            fetchGrievances();
        }
    };

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: `0 12px 24px ${color}15`,
                }
            }}
            className="scale-in"
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t(title)}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, color, mb: 0.5, letterSpacing: '-0.02em' }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, mr: 1 }} />
                                {t(subtitle)}
                            </Typography>
                        )}
                    </Box>
                    <Avatar
                        sx={{
                            bgcolor: `${color}15`,
                            color,
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            border: `1px solid ${color}20`
                        }}
                    >
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
            {/* Decorative background circle */}
            <Box
                sx={{
                    position: 'absolute',
                    bottom: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
                    zIndex: 0
                }}
            />
        </Card>
    );

    return (
        <Layout title={t('common.dashboard')}>
            <Container maxWidth="xl" sx={{ py: 3 }}>
                {/* Welcome Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                        {t('citizen.welcomeBack')}, {user?.name?.split(' ')[0]}! 👋
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        {t('citizen.dashboardSubtitle')}
                    </Typography>
                </Box>

                {/* Stats Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="citizen.totalGrievances"
                            value={stats.total}
                            icon={<Assignment />}
                            color="#4F46E5"
                            subtitle="citizen.allTimeSubmissions"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="common.pending"
                            value={stats.pending}
                            icon={<Pending />}
                            color="#F59E0B"
                            subtitle="citizen.awaitingAction"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="common.in_progress"
                            value={stats.inProgress}
                            icon={<AccessTime />}
                            color="#3B82F6"
                            subtitle="citizen.currentlyActive"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="common.resolved"
                            value={stats.resolved}
                            icon={<CheckCircle />}
                            color="#10B981"
                            subtitle="citizen.successfullyClosed"
                        />
                    </Grid>
                </Grid>

                {/* Actions and Filters */}
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={4}>
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => navigate('/citizen/submit')}
                                    size="large"
                                    fullWidth
                                    sx={{ height: 56 }}
                                >
                                    {t('citizen.submitNew')}
                                </Button>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    placeholder={t('common.search')}
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    onKeyPress={handleSearch}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('common.status')}</InputLabel>
                                    <Select
                                        value={filters.status}
                                        label={t('common.status')}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    >
                                        <MenuItem value="">{t('common.all')}</MenuItem>
                                        <MenuItem value="pending">{t('common.pending')}</MenuItem>
                                        <MenuItem value="assigned">{t('common.assigned')}</MenuItem>
                                        <MenuItem value="in_progress">{t('common.in_progress')}</MenuItem>
                                        <MenuItem value="resolved">{t('common.resolved')}</MenuItem>
                                        <MenuItem value="closed">{t('common.closed')}</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Tooltip title={t('common.refresh')}>
                                    <IconButton onClick={fetchGrievances} sx={{ bgcolor: 'action.hover' }}>
                                        <Refresh />
                                    </IconButton>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Grievances Table */}
                <Card>
                    <CardContent sx={{ p: 0 }}>
                        {loading && <LinearProgress />}
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('common.trackingId')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('common.title')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('common.category')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('common.priority')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{t('common.date')}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }} align="center">{t('common.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {grievances.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                                <Box>
                                                    <Assignment sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                                                    <Typography variant="h6" color="text.secondary">
                                                        {t('citizen.noGrievances')}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                        {t('citizen.getStarted')}
                                                    </Typography>
                                                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/citizen/submit')}>
                                                        {t('citizen.submitGrievance')}
                                                    </Button>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        grievances.map((grievance) => (
                                            <TableRow
                                                key={grievance._id}
                                                sx={{
                                                    '&:hover': { bgcolor: 'action.hover' },
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() => navigate(`/grievance/${grievance._id}`)}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                                        {grievance.trackingId}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {grievance.title}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={t(`categories.${grievance.category}`, grievance.category?.replace(/_/g, ' '))}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={t(`common.${grievance.priority}`)}
                                                        size="small"
                                                        color={priorityColors[grievance.priority]}
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={t(`common.${grievance.status}`)}
                                                        size="small"
                                                        color={statusColors[grievance.status]}
                                                        sx={{ textTransform: 'capitalize' }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {new Date(grievance.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title={t('common.details')}>
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/grievance/${grievance._id}`);
                                                            }}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Container>
        </Layout>
    );
};

export default CitizenDashboard;
