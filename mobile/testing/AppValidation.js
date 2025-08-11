/**
 * App Validation Script
 * Validates app structure and identifies potential issues
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// Import all screens to validate they can be loaded
import SplashScreen from '../src/screens/SplashScreen';
import AuthScreen from '../src/screens/AuthScreen';
import HomeScreen from '../src/screens/HomeScreen';
import TournamentsScreen from '../src/screens/TournamentsScreen';
import TournamentDetailsScreen from '../src/screens/TournamentDetailsScreen';
import MyTournamentsScreen from '../src/screens/MyTournamentsScreen';
import WalletScreen from '../src/screens/WalletScreen';
import ProfileScreen from '../src/screens/ProfileScreen';
import NotificationsScreen from '../src/screens/NotificationsScreen';
import RoomLobbyScreen from '../src/screens/RoomLobbyScreen';
import LeaderboardScreen from '../src/screens/LeaderboardScreen';

// Import store and slices
import { store } from '../src/store';
import authSlice from '../src/store/slices/authSlice';
import tournamentsSlice from '../src/store/slices/tournamentsSlice';
import walletSlice from '../src/store/slices/walletSlice';
import notificationsSlice from '../src/store/slices/notificationsSlice';
import syncSlice from '../src/store/slices/syncSlice';

// Import components
import LoadingSpinner from '../src/components/LoadingSpinner';
import LoadingScreen from '../src/components/LoadingScreen';
import TournamentCard from '../src/components/TournamentCard';

// Import navigation
import AppNavigator from '../src/navigation/AppNavigator';

// Import providers
import SyncProvider from '../src/providers/SyncProvider';

// Import config
import config from '../src/config';

const AppValidation = () => {
  const validationResults = [];

  // Validate screens
  const screens = [
    { name: 'SplashScreen', component: SplashScreen },
    { name: 'AuthScreen', component: AuthScreen },
    { name: 'HomeScreen', component: HomeScreen },
    { name: 'TournamentsScreen', component: TournamentsScreen },
    { name: 'TournamentDetailsScreen', component: TournamentDetailsScreen },
    { name: 'MyTournamentsScreen', component: MyTournamentsScreen },
    { name: 'WalletScreen', component: WalletScreen },
    { name: 'ProfileScreen', component: ProfileScreen },
    { name: 'NotificationsScreen', component: NotificationsScreen },
    { name: 'RoomLobbyScreen', component: RoomLobbyScreen },
    { name: 'LeaderboardScreen', component: LeaderboardScreen },
  ];

  // Validate components
  const components = [
    { name: 'LoadingSpinner', component: LoadingSpinner },
    { name: 'LoadingScreen', component: LoadingScreen },
    { name: 'TournamentCard', component: TournamentCard },
  ];

  // Validate store slices
  const slices = [
    { name: 'authSlice', slice: authSlice },
    { name: 'tournamentsSlice', slice: tournamentsSlice },
    { name: 'walletSlice', slice: walletSlice },
    { name: 'notificationsSlice', slice: notificationsSlice },
    { name: 'syncSlice', slice: syncSlice },
  ];

  // Validate imports
  screens.forEach(screen => {
    try {
      if (screen.component) {
        validationResults.push({
          type: 'Screen',
          name: screen.name,
          status: 'PASS',
          message: 'Successfully imported'
        });
      } else {
        validationResults.push({
          type: 'Screen',
          name: screen.name,
          status: 'FAIL',
          message: 'Component is undefined'
        });
      }
    } catch (error) {
      validationResults.push({
        type: 'Screen',
        name: screen.name,
        status: 'FAIL',
        message: error.message
      });
    }
  });

  components.forEach(component => {
    try {
      if (component.component) {
        validationResults.push({
          type: 'Component',
          name: component.name,
          status: 'PASS',
          message: 'Successfully imported'
        });
      } else {
        validationResults.push({
          type: 'Component',
          name: component.name,
          status: 'FAIL',
          message: 'Component is undefined'
        });
      }
    } catch (error) {
      validationResults.push({
        type: 'Component',
        name: component.name,
        status: 'FAIL',
        message: error.message
      });
    }
  });

  slices.forEach(slice => {
    try {
      if (slice.slice && slice.slice.reducer) {
        validationResults.push({
          type: 'Redux Slice',
          name: slice.name,
          status: 'PASS',
          message: 'Reducer available'
        });
      } else {
        validationResults.push({
          type: 'Redux Slice',
          name: slice.name,
          status: 'FAIL',
          message: 'Reducer not found'
        });
      }
    } catch (error) {
      validationResults.push({
        type: 'Redux Slice',
        name: slice.name,
        status: 'FAIL',
        message: error.message
      });
    }
  });

  // Validate store
  try {
    if (store && store.getState) {
      const state = store.getState();
      validationResults.push({
        type: 'Store',
        name: 'Redux Store',
        status: 'PASS',
        message: `State keys: ${Object.keys(state).join(', ')}`
      });
    } else {
      validationResults.push({
        type: 'Store',
        name: 'Redux Store',
        status: 'FAIL',
        message: 'Store not properly configured'
      });
    }
  } catch (error) {
    validationResults.push({
      type: 'Store',
      name: 'Redux Store',
      status: 'FAIL',
      message: error.message
    });
  }

  // Validate navigation
  try {
    if (AppNavigator) {
      validationResults.push({
        type: 'Navigation',
        name: 'AppNavigator',
        status: 'PASS',
        message: 'Navigation component available'
      });
    } else {
      validationResults.push({
        type: 'Navigation',
        name: 'AppNavigator',
        status: 'FAIL',
        message: 'Navigation component not found'
      });
    }
  } catch (error) {
    validationResults.push({
      type: 'Navigation',
      name: 'AppNavigator',
      status: 'FAIL',
      message: error.message
    });
  }

  // Validate config
  try {
    if (config && config.API_CONFIG) {
      validationResults.push({
        type: 'Config',
        name: 'App Config',
        status: 'PASS',
        message: `API Base URL: ${config.API_CONFIG.BASE_URL}`
      });
    } else {
      validationResults.push({
        type: 'Config',
        name: 'App Config',
        status: 'FAIL',
        message: 'Configuration not found'
      });
    }
  } catch (error) {
    validationResults.push({
      type: 'Config',
      name: 'App Config',
      status: 'FAIL',
      message: error.message
    });
  }

  const passedTests = validationResults.filter(r => r.status === 'PASS').length;
  const totalTests = validationResults.length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GameOn App Validation</Text>
        <Text style={styles.subtitle}>
          {passedTests}/{totalTests} tests passed ({successRate}%)
        </Text>
      </View>

      {validationResults.map((result, index) => (
        <View key={index} style={[
          styles.resultItem,
          result.status === 'PASS' ? styles.passItem : styles.failItem
        ]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultType}>{result.type}</Text>
            <Text style={[
              styles.resultStatus,
              result.status === 'PASS' ? styles.passText : styles.failText
            ]}>
              {result.status}
            </Text>
          </View>
          <Text style={styles.resultName}>{result.name}</Text>
          <Text style={styles.resultMessage}>{result.message}</Text>
        </View>
      ))}

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Validation Summary</Text>
        <Text style={styles.summaryText}>
          {successRate >= 90 ? '✅ App structure is excellent!' :
           successRate >= 75 ? '⚠️ App structure needs minor fixes' :
           '❌ App structure has critical issues'}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FF6B35',
  },
  resultItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  passItem: {
    borderLeftColor: '#4CAF50',
  },
  failItem: {
    borderLeftColor: '#F44336',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  passText: {
    color: '#4CAF50',
  },
  failText: {
    color: '#F44336',
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resultMessage: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  summary: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    color: '#FF6B35',
    textAlign: 'center',
  },
});

export default AppValidation;