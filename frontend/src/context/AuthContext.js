import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import i18n from '../i18n';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    const userData = response.data.user;
                    setUser(userData);
                    if (userData.language) {
                        i18n.changeLanguage(userData.language);
                    }
                } catch (error) {
                    console.error('Auth init error:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, [token]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token: newToken, user: userData } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);

        if (userData.language) {
            i18n.changeLanguage(userData.language);
        }

        return userData;
    };

    const verifyOtp = async (email, otp) => {
        const response = await api.post('/auth/verify-otp', { email, otp });
        const { token: newToken, user: userData } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);

        if (userData.language) {
            i18n.changeLanguage(userData.language);
        }

        return userData;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        const { token: newToken, user: newUser } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);

        return newUser;
    };

    const registerRequest = async (userData) => {
        // Step 1: Send OTP to email without creating account yet
        const response = await api.post('/auth/register-request', userData);
        return response.data; // { success: true, message: '...' }
    };

    const registerVerify = async (email, otp) => {
        // Step 2: Verify OTP and create the account
        const response = await api.post('/auth/register-verify', { email, otp });
        const { token: newToken, user: newUser } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);

        if (newUser.language) {
            i18n.changeLanguage(newUser.language);
        }

        return newUser;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (data) => {
        const response = await api.put('/auth/profile', data);
        setUser(response.data.user);
        return response.data.user;
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        verifyOtp,
        register,
        registerRequest,
        registerVerify,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
