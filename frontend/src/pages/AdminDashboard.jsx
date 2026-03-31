import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Container, Grid, Card, CardContent, Typography, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Chip, Avatar, LinearProgress, Button, IconButton
} from '@mui/material';
import {
    Dashboard, People, Business, TrendingUp,
    Add, Edit, Refresh, CheckCircle, Pending, Assignment
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import Layout from '../components/Layout';
import { analyticsAPI, departmentAPI, userAPI, grievanceAPI } from '../services/api';

const COLORS = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [grievances, setGrievances] = useState([]);
    const [, setUserDialog] = useState({ open: false, user: null });
    const [, setDeptDialog] = useState({ open: false, dept: null });


    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            if (currentTab === 0) {
                const res = await analyticsAPI.getDashboard();
                setAnalytics(res.data.analytics);
            } else if (currentTab === 1) {
                const res = await grievanceAPI.getAll({ limit: 50 });
                setGrievances(res.data.grievances);
            } else if (currentTab === 2) {
                const res = await userAPI.getAll({ limit: 100 });
                setUsers(res.data.users);
            } else if (currentTab === 3) {
                const res = await departmentAPI.getAll();
                setDepartments(res.data.departments);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const StatCard = ({ title, value, icon, color, change }) => (
        <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`, border: `1px solid ${color}30` }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">{title}</Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, mt: 1 }}>{value}</Typography>
                        {change && (
                            <Typography variant="caption" sx={{ color: change > 0 ? 'success.main' : 'error.main' }}>
                                {change > 0 ? '+' : ''}{change}% from last week
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const renderOverview = () => {
        if (!analytics) return <LinearProgress />;

        const statusData = Object.entries(analytics.grievancesByStatus || {}).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));
        const priorityData = Object.entries(analytics.grievancesByPriority || {}).map(([name, value]) => ({ name, value }));
        const sentimentData = Object.entries(analytics.sentimentDistribution || {}).map(([name, value]) => ({ name, value }));

        return (
            <>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="Total Grievances" value={analytics.overview.totalGrievances} icon={<Assignment />} color="#667eea" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="Pending" value={analytics.overview.pendingGrievances} icon={<Pending />} color="#f59e0b" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="Resolved" value={analytics.overview.resolvedGrievances} icon={<CheckCircle />} color="#10b981" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard title="Resolution Rate" value={`${analytics.overview.resolutionRate}%`} icon={<TrendingUp />} color="#3b82f6" />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: 350 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>By Status</Typography>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: 350 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>By Priority</Typography>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={priorityData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Bar dataKey="value" fill="#667eea" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: 350 }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Sentiment Analysis</Typography>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>
                                            {sentimentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Daily Trend (Last 30 Days)</Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analytics.dailyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="_id" tickFormatter={(v) => v.slice(5)} />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="submitted" stroke="#667eea" strokeWidth={2} name="Submitted" />
                                        <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </>
        );
    };

    const renderGrievances = () => (
        <Card>
            {loading && <LinearProgress />}
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">All Grievances</Typography>
                    <IconButton onClick={fetchData}><Refresh /></IconButton>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>Tracking ID</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>Citizen</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Priority</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>AI Assigned</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {grievances.map((g) => (
                                <TableRow key={g._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/grievance/${g._id}`)}>
                                    <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{g.trackingId}</Typography></TableCell>
                                    <TableCell>{g.title?.substring(0, 40)}...</TableCell>
                                    <TableCell>{g.citizen?.name}</TableCell>
                                    <TableCell>{g.department?.name || 'Unassigned'}</TableCell>
                                    <TableCell><Chip label={g.priority} size="small" color={g.priority === 'urgent' ? 'error' : g.priority === 'high' ? 'warning' : 'default'} /></TableCell>
                                    <TableCell><Chip label={g.status?.replace(/_/g, ' ')} size="small" color={g.status === 'resolved' ? 'success' : g.status === 'pending' ? 'warning' : 'info'} /></TableCell>
                                    <TableCell><Chip label={g.isAIAssigned ? 'Yes' : 'No'} size="small" variant="outlined" color={g.isAIAssigned ? 'success' : 'default'} /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );

    const renderUsers = () => (
        <Card>
            {loading && <LinearProgress />}
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">User Management</Typography>
                    <Box>
                        <Button startIcon={<Add />} variant="contained" onClick={() => setUserDialog({ open: true, user: null })}>Add User</Button>
                        <IconButton onClick={fetchData} sx={{ ml: 1 }}><Refresh /></IconButton>
                    </Box>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id} hover>
                                    <TableCell>{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell><Chip label={u.role} size="small" color={u.role === 'admin' ? 'error' : u.role === 'officer' ? 'primary' : 'default'} /></TableCell>
                                    <TableCell>{u.department?.name || '-'}</TableCell>
                                    <TableCell><Chip label={u.isActive ? 'Active' : 'Inactive'} size="small" color={u.isActive ? 'success' : 'default'} /></TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => setUserDialog({ open: true, user: u })}><Edit fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );

    const renderDepartments = () => (
        <Card>
            {loading && <LinearProgress />}
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Department Management</Typography>
                    <Box>
                        <Button startIcon={<Add />} variant="contained" onClick={() => setDeptDialog({ open: true, dept: null })}>Add Department</Button>
                        <IconButton onClick={fetchData} sx={{ ml: 1 }}><Refresh /></IconButton>
                    </Box>
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell>Name</TableCell>
                                <TableCell>Code</TableCell>
                                <TableCell>Categories</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {departments.map((d) => (
                                <TableRow key={d._id} hover>
                                    <TableCell>{d.name}</TableCell>
                                    <TableCell><Chip label={d.code} size="small" variant="outlined" /></TableCell>
                                    <TableCell>
                                        {d.categories?.slice(0, 3).map((c) => (
                                            <Chip key={c} label={c.replace(/_/g, ' ')} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                        ))}
                                        {d.categories?.length > 3 && <Chip label={`+${d.categories.length - 3}`} size="small" />}
                                    </TableCell>
                                    <TableCell><Chip label={d.isActive ? 'Active' : 'Inactive'} size="small" color={d.isActive ? 'success' : 'default'} /></TableCell>
                                    <TableCell>
                                        <IconButton size="small" onClick={() => setDeptDialog({ open: true, dept: d })}><Edit fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );

    return (
        <Layout title="Admin Dashboard">
            <Container maxWidth="xl" sx={{ py: 3 }}>
                <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
                    <Tab icon={<Dashboard />} label="Overview" iconPosition="start" />
                    <Tab icon={<Assignment />} label="Grievances" iconPosition="start" />
                    <Tab icon={<People />} label="Users" iconPosition="start" />
                    <Tab icon={<Business />} label="Departments" iconPosition="start" />
                </Tabs>

                {currentTab === 0 && renderOverview()}
                {currentTab === 1 && renderGrievances()}
                {currentTab === 2 && renderUsers()}
                {currentTab === 3 && renderDepartments()}
            </Container>
        </Layout>
    );
};

export default AdminDashboard;
