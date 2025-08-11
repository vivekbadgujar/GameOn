/**
 * Wallet Slice
 * Manages wallet balance and transactions
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_BASE_URL = 'http://localhost:5000';

// Async thunks
export const fetchWalletBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch balance');
      }

      return data.balance;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async ({ page = 1, limit = 20 } = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(
        `${API_BASE_URL}/api/wallet/transactions?page=${page}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to fetch transactions');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const addMoney = createAsyncThunk(
  'wallet/addMoney',
  async ({ amount, paymentMethod }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/wallet/add-money`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, paymentMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to add money');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const withdrawMoney = createAsyncThunk(
  'wallet/withdrawMoney',
  async ({ amount, bankDetails }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/wallet/withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, bankDetails }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Failed to withdraw money');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  balance: 0,
  transactions: [],
  isLoading: false,
  isProcessing: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
  },
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch balance
      .addCase(fetchWalletBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload;
        state.error = null;
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        const { transactions, pagination } = action.payload;
        
        if (pagination.currentPage === 1) {
          state.transactions = transactions;
        } else {
          state.transactions = [...state.transactions, ...transactions];
        }
        
        state.pagination = pagination;
        state.error = null;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add money
      .addCase(addMoney.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(addMoney.fulfilled, (state, action) => {
        state.isProcessing = false;
        const { transaction, newBalance } = action.payload;
        state.balance = newBalance;
        state.transactions.unshift(transaction);
        state.error = null;
      })
      .addCase(addMoney.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      })
      // Withdraw money
      .addCase(withdrawMoney.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(withdrawMoney.fulfilled, (state, action) => {
        state.isProcessing = false;
        const { transaction, newBalance } = action.payload;
        state.balance = newBalance;
        state.transactions.unshift(transaction);
        state.error = null;
      })
      .addCase(withdrawMoney.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateBalance, addTransaction } = walletSlice.actions;
export default walletSlice.reducer;