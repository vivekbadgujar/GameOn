/**
 * Loading Spinner Component
 * Reusable loading indicator
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const LoadingSpinner = ({ message = 'Loading...', size = 'large' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        animating={true}
        color="#FF6B35"
        size={size}
        style={styles.spinner}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default LoadingSpinner;