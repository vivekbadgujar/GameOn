/**
 * Simple Test App
 * Basic React Native app to test if the issue is with the main app or Expo setup
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const TestApp = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      <View style={styles.content}>
        <Text style={styles.title}>🎮 GameOn Mobile</Text>
        <Text style={styles.subtitle}>Test App Running Successfully!</Text>
        <Text style={styles.info}>✅ Expo is working</Text>
        <Text style={styles.info}>✅ React Native is working</Text>
        <Text style={styles.info}>✅ Basic components are working</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default TestApp;