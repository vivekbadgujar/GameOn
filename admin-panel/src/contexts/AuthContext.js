import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    console.log('Checking auth status...');
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Token found:', !!token);
      if (token) {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth check timeout')), 10000); // 10 seconds
        });
        
        const authPromise = authAPI.checkAuth();
        const response = await Promise.race([authPromise, timeoutPromise]);
        
        if (response.data.success) {
          setIsAuthenticated(true);
          setAdmin(response.data.admin);
        } else {
          console.log('Auth check failed - invalid response');
          localStorage.removeItem('adminToken');
          setIsAuthenticated(false);
          setAdmin(null);
        }
      } else {
        // No token, not authenticated
        console.log('No token found - not authenticated');
        setIsAuthenticated(false);
        setAdmin(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
      setAdmin(null);
    } finally {
      console.log('Auth check completed, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        setIsAuthenticated(true);
        setAdmin(response.data.admin);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      setIsAuthenticated(false);
      setAdmin(null);
    }
  };

  const value = {
    isAuthenticated,
    admin,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 