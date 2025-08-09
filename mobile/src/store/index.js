/**
 * Redux Store Configuration
 * Unified state management for mobile app
 */

import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

import authSlice from './slices/authSlice';
import tournamentsSlice from './slices/tournamentsSlice';
import walletSlice from './slices/walletSlice';
import syncSlice from './slices/syncSlice';
import notificationsSlice from './slices/notificationsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'sync'], // Only persist auth and sync data
  blacklist: ['tournaments', 'wallet', 'notifications'] // Don't persist real-time data
};

const rootReducer = combineReducers({
  auth: authSlice,
  tournaments: tournamentsSlice,
  wallet: walletSlice,
  sync: syncSlice,
  notifications: notificationsSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;