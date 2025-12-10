import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import io from 'socket.io-client';
import config from '../config';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    // Return default values instead of throwing error during development
    return {
      balance: 0,
      loading: false,
      transactions: [],
      fetchBalance: () => {},
      fetchTransactions: () => {},
      deductFromWallet: () => Promise.resolve(),
      addToWallet: () => Promise.resolve(),
      hasSufficientBalance: () => false,
      formatBalance: (amount) => `₹${(amount || 0).toLocaleString('en-IN')}`
    };
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection for real-time wallet updates
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const wsUrl = config.WS_URL || 'wss://api.gameonesport.xyz';
      const newSocket = io(wsUrl, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      // Join user's wallet room for real-time updates
      newSocket.emit('joinWalletRoom', user._id);
      
      // Listen for wallet updates
      newSocket.on('walletUpdated', handleWalletUpdate);
      newSocket.on('transactionAdded', handleTransactionAdded);

      setSocket(newSocket);

      return () => {
        newSocket.emit('leaveWalletRoom', user._id);
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user?._id]);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch wallet transactions
  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/wallet/transactions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
    }
  }, [isAuthenticated]);

  // Handle real-time wallet updates
  const handleWalletUpdate = useCallback((data) => {
    if (data.userId === user?._id) {
      setBalance(data.newBalance);
      
      // Show notification based on transaction type
      if (data.type === 'credit') {
        showSuccess(`₹${data.amount} added to your wallet`);
      } else if (data.type === 'debit') {
        showInfo(`₹${data.amount} deducted from your wallet`);
      }
    }
  }, [user?._id, showSuccess, showInfo]);

  // Handle real-time transaction updates
  const handleTransactionAdded = useCallback((data) => {
    if (data.userId === user?._id) {
      setTransactions(prev => [data.transaction, ...prev]);
    }
  }, [user?._id]);

  // Deduct from wallet (for tournament entries)
  const deductFromWallet = useCallback(async (amount, description, tournamentId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/wallet/deduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          description,
          tournamentId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to deduct from wallet');
      }

      const data = await response.json();
      
      // Update local balance immediately
      setBalance(data.newBalance);
      
      // Add transaction to local state
      if (data.transaction) {
        setTransactions(prev => [data.transaction, ...prev]);
      }

      return data;
    } catch (error) {
      showError(error.message);
      throw error;
    }
  }, [showError]);

  // Add to wallet (for winnings, refunds, etc.)
  const addToWallet = useCallback(async (amount, description, tournamentId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/wallet/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount,
          description,
          tournamentId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add to wallet');
      }

      const data = await response.json();
      
      // Update local balance immediately
      setBalance(data.newBalance);
      
      // Add transaction to local state
      if (data.transaction) {
        setTransactions(prev => [data.transaction, ...prev]);
      }

      showSuccess(`₹${amount} added to your wallet`);
      return data;
    } catch (error) {
      showError(error.message);
      throw error;
    }
  }, [showSuccess, showError]);

  // Check if user has sufficient balance
  const hasSufficientBalance = useCallback((amount) => {
    return balance >= amount;
  }, [balance]);

  // Format balance for display
  const formatBalance = useCallback((amount) => {
    return `₹${(amount || 0).toLocaleString('en-IN')}`;
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
      fetchTransactions();
    } else {
      // Reset wallet state when user logs out
      setBalance(0);
      setTransactions([]);
    }
  }, [isAuthenticated, fetchBalance, fetchTransactions]);

  const value = {
    balance,
    loading,
    transactions,
    fetchBalance,
    fetchTransactions,
    deductFromWallet,
    addToWallet,
    hasSufficientBalance,
    formatBalance
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;