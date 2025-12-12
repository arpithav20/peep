import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, UserCheck, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import Logo from '../Logo';

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const { login, signup, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        // Determine role based on email pattern
        const role = formData.email.includes('@etmark.com') ? 'admin' : 'user';
        await signup(formData.email, formData.password, formData.name, role);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Auth error:', error);
      
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials or create an account.');
        toast.error('Invalid credentials. Try the demo accounts or sign up for a new account.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up or check your email.');
        toast.error('Account not found. Please sign up first.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
        toast.error('Incorrect password.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
        toast.error('Too many attempts. Please wait before trying again.');
      } else {
        setError(error.message || 'An error occurred during authentication.');
        toast.error('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      return;
    }
    try {
      await resetPassword(formData.email);
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <Logo size={64} />
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Welcome to PEEP</h1>
          <p className="text-secondary-600">Performance Evaluation Enhancement Program</p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-strong border border-secondary-200/50 p-8"
        >
          <div className="flex rounded-lg bg-secondary-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-secondary-900 shadow-soft'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-secondary-900 shadow-soft'
                  : 'text-secondary-600 hover:text-secondary-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field pl-10 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </motion.button>

            {isLogin && (
              <div className="text-center">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-blue-800 mb-3">📝 Demo Account Setup:</p>
                  <div className="text-left space-y-2">
                    <p className="text-xs text-blue-700"><strong>Step 1:</strong> Click "Sign Up" tab above</p>
                    <p className="text-xs text-blue-700"><strong>Step 2:</strong> Create accounts with these emails:</p>
                    <p className="text-xs text-blue-600 ml-4">• admin@etmark.com (becomes Admin)</p>
                    <p className="text-xs text-blue-600 ml-4">• student@example.com (becomes User)</p>
                    <p className="text-xs text-blue-700"><strong>Step 3:</strong> Use any password you choose</p>
                    <p className="text-xs text-blue-700"><strong>Step 4:</strong> Return here to sign in</p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">⚠️ Demo accounts must be created before use!</p>
                  </div>
                </div>
              </div>
            )}

            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                Forgot your password?
              </button>
            )}
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthForm;