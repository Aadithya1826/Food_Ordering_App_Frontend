import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import HotelManagerDashboard from './pages/HotelManagerDashboard';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <div className="app">
          <Routes>
            {/* Auth Flow */}
            <Route path="/" element={<Onboarding />} />

            {/* Protected Dashboards */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manager-dashboard/:hotelId?"
              element={
                <ProtectedRoute>
                  <HotelManagerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
