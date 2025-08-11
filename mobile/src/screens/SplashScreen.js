/**
 * Splash Screen
 * Initial loading screen with GameOn branding
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { loadStoredAuth } from '../store/slices/authSlice';

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const dispatch = useDispatch();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Load stored authentication
    const timer = setTimeout(() => {
      dispatch(loadStoredAuth());
    }, 2000);

    return () => clearTimeout(timer);
  }, [dispatch, fadeAnim, scaleAnim]);

  return (
    <LinearGradient
      colors={['#FF6B35', '#F7931E', '#FF6B35']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Icon name="gamepad-variant" size={80} color="#FFFFFF" />
          <Text style={styles.logoText}>GameOn</Text>
          <Text style={styles.tagline}>Play. Compete. Win.</Text>
        </View>

        <View style={styles.loadingContainer}>
          <Animated.View style={styles.loadingDot} />
          <Animated.View style={[styles.loadingDot, { marginLeft: 10 }]} />
          <Animated.View style={[styles.loadingDot, { marginLeft: 10 }]} />
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by GameOn Platform
        </Text>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 10,
    opacity: 0.9,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  versionText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 5,
  },
});

export default SplashScreen;