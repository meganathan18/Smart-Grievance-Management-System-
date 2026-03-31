import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Button, Typography, IconButton, Paper, CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Mic, Stop, Delete, Replay, Save, PlayArrow, Pause,
    GraphicEq
} from '@mui/icons-material';

const VoiceRecorder = ({ onSave, onDelete }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const audioRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const analyzerRef = useRef(null);
    const streamRef = useRef(null);

    // Format time (mm:ss)
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Draw waveform visualizer
    const drawWaveform = () => {
        if (!canvasRef.current || !analyzerRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyzerRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationFrameRef.current = requestAnimationFrame(draw);
            analyzerRef.current.getByteTimeDomainData(dataArray);

            ctx.fillStyle = 'rgba(255, 255, 255, 0)';
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#764ba2';
            ctx.beginPath();

            const sliceWidth = canvas.width * 1.0 / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        draw();
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream);

            const chunks = [];
            mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
            };

            // Setup visualizer
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 256;
            source.connect(analyzer);
            analyzerRef.current = analyzer;
            drawWaveform();

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setAudioBlob(null);
            setAudioUrl(null);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            streamRef.current.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            clearInterval(timerRef.current);
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSave = async () => {
        if (audioBlob && onSave) {
            setLoading(true);
            const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
            await onSave(file);
            setLoading(false);
            resetRecorder();
        }
    };

    const resetRecorder = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setIsPlaying(false);
    };

    const handleDelete = () => {
        resetRecorder();
        if (onDelete) onDelete();
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        };
    }, []);

    return (
        <Paper elevation={0} sx={{
            p: 2,
            border: '1px dashed',
            borderColor: isRecording ? 'primary.main' : 'divider',
            borderRadius: 2,
            bgcolor: isRecording ? 'rgba(118, 75, 162, 0.05)' : 'transparent',
            transition: 'all 0.3s ease'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!audioBlob ? (
                        <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'}>
                            <Button
                                variant="contained"
                                color={isRecording ? 'error' : 'primary'}
                                onClick={isRecording ? stopRecording : startRecording}
                                sx={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: '50%',
                                    minWidth: 0,
                                    boxShadow: isRecording ? '0 0 15px rgba(211, 47, 47, 0.4)' : 'none'
                                }}
                            >
                                {isRecording ? <Stop /> : <Mic />}
                            </Button>
                        </Tooltip>
                    ) : (
                        <IconButton
                            onClick={handlePlayPause}
                            color="primary"
                            sx={{ bgcolor: 'rgba(118, 75, 162, 0.1)', '&:hover': { bgcolor: 'rgba(118, 75, 162, 0.2)' } }}
                        >
                            {isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                    )}

                    {isRecording && (
                        <Box sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            width: 12,
                            height: 12,
                            bgcolor: 'error.main',
                            borderRadius: '50%',
                            animation: 'pulse 1.5s infinite'
                        }} />
                    )}
                </Box>

                <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                        {isRecording ? 'Recording...' : audioBlob ? 'Recorded Message' : 'Record Voice Message'}
                        <Typography component="span" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {formatTime(recordingTime)}
                        </Typography>
                    </Typography>

                    <Box sx={{ height: 40, width: '100%', mt: 1, position: 'relative' }}>
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={40}
                            style={{ width: '100%', height: '100%', display: isRecording ? 'block' : 'none' }}
                        />
                        {audioBlob && !isRecording && (
                            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', color: 'text.disabled' }}>
                                <GraphicEq sx={{ mr: 1 }} />
                                <Typography variant="caption">Audio recorded successfully. Click play to preview.</Typography>
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    onEnded={() => setIsPlaying(false)}
                                    style={{ display: 'none' }}
                                />
                            </Box>
                        )}
                        {!isRecording && !audioBlob && (
                            <Typography variant="body2" color="text.secondary">
                                Click the microphone to start recording your message.
                            </Typography>
                        )}
                    </Box>
                </Box>

                {audioBlob && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Re-record">
                            <IconButton onClick={resetRecorder} size="small" color="warning">
                                <Replay />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton onClick={handleDelete} size="small" color="error">
                                <Delete />
                            </IconButton>
                        </Tooltip>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save />}
                            onClick={handleSave}
                            disabled={loading}
                            sx={{ borderRadius: 20 }}
                        >
                            Save
                        </Button>
                    </Box>
                )}
            </Box>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </Paper>
    );
};

export default VoiceRecorder;
