import React from 'react';
import './i18n';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SubmitGrievance from './pages/SubmitGrievance';
import TrackGrievance from './pages/TrackGrievance';
import GrievanceDetails from './pages/GrievanceDetails';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/track" element={<TrackGrievance />} />

                    <Route path="/citizen" element={
                        <PrivateRoute allowedRoles={['citizen']}>
                            <CitizenDashboard />
                        </PrivateRoute>
                    } />

                    <Route path="/citizen/submit" element={
                        <PrivateRoute allowedRoles={['citizen']}>
                            <SubmitGrievance />
                        </PrivateRoute>
                    } />

                    <Route path="/officer" element={
                        <PrivateRoute allowedRoles={['officer']}>
                            <OfficerDashboard />
                        </PrivateRoute>
                    } />

                    <Route path="/admin" element={
                        <PrivateRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </PrivateRoute>
                    } />

                    <Route path="/grievance/:id" element={
                        <PrivateRoute>
                            <GrievanceDetails />
                        </PrivateRoute>
                    } />

                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />

                    <Route path="/" element={<Navigate to="/login" />} />
                </Routes>

            </AuthProvider>
        </Router>
    );
}

export default App;
