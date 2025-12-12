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
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('adminToken');
          }
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
      }
      setIsAuthenticated(false);
      setAdmin(null);
    } finally {
      console.log('Auth check completed, setting loading to false');
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('AuthContext: Attempting login...');
      console.log('API Base URL:', process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL);
      
      const response = await authAPI.login(credentials);
      console.log('AuthContext: Login response:', response.data);
      
      if (response.data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', response.data.token);
        }
        setIsAuthenticated(true);
        setAdmin(response.data.admin);
        console.log('AuthContext: Login successful, token stored');
        
        // Verify session via /admin/auth/me before proceeding
        try {
          console.log('AuthContext: Verifying session via /admin/auth/me');
          const API_BASE_URL = (process.env.REACT_APP_API_URL || 
                                process.env.NEXT_PUBLIC_API_URL || 
                                process.env.NEXT_PUBLIC_API_BASE_URL || 
                                'https://api.gameonesport.xyz/api').replace(/\/$/, '');
          
          const meResponse = await fetch(`${API_BASE_URL}/admin/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${response.data.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (meResponse.ok) {
            const meData = await meResponse.json();
            console.log('AuthContext: Session verified:', meData);
            if (meData.success && meData.data) {
              setAdmin(meData.data);
              return { success: true };
            } else {
              console.warn('AuthContext: Session verification returned invalid data');
              return { success: false, message: 'Session verification failed' };
            }
          } else {
            console.warn('AuthContext: Session verification returned non-OK status:', meResponse.status);
            return { success: false, message: 'Session verification failed' };
          }
        } catch (verifyError) {
          console.error('AuthContext: Session verification error:', verifyError);
          return { success: false, message: 'Session verification failed: ' + verifyError.message };
        }
      } else {
        console.log('AuthContext: Login failed -', response.data.message);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      console.error('AuthContext: Error status:', error.response?.status);
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
      }
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