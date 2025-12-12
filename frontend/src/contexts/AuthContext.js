import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import config from '../config';

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
              
              // Set API headers immediately
              api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

              // Use stored data immediately
              setUser(parsedUser);
              setToken(storedToken);
              
              // Verify session in background (don't block loading)
              verifySession(storedToken).catch(() => {
                console.warn('Background session verification failed - using stored data');
              });
              
              // Fetch wallet balance in background
              fetchWalletBalance(storedToken).catch((err) => {
                console.warn('Failed to fetch wallet balance:', err?.message || err);
              });
              
              // Set up session renewal check - renew token every 6 days (before 7-day expiry)
              const renewalInterval = setInterval(() => {
                console.log('[AuthContext] Session renewal check...');
                verifySession(storedToken).catch(() => {
                  console.warn('Session renewal verification failed - user may need to re-login soon');
                });
              }, 6 * 24 * 60 * 60 * 1000); // 6 days
              
              // Store interval ID for cleanup
              if (typeof window !== 'undefined') {
                window.__authRenewalInterval = renewalInterval;
              }
            } catch (error) {
              console.error('Error parsing stored user data:', error);
              localStorage.removeItem('user');
              localStorage.removeItem('token');
              setLoading(false);
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
      console.log('[AuthContext] Token expired event received');
      logout();
      
      // Show user-friendly notification
      if (event.detail?.message) {
        console.log('[AuthContext] Session expired:', event.detail.message);
      }
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    initializeAuth();

    // Cleanup event listener and renewal interval
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
      if (typeof window !== 'undefined' && window.__authRenewalInterval) {
        clearInterval(window.__authRenewalInterval);
      }
    };
  }, []);

  // Fetch wallet balance
  const fetchWalletBalance = async (authToken = token) => {
    try {
      if (!authToken) return;
      
      const response = await fetch(`${config.API_BASE_URL}/wallet/balance`, {
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

  // Validate token with backend and refresh user profile
  const verifySession = async (authToken = token) => {
    if (!authToken) return null;

    try {
      const response = await api.get('/users/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response?.data) {
        const freshUser = response.data.user || response.data;
        if (freshUser) {
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        }
        return freshUser;
      }
    } catch (error) {
      console.warn('Session verification failed:', error?.message || error);
      // Don't logout on verification failure - just warn
      // User might have internet issues or backend might be temporarily down
      // Let the app proceed with locally stored data
      return null;
    }
    return null;
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

      // Don't verify immediately - let the user proceed with stored data
      // Verification will happen on profile fetch or when needed
      console.log('AuthContext: Login successful');
      
      // Fetch wallet balance in background (don't block login)
      fetchWalletBalance(authToken).catch((err) => {
        console.warn('Failed to fetch wallet balance:', err?.message || err);
      });

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
    verifySession,
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