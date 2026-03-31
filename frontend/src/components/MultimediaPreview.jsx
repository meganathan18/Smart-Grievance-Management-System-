import React, { useState } from 'react';
import SecureAudioPlayer from './SecureAudioPlayer';
import {
    Box, Typography, Paper, Dialog, DialogContent,
    DialogTitle, Avatar, Stack, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import {
    Close, Download, InsertDriveFile,
    GraphicEq, OpenInFull
} from '@mui/icons-material';

const MultimediaPreview = ({ files, voiceMessage }) => {
    const [previewImage, setPreviewImage] = useState(null);

    const isImage = (mimetype) => mimetype?.startsWith('image/');
    const isAudio = (mimetype) => mimetype?.startsWith('audio/');

    const FileCard = ({ file, isVoice = false }) => {
        const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://smart-grievance-management-system.onrender.com/api' : 'http://localhost:5000/api');
        const fileUrl = file.url.startsWith('http') ? file.url : `${API_URL.replace('/api', '')}${file.url}`;
        const token = localStorage.getItem('token');

        // Since we need to pass the Bearer token for secure access
        // For images and audio, we can't easily add headers to <img> or <audio> tags without blobs
        // But for simplicity in this mock, we'll assume the server might allow token in query param 
        // OR we just use the authenticated URL if the browser session handles it (which it doesn't automatically for headers)
        // Better approach for secure files: Fetch as blob with headers

        const [objectUrl, setObjectUrl] = useState(null);
        const [loading, setLoading] = useState(true);

        React.useEffect(() => {
            let currentUrl = null;
            const fetchFile = async () => {
                try {
                    const response = await fetch(fileUrl, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const blob = await response.blob();
                        currentUrl = URL.createObjectURL(blob);
                        setObjectUrl(currentUrl);
                    }
                } catch (err) {
                    console.error('Error fetching secure file:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchFile();
            return () => { if (currentUrl) URL.revokeObjectURL(currentUrl); };
        }, [fileUrl, token]);

        if (loading) return <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, minWidth: 200, borderRadius: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">Loading...</Typography>
        </Paper>;

        if (isImage(file.mimetype)) {
            return (
                <Paper
                    elevation={0}
                    sx={{
                        position: 'relative',
                        width: 120,
                        height: 120,
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover .overlay': { opacity: 1 }
                    }}
                    onClick={() => setPreviewImage(objectUrl)}
                >
                    <img
                        src={objectUrl}
                        alt={file.originalName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <Box
                        className="overlay"
                        sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            bgcolor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', opacity: 0, transition: '0.2s'
                        }}
                    >
                        <OpenInFull sx={{ color: 'white' }} />
                    </Box>
                </Paper>
            );
        }

        return (
            <Paper
                sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    minWidth: 240,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'grey.50', transform: 'translateY(-2px)' }
                }}
            >
                <Avatar sx={{ bgcolor: 'grey.100', color: 'grey.600' }}>
                    <InsertDriveFile />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {file.originalName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {(file.size / 1024).toFixed(1)} KB
                    </Typography>
                </Box>
                <IconButton size="small" component="a" href={objectUrl} download={file.originalName}>
                    <Download fontSize="small" />
                </IconButton>
            </Paper>
        );
    };

    if (!voiceMessage && (!files || files.length === 0)) return null;

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontWeight: 600 }}>
                Attachments & Evidence
            </Typography>

            <Stack direction="column" spacing={2}>
                {/* Voice Section */}
                {voiceMessage && (
                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 700, textTransform: 'uppercase', color: 'primary.main', letterSpacing: '0.05em' }}>
                            Voice Complaint
                        </Typography>
                        <SecureAudioPlayer file={voiceMessage} isVoice={true} />
                    </Box>
                )}

                {/* Other Files Section */}
                <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                    {files?.map((file, index) => {
                        if (isAudio(file.mimetype)) {
                            return <SecureAudioPlayer key={index} file={file} />;
                        }
                        return <FileCard key={index} file={file} />;
                    })}
                </Stack>
            </Stack>

            {/* Image Preview Modal */}
            <Dialog
                open={Boolean(previewImage)}
                onClose={() => setPreviewImage(null)}
                maxWidth="lg"
            >
                <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={() => setPreviewImage(null)}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', bgcolor: 'black' }}>
                    <img
                        src={previewImage}
                        alt="Preview"
                        style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MultimediaPreview;
