/**
 * GameOn Mobile App
 * React Native App with real-time sync
 */

import React, { useEffect } from 'react';
import { StatusBar, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider, configureFonts } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';
import SyncProvider from './src/providers/SyncProvider';
import LoadingScreen from './src/components/LoadingScreen';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const App = () => {
  useEffect(() => {
    // Keep splash screen visible while loading
    SplashScreen.preventAutoHideAsync();

    // Initialize app
    initializeApp();

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

  const initializeApp = async () => {
    try {
      // Request notification permissions
      await requestNotificationPermission();
      
      // Hide splash screen after initialization
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error('App initialization error:', error);
      await SplashScreen.hideAsync();
    }
  };

  const requestNotificationPermission = async () => {
    try {
      // Request Expo notifications permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      // Request Firebase messaging permission
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