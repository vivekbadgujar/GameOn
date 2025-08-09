/**
 * GameOn Mobile App
 * React Native App with real-time sync
 */

import React, { useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider } from 'react-native-paper';
import SplashScreen from 'react-native-splash-screen';
import messaging from '@react-native-firebase/messaging';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';
import SyncProvider from './src/providers/SyncProvider';
import LoadingScreen from './src/components/LoadingScreen';

const App = () => {
  useEffect(() => {
    // Hide splash screen
    SplashScreen.hide();

    // Request notification permission
    requestNotificationPermission();

    // Handle background messages
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'GameOn',
        remoteMessage.notification?.body || 'You have a new notification'
      );
    });

    return unsubscribe;
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
        
        // Get FCM token
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        
        // Store token for sync with backend
        // This will be handled by SyncProvider
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <PaperProvider theme={theme}>
          <SyncProvider>
            <NavigationContainer theme={theme}>
              <StatusBar
                barStyle="light-content"
                backgroundColor={theme.colors.primary}
              />
              <AppNavigator />
            </NavigationContainer>
          </SyncProvider>
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;