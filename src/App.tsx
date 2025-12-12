import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthForm from './components/auth/AuthForm';
import AdminDashboard from './components/dashboard/AdminDashboard';
import UserDashboard from './components/dashboard/UserDashboard';

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const handleGetStarted = () => {
    if (currentUser) {
      // If user is already logged in, redirect to appropriate dashboard
      navigate(currentUser.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      // If not logged in, redirect to login page
      navigate('/login');
    }
  };
  return (
    <Routes>
      <Route 
        path="/landing" 
        element={<LandingPage onGetStarted={handleGetStarted} />} 
      />
      
      <Route 
        path="/login" 
        element={
          currentUser ? 
            <Navigate to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} replace /> : 
            <AuthForm />
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requireRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requireRole="user">
            <UserDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/" 
        element={
          <Navigate to="/landing" replace />
        } 
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;