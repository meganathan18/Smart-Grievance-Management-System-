import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Typography, IconButton, Slider, Stack, Paper,
    CircularProgress, Tooltip, Avatar
} from '@mui/material';
import {
    PlayArrow, Pause, VolumeUp, VolumeOff,
    GraphicEq, Download, Replay10, Forward10
} from '@mui/icons-material';

const SecureAudioPlayer = ({ file, isVoice = false }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [objectUrl, setObjectUrl] = useState(null);
    const [error, setError] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://smart-grievance-management-system.onrender.com/api' : 'http://localhost:5000/api');
    const fileUrl = file?.url ? (file.url.startsWith('http') ? file.url : `${API_URL.replace('/api', '')}${file.url}`) : null;
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!fileUrl) {
            setError('Audio file path is missing');
            setLoading(false);
            return;
        }
        let currentUrl = null;
        const fetchFile = async () => {
            try {
                if (fileUrl.includes('cloudinary.com')) {
                    setObjectUrl(fileUrl);
                    setLoading(false);
                    return;
                }
                const response = await fetch(fileUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const blob = await response.blob();
                    currentUrl = URL.createObjectURL(blob);
                    setObjectUrl(currentUrl);
                } else {
                    setError('Failed to load audio');
                }
            } catch (err) {
                console.error('Error fetching secure audio:', err);
                setError('Network error loading audio');
            } finally {
                setLoading(false);
            }
        };
        fetchFile();
        return () => { if (currentUrl) URL.revokeObjectURL(currentUrl); };
    }, [fileUrl, token]);

    const togglePlay = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current.duration !== Infinity) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleLoadedData = () => {
        // For WebM files where duration might be Infinity initially
        if (audioRef.current.duration === Infinity) {
            // Seek to very end to force browser to calculate duration
            audioRef.current.currentTime = 1e101;
            audioRef.current.ontimeupdate = function () {
                this.ontimeupdate = handleTimeUpdate;
                setDuration(audioRef.current.duration);
                audioRef.current.currentTime = 0;
            };
        }
    };

    const handleAudioError = (e) => {
        console.error('Audio element error:', e);
        setError('Playback error: Unsupported format or missing file');
    };

    const handleSeek = (event, newValue) => {
        if (audioRef.current && duration !== Infinity) {
            audioRef.current.currentTime = newValue;
            setCurrentTime(newValue);
        }
    };

    const handleVolumeChange = (event, newValue) => {
        setVolume(newValue);
        if (audioRef.current) audioRef.current.volume = newValue;
        setIsMuted(newValue === 0);
    };

    const toggleMute = () => {
        const newMuteStatus = !isMuted;
        setIsMuted(newMuteStatus);
        if (audioRef.current) audioRef.current.volume = newMuteStatus ? 0 : volume;
    };

    const skipTime = (amount) => {
        if (audioRef.current) audioRef.current.currentTime += amount;
    };

    const formatTime = (time) => {
        if (time === Infinity || isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, minWidth: 280, borderRadius: 3 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">Fetching secure audio...</Typography>
        </Paper>
    );

    if (error) return (
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, minWidth: 280, borderRadius: 3, border: '1px solid', borderColor: 'error.light', bgcolor: 'error.50' }}>
            <Typography variant="body2" color="error.main">{error}</Typography>
        </Paper>
    );

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2.5,
                minWidth: { xs: '100%', sm: 380 },
                borderRadius: 4,
                background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)',
                border: '1px solid',
                borderColor: 'primary.100',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.1)'
            }}
        >
            <audio
                ref={audioRef}
                src={objectUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onLoadedData={handleLoadedData}
                onError={handleAudioError}
                onEnded={() => setIsPlaying(false)}
                hidden
            />

            <Stack spacing={2}>
                {/* Header Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                        <GraphicEq sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', noWrap: true }}>
                            {isVoice ? 'Voice Evidence' : file.originalName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {(file.size / 1024).toFixed(1)} KB • {formatTime(duration)}
                        </Typography>
                    </Box>
                    <Tooltip title="Download Recording">
                        <IconButton size="small" component="a" href={objectUrl} download={file.originalName} sx={{ color: 'primary.main' }}>
                            <Download fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Progress Bar */}
                <Box>
                    <Slider
                        size="small"
                        value={currentTime}
                        max={duration}
                        onChange={handleSeek}
                        sx={{
                            color: 'primary.main',
                            height: 6,
                            '& .MuiSlider-thumb': {
                                width: 12,
                                height: 12,
                                transition: '0.3s cubic-bezier(.47,1.64,.41,.8)',
                                '&:before': { boxShadow: '0 2px 12px 0 rgba(0,0,0,0.4)' },
                                '&:hover, &.Mui-focusVisible': { boxShadow: '0px 0px 0px 8px rgba(79, 70, 229, 0.16)' },
                                '&.Mui-active': { width: 16, height: 16 },
                            },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: -0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {formatTime(currentTime)}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {formatTime(duration)}
                        </Typography>
                    </Box>
                </Box>

                {/* Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <IconButton size="small" onClick={() => skipTime(-10)} sx={{ color: 'text.secondary' }}>
                            <Replay10 fontSize="small" />
                        </IconButton>

                        <IconButton
                            onClick={togglePlay}
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                width: 48,
                                height: 48,
                                '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)'
                            }}
                        >
                            {isPlaying ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                        </IconButton>

                        <IconButton size="small" onClick={() => skipTime(10)} sx={{ color: 'text.secondary' }}>
                            <Forward10 fontSize="small" />
                        </IconButton>
                    </Stack>

                    {/* Volume Section */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: 120 }}>
                        <IconButton size="small" onClick={toggleMute} sx={{ color: 'text.secondary' }}>
                            {isMuted ? <VolumeOff fontSize="small" /> : <VolumeUp fontSize="small" />}
                        </IconButton>
                        <Slider
                            size="small"
                            value={isMuted ? 0 : volume}
                            max={1}
                            step={0.01}
                            onChange={handleVolumeChange}
                            sx={{ color: 'text.secondary' }}
                        />
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
};

export default SecureAudioPlayer;
