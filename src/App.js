import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import Companies from './pages/Companies';
import CompanyProfile from './pages/CompanyProfile';
import Subscriptions from './pages/Subscriptions';
import Packages from './pages/Packages';
import CustomPackages from './pages/CustomPackages';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Users />} />
              <Route path="clients/:id" element={<UserProfile />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/:id" element={<CompanyProfile />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="packages" element={<Packages />} />
              <Route path="custom-packages" element={<CustomPackages />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

