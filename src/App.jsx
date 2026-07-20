import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import './styles/global.css';

// Lazy load components for code splitting and faster initial load
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const HotelManagerDashboard = React.lazy(() => import('./pages/HotelManagerDashboard'));
const CashierDashboard = React.lazy(() => import('./pages/CashierDashboard'));
import './styles/global.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <div className="app">
            <Toast />
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Loading application...</div>}>
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

                <Route
                  path="/cashier-dashboard"
                  element={
                    <ProtectedRoute>
                      <CashierDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </React.Suspense>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
