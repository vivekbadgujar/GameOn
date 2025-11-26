import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: true,
  walletBalance: 0,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  fetchWalletBalance: async () => {},
  updateWalletBalance: () => {},
  deductFromWallet: () => {},
  addToWallet: () => {},
  isAuthenticated: false,
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          const storedToken = localStorage.getItem('token');
        
          if (storedUser && storedToken) {
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setToken(storedToken);
              
              // Set API headers
              api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
              
              // Fetch wallet balance
              await fetchWalletBalance(storedToken);
            } catch (error) {
              console.error('Error parsing stored user data:', error);
              localStorage.removeItem('user');
              localStorage.removeItem('token');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Listen for token expiration events
    const handleTokenExpired = (event) => {
      console.log('AuthContext: Token expired event received');
      logout();
      
      // Show user-friendly notification
      if (event.detail?.message) {
        // You can integrate with your notification system here
        console.log('Session expired:', event.detail.message);
      }
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    initializeAuth();

    // Cleanup event listener
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = async (authToken = token) => {
    try {
      if (!authToken) return;
      
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  // Update wallet balance (for real-time updates)
  const updateWalletBalance = (newBalance) => {
    setWalletBalance(newBalance);
  };

  // Deduct from wallet balance
  const deductFromWallet = (amount) => {
    setWalletBalance(prev => Math.max(0, prev - amount));
  };

  // Add to wallet balance
  const addToWallet = (amount) => {
    setWalletBalance(prev => prev + amount);
  };

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

      // Fetch wallet balance after login
      fetchWalletBalance(authToken);

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
    setWalletBalance(0);
    
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
    walletBalance,
    login,
    logout,
    updateUser,
    fetchWalletBalance,
    updateWalletBalance,
    deductFromWallet,
    addToWallet,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};