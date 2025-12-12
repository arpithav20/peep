import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { currentUser, logout, isOffline } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 to-primary-50">
      {isOffline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center text-sm">
          <span className="font-medium">You're currently offline.</span> Some features may be limited.
        </div>
      )}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-secondary-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <Logo size={32} />
              <div>
                <h1 className="text-xl font-semibold text-secondary-900">PEEP</h1>
                {title && <p className="text-sm text-secondary-500">{title}</p>}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-900">
                    <span className="flex items-center space-x-1">
                      <span>Hi, {currentUser?.name}</span>
                      <Sparkles className="w-4 h-4 text-accent-500" />
                    </span>
                  </p>
                  <p className="text-xs text-secondary-500 capitalize">
                    {currentUser?.role}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="w-px h-6 bg-secondary-300" />
              
              <button
                onClick={handleLogout}
                className="p-2 text-secondary-500 hover:text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;