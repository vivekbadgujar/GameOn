/**
 * Authentication Screen
 * Handles login with real-time data sync demonstration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { loginUser, sendOTP, verifyOTP } from '../store/slices/authSlice';
import { useSync } from '../providers/SyncProvider';
import { API_BASE_URL } from '../config';

const { width, height } = Dimensions.get('window');

const AuthScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error, otpSent } = useSelector(state => state.auth);
  const { isConnected } = useSync();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    if (isConnected) {
      setSyncStatus('🟢 Connected - Ready for real-time sync');
    } else {
      setSyncStatus('🔴 Disconnected - Will sync when connected');
    }
  }, [isConnected]);

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('otp');
        Alert.alert('OTP Sent', 'Please check your phone for the OTP');
      } else {
        Alert.alert('Error', data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setSyncStatus('🔄 Logging in and syncing data...');
      
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (data.success) {
        // Dispatch login action
        dispatch(loginUser({
          user: data.user,
          token: data.token
        }));

        setSyncStatus('✅ Login successful! Syncing your data from website...');
        
        // Show sync demonstration
        setTimeout(() => {
          Alert.alert(
            'Welcome Back! 🎉',
            `Your data has been synced from all platforms:\n\n` +
            `💰 Wallet Balance: ₹${data.user.wallet?.balance || 0}\n` +
            `🎮 Active Tournaments: ${data.user.activeTournaments || 0}\n` +
            `📱 Real-time sync is now active!\n\n` +
            `Any changes on website will appear here instantly!`,
            [{ text: 'Continue', onPress: () => navigation.replace('Main') }]
          );
        }, 1000);
        
      } else {
        Alert.alert('Error', data.message || 'Invalid OTP');
        setSyncStatus('❌ Login failed');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      setSyncStatus('❌ Network error');
    }
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter Your Phone Number</Text>
      <Text style={styles.stepSubtitle}>
        We'll send you an OTP to verify your account
      </Text>
      
      <View style={styles.inputContainer}>
        <Icon name="phone" size={20} color="#FF6B35" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter 10-digit phone number"
          placeholderTextColor="#666"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          maxLength={10}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, (!phoneNumber || phoneNumber.length !== 10) && styles.buttonDisabled]}
        onPress={handleSendOTP}
        disabled={loading || !phoneNumber || phoneNumber.length !== 10}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Enter OTP</Text>
      <Text style={styles.stepSubtitle}>
        Enter the 6-digit code sent to {phoneNumber}
      </Text>
      
      <View style={styles.inputContainer}>
        <Icon name="lock" size={20} color="#FF6B35" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit OTP"
          placeholderTextColor="#666"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, (!otp || otp.length !== 6) && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading || !otp || otp.length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Verify & Login</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setStep('phone');
          setOtp('');
        }}
      >
        <Text style={styles.backButtonText}>← Change Phone Number</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#1A1A1A', '#2A2A2A']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>🎮 GameOn</Text>
          <Text style={styles.tagline}>Unified Gaming Platform</Text>
        </View>

        <View style={styles.syncStatusContainer}>
          <Text style={styles.syncStatusText}>{syncStatus}</Text>
        </View>

        <View style={styles.formContainer}>
          {step === 'phone' ? renderPhoneStep() : renderOTPStep()}
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>🚀 Real-time Sync Features</Text>
          
          <View style={styles.feature}>
            <Icon name="sync" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>
              Instant sync between mobile app and website
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="wallet" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>
              Wallet balance updates in real-time
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="trophy" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>
              Tournament joins reflect instantly
            </Text>
          </View>
          
          <View style={styles.feature}>
            <Icon name="bell" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>
              Push notifications across all devices
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Login once, sync everywhere! 🌟
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  syncStatusContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  syncStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    width: '100%',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#FFFFFF',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
  },
  backButtonText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  featuresContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#B0B0B0',
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AuthScreen;