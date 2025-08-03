import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            
            // Set API headers
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          } catch (error) {
            console.error('Error parsing stored user data:', error);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, authToken) => {
    try {
      // Validate input
      if (!userData || !authToken) {
        throw new Error('Invalid login data');
      }

      // Store auth data
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', authToken);

      // Update state
      setUser(userData);
      setToken(authToken);

      // Update axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

      console.log('AuthContext: Login successful');
      return true;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      logout();
      return false;
    }
  };

  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Clear API headers
    delete api.defaults.headers.common['Authorization'];
    // Use React Router navigation instead of hard reload
    // The component using this should handle navigation
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
