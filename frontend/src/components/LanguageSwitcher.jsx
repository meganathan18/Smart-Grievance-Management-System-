import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Button, Menu, MenuItem,
    Tooltip, ListItemIcon, ListItemText
} from '@mui/material';
import { Language } from '@mui/icons-material';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' }
];

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        // Persist to backend if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://smart-grievance-management-system.onrender.com/api' : 'http://localhost:5000/api');
            fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ language: lng })
            }).catch(err => console.error('Failed to save language preference:', err));
        }
        handleClose();
    };

    const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

    return (
        <>
            <Tooltip title="Switch Language">
                <Button
                    color="inherit"
                    onClick={handleClick}
                    startIcon={<Language />}
                    sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                        px: 2,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                >
                    {currentLanguage.name.split(' ')[0]}
                </Button>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        mt: 1.5,
                        minWidth: 180,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                    }
                }}
            >
                {languages.map((lng) => (
                    <MenuItem
                        key={lng.code}
                        onClick={() => changeLanguage(lng.code)}
                        selected={i18n.language === lng.code}
                        sx={{ py: 1.5 }}
                    >
                        <ListItemIcon sx={{ fontSize: '1.2rem' }}>{lng.flag}</ListItemIcon>
                        <ListItemText primary={lng.name} />
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default LanguageSwitcher;
