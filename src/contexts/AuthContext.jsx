import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { WifiOff } from 'lucide-react';
import { apiCall } from '../utils/apiCall';

const AuthContext = createContext({
  user: null,
  isAuthLoading: true,
  login: () => {},
  logout: async () => {},
  setServerError: () => {},
});

const ServerErrorModal = ({ isOpen, onRetry }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform transition-all border border-gray-100 dark:border-gray-700">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <WifiOff className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Server Unreachable</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          We're having trouble connecting to our servers. Please check your internet connection and try again.
        </p>
        <button
          onClick={onRetry}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 transform hover:-translate-y-0.5"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('admin_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchMe = async () => {
      try {
        const res = await apiCall('/auth/me', 'GET');
        const data = await res.json();
        
        if (res.ok && data.success) {
          setUser(data.data);
          localStorage.setItem('admin_user', JSON.stringify(data.data));
        } else {
          setUser(null);
          localStorage.removeItem('admin_user');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        if (err.name === 'TypeError') {
          setServerError(true);
        } else {
          setUser(null);
          localStorage.removeItem('admin_data');
        }
      } finally {
        setIsAuthLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = (userData) => {
    localStorage.setItem('admin_data', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiCall('/auth/logout', 'POST');
    } catch (err) {
      console.error('Logout API failed', err);
      if (err.name === 'TypeError') {
        setServerError(true);
      }
    } finally {
      setUser(null);
      localStorage.removeItem('admin_user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthLoading, login, logout, setServerError }}>
      <ServerErrorModal isOpen={serverError} onRetry={() => { setServerError(false); window.location.reload(); }} />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
