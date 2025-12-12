import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, enableFirestoreNetwork } from '../lib/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'admin' | 'user') => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      // Try to enable network connection before login
      await enableFirestoreNetwork();
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      if (error.code === 'unavailable') {
        toast.error('Connection issue. Please check your internet connection.');
        setIsOffline(true);
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'user') => {
    try {
      // Try to enable network connection before signup
      await enableFirestoreNetwork();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      const userData: User = {
        id: user.uid,
        email: user.email!,
        name,
        role,
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      toast.success('Account created successfully!');
    } catch (error: any) {
      if (error.code === 'unavailable') {
        toast.error('Connection issue. Please check your internet connection.');
        setIsOffline(true);
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('See you soon!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await enableFirestoreNetwork();
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error: any) {
      if (error.code === 'unavailable') {
        toast.error('Connection issue. Please check your internet connection.');
        setIsOffline(true);
      } else {
        toast.error(error.message);
      }
      throw error;
    }
  };

  useEffect(() => {
    // Network status monitoring
    const handleOnline = () => {
      setIsOffline(false);
      enableFirestoreNetwork();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try to enable network connection
          try {
            await enableFirestoreNetwork();
            setIsOffline(false);
          } catch (networkError) {
            console.warn('Network unavailable, operating in offline mode:', networkError);
            setIsOffline(true);
          }
          
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser({
              ...userData,
              createdAt: userData.createdAt || new Date(),
              lastLogin: new Date()
            });
            
            // Update last login
            await setDoc(doc(db, 'users', firebaseUser.uid), { 
              lastLogin: new Date() 
            }, { merge: true });
            setIsOffline(false);
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('offline')) {
            setIsOffline(true);
          }
          console.error('Error fetching user data:', error);
          if (error.code === 'unavailable') {
            setIsOffline(true);
            toast.error('Working offline. Some features may be limited.');
          }
        }
      } else {
        setCurrentUser(null);
      }
      setFirebaseUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = {
    currentUser,
    firebaseUser,
    loading,
    isOffline,
    login,
    signup,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};