import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Analytics from './pages/Analytics';

import MainLayout from './components/layout/MainLayout';

const ProtectedRoute = ({ children }) => {
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" />} />
      <Route path="/signup" element={<Navigate to="/dashboard" />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
      <Route path="/fuel-expenses" element={<ProtectedRoute><FuelExpenses /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      
      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      
      {/* Placeholders for teammates */}
      <Route path="/fleet" element={<ProtectedRoute><MainLayout><div>Fleet Module</div></MainLayout></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><MainLayout><div>Drivers Module</div></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout><div>Settings Module</div></MainLayout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
