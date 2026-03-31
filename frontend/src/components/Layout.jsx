import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon,
    ListItemText, IconButton, Avatar, Menu, MenuItem, Badge, Divider,
    useMediaQuery, useTheme, Tooltip, Chip
} from '@mui/material';
import {
    Menu as MenuIcon, Dashboard, Add, Notifications, Logout, Person,
    ChevronLeft, TrackChanges
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const drawerWidth = 260;

const Layout = ({ children, title }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const [drawerOpen, setDrawerOpen] = useState(!isMobile);
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifAnchor, setNotifAnchor] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getAll({ limit: 10 });
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getMenuItems = () => {
        const baseItems = [
            { text: t('common.dashboard'), icon: <Dashboard />, path: `/${user?.role}` },
        ];

        if (user?.role === 'citizen') {
            return [
                ...baseItems,
                { text: t('citizen.submitGrievance'), icon: <Add />, path: '/citizen/submit' },
                { text: t('citizen.trackGrievance'), icon: <TrackChanges />, path: '/track' },
            ];
        }

        if (user?.role === 'officer') {
            return baseItems;
        }

        if (user?.role === 'admin') {
            return baseItems;
        }

        return baseItems;
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2.5,
                            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1.5,
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                        }}
                    >
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>S</Typography>
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.02em' }}>SGMS</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Smart Grievance</Typography>
                    </Box>
                </Box>
                {isMobile && (
                    <IconButton onClick={() => setDrawerOpen(false)}>
                        <ChevronLeft />
                    </IconButton>
                )}
            </Box>

            <Divider />

            <List sx={{ flex: 1, px: 1 }}>
                {getMenuItems().map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => { navigate(item.path); isMobile && setDrawerOpen(false); }}
                        sx={{
                            borderRadius: 3,
                            mb: 1,
                            mx: 1,
                            px: 2,
                            bgcolor: location.pathname === item.path ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                            color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                            '&:hover': {
                                bgcolor: location.pathname === item.path ? 'rgba(79, 70, 229, 0.12)' : 'rgba(0,0,0,0.04)',
                                transform: 'translateX(4px)',
                            },
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            '&::before': location.pathname === item.path ? {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '20%',
                                bottom: '20%',
                                width: 4,
                                borderRadius: '0 4px 4px 0',
                                bgcolor: 'primary.main',
                            } : {},
                        }}
                    >
                        <ListItemIcon sx={{
                            color: location.pathname === item.path ? 'primary.main' : 'inherit',
                            minWidth: 40,
                            '& .MuiSvgIcon-root': { fontSize: 22 }
                        }}>
                            {item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.text}
                            primaryTypographyProps={{
                                fontWeight: location.pathname === item.path ? 600 : 500,
                                fontSize: '0.925rem'
                            }}
                        />
                    </ListItem>
                ))}
            </List>

            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 4,
                        bgcolor: 'rgba(79, 70, 229, 0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid rgba(79, 70, 229, 0.1)',
                    }}
                >
                    <Avatar
                        sx={{
                            bgcolor: 'primary.main',
                            mr: 1.5,
                            width: 40,
                            height: 40,
                            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.2)'
                        }}
                    >
                        {user?.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.name}
                        </Typography>
                        <Chip
                            label={user?.role}
                            size="small"
                            variant="outlined"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                                borderColor: 'primary.light',
                                color: 'primary.main',
                                mt: 0.5
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar
                position="fixed"
                sx={{
                    width: { md: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
                    ml: { md: `${drawerOpen ? drawerWidth : 0}px` },
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    color: 'text.primary',
                    boxShadow: 'none',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                }}
            >
                <Toolbar>
                    <IconButton
                        edge="start"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {title}
                    </Typography>

                    <LanguageSwitcher />

                    {/* Notifications */}
                    <Tooltip title="Notifications">
                        <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ mr: 1 }}>
                            <Badge badgeContent={unreadCount} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Profile Menu */}
                    <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                            {user?.name?.[0]?.toUpperCase()}
                        </Avatar>
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Notifications Menu */}
            <Menu
                anchorEl={notifAnchor}
                open={Boolean(notifAnchor)}
                onClose={() => setNotifAnchor(null)}
                PaperProps={{ sx: { width: 340, maxHeight: 400 } }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Notifications</Typography>
                    <Chip label={unreadCount} size="small" color="primary" />
                </Box>
                <Divider />
                {notifications.length === 0 ? (
                    <MenuItem disabled>No notifications</MenuItem>
                ) : (
                    notifications.slice(0, 5).map((notif) => (
                        <MenuItem
                            key={notif._id}
                            onClick={() => { handleMarkAsRead(notif._id); setNotifAnchor(null); }}
                            sx={{ whiteSpace: 'normal', bgcolor: !notif.isRead ? 'action.hover' : 'transparent' }}
                        >
                            <Box>
                                <Typography variant="body2" sx={{ fontWeight: !notif.isRead ? 600 : 400 }}>
                                    {notif.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {notif.message?.substring(0, 60)}...
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))
                )}
            </Menu>

            {/* Profile Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
                    <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                    {t('common.profile')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    {t('common.logout')}
                </MenuItem>
            </Menu>

            {/* Drawer */}
            <Drawer
                variant={isMobile ? 'temporary' : 'persistent'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        border: 'none',
                        background: 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(20px)',
                        borderRight: '1px solid rgba(0,0,0,0.05)',
                    },
                }}
            >
                {drawer}
            </Drawer>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    transition: theme.transitions.create('margin', {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.leavingScreen,
                    }),
                    marginLeft: { md: drawerOpen ? 0 : `-${drawerWidth}px` },
                    minHeight: '100vh',
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
