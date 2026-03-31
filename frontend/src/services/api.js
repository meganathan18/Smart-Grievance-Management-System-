import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/password', data),
};

// Grievance API
export const grievanceAPI = {
    getAll: (params) => api.get('/grievances', { params }),
    getById: (id) => api.get(`/grievances/${id}`),
    create: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (key === 'attachments' && data[key]) {
                data[key].forEach(file => formData.append('attachments', file));
            } else if (data[key] !== null && typeof data[key] === 'object' && !(data[key] instanceof File)) {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        });
        return api.post('/grievances', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    updateStatus: (id, data) => api.put(`/grievances/${id}/status`, data),
    addComment: (id, data) => api.post(`/grievances/${id}/comments`, data),
    assign: (id, data) => api.put(`/grievances/${id}/assign`, data),
    escalate: (id, data) => api.put(`/grievances/${id}/escalate`, data),
    submitFeedback: (id, data) => api.post(`/grievances/${id}/feedback`, data),
    track: (trackingId) => api.get(`/grievances/track/${trackingId}`),
    uploadVoice: (formData) => api.post('/upload-voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Department API
export const departmentAPI = {
    getAll: (params) => api.get('/departments', { params }),
    getById: (id) => api.get(`/departments/${id}`),
    create: (data) => api.post('/departments', data),
    update: (id, data) => api.put(`/departments/${id}`, data),
    delete: (id) => api.delete(`/departments/${id}`),
    getOfficers: (id) => api.get(`/departments/${id}/officers`),
};

// User API
export const userAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    getOfficers: (params) => api.get('/users/officers', { params }),
};

// Analytics API
export const analyticsAPI = {
    getDashboard: () => api.get('/analytics/dashboard'),
    getDepartmentStats: () => api.get('/analytics/departments'),
    getOfficerStats: (params) => api.get('/analytics/officers', { params }),
    getDuplicates: () => api.get('/analytics/duplicates'),
    getAIAccuracy: () => api.get('/analytics/ai-accuracy'),
};

// Notification API
export const notificationAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
};
