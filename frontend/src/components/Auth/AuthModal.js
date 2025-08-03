import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight, Gamepad2, HelpCircle, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { login as apiLogin, register as apiRegister, validateBgmiId as apiValidateBgmiId } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const AuthModal = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    bgmiName: '',
    bgmiId: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [showBgmiHelp, setShowBgmiHelp] = useState(false);
  const [bgmiIdValidating, setBgmiIdValidating] = useState(false);
  const [bgmiIdValid, setBgmiIdValid] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [autoLogin, setAutoLogin] = useState(true);

  // Update activeTab when defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      // Reset loading state when modal opens
      setLoading(false);
      setError('');
    }
  }, [defaultTab, isOpen]);

  const handleLoginChange = (e) => {
    setLoginData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleRegisterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRegisterData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');

    // Validate username format when it changes
    if (name === 'username') {
      if (value && (value.length < 3 || value.length > 20)) {
        setError('Username must be between 3 and 20 characters');
      } else if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
        setError('Username can only contain letters, numbers, and underscores');
      } else if (value) {
        setError(''); // Clear error if username is valid
      }
    }

    // Validate BGMI ID format when it changes
    if (name === 'bgmiId') {
      setBgmiIdValid(null);
      if (value && !/^\d{10,12}$/.test(value)) {
        setError('BGMI Player ID must be 10-12 digits');
      } else if (value && /^\d{10,12}$/.test(value)) {
        // Simulate BGMI ID validation (in real implementation, call BGMI API)
        validateBgmiId(value);
      }
    }
  };

  // Real BGMI ID validation using API
  const validateBgmiId = async (bgmiId) => {
    setBgmiIdValidating(true);
    try {
      const response = await apiValidateBgmiId(bgmiId);
      setBgmiIdValid(response.valid);
      
      if (!response.valid) {
        setError(response.message || 'Invalid BGMI ID. Please enter a valid Player ID.');
      } else {
        setError(''); // Clear any previous errors
      }
    } catch (error) {
      setBgmiIdValid(false);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Unable to verify BGMI ID. Please try again.');
      }
    } finally {
      setBgmiIdValidating(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate input
    if (!loginData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!loginData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    setError('');

    // Set a minimum loading time for better UX
    const startTime = Date.now();
    const minLoadingTime = 1000; // 1 second

    try {
      console.log('AuthModal: Starting login process');
      const response = await apiLogin(loginData.email.trim(), loginData.password);
      console.log('AuthModal: Login response received');

      if (response.success && response.user && response.token) {
        // Login successful
        const loginSuccess = login(response.user, response.token);
        
        if (loginSuccess) {
          setSuccess(true);
          console.log('AuthModal: Login successful, redirecting...');
          
          // Ensure minimum loading time
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < minLoadingTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
          }

          // Close modal and redirect
          setTimeout(() => {
            onClose();
            setSuccess(false);
            navigate('/dashboard');
          }, 500);
        } else {
          throw new Error('Failed to initialize login state');
        }
      } else {
        throw new Error(response.message || 'Invalid response from server');
      }
    } catch (error) {
      console.error('AuthModal: Login error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 404) {
        setError('User does not exist');
      } else if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else if (error.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.message.includes('timeout')) {
        setError('Request timeout. Please try again.');
      } else if (error.message.includes('Network Error')) {
        setError('Cannot connect to server. Please check your internet connection.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      // Ensure minimum loading time
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      setLoading(false);
    }
  };

  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'username':
        if (!value.trim()) {
          errors.username = 'Username is required';
        } else if (value.length < 3 || value.length > 20) {
          errors.username = 'Username must be between 3 and 20 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          errors.username = 'Username can only contain letters, numbers, and underscores';
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
        
      case 'bgmiName':
        if (!value.trim()) {
          errors.bgmiName = 'BGMI In-Game Name is required';
        } else if (value.length < 3 || value.length > 20) {
          errors.bgmiName = 'BGMI Name must be between 3 and 20 characters';
        }
        break;
        
      case 'bgmiId':
        if (!value.trim()) {
          errors.bgmiId = 'BGMI Player ID is required';
        } else if (!/^\d{8,12}$/.test(value)) {
          errors.bgmiId = 'BGMI Player ID must be 8-12 digits';
        }
        break;
        
      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        }
        break;
        
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== registerData.password) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;
    }
    
    return errors;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Set a minimum loading time for better UX
    const startTime = Date.now();
    const minLoadingTime = 1000; // 1 second

    // Validate all fields
    let errors = {};
    Object.keys(registerData).forEach(field => {
      const fieldErrors = validateField(field, registerData[field]);
      errors = { ...errors, ...fieldErrors };
    });

    // Check terms agreement
    if (!registerData.agreeToTerms) {
      errors.terms = 'Please agree to the terms and conditions';
    }

    // Check BGMI ID validation
    if (bgmiIdValid === false) {
      errors.bgmiId = 'Please enter a valid BGMI Player ID';
    }

    // If there are any errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const data = await apiRegister({
        username: registerData.username,
        email: registerData.email,
        gameProfile: {
          bgmiName: registerData.bgmiName,
          bgmiId: registerData.bgmiId
        },
        password: registerData.password,
        agreeToTerms: registerData.agreeToTerms
      });

      if (data.success) {
        setSuccess(true);

        // If auto-login is enabled, log in the user
        if (autoLogin) {
          login(data.user, data.token);
          
          // Ensure minimum loading time for better UX
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime < minLoadingTime) {
            await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
          }

          // Close modal and redirect
          setTimeout(() => {
            onClose();
            setSuccess(false);
            navigate('/dashboard');
          }, 500);
        } else {
          // Just close modal and switch to login tab
          setTimeout(() => {
            setSuccess(false);
            setActiveTab('login');
            resetForm();
          }, 1500);
        }
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.status === 400) {
        setError(error.response?.data?.message || 'Registration failed. Please check your details.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLoginData({ email: '', password: '' });
    setRegisterData({
      username: '',
      email: '',
      bgmiName: '',
      bgmiId: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    });
    setError('');
    setSuccess(false);
    setLoading(false); // Always reset loading state
    setShowPassword(false);
    setShowConfirmPassword(false);
    setBgmiIdValid(null);
    setBgmiIdValidating(false);
    setShowBgmiHelp(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="auth-modal-container">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="auth-modal bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden"
          >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="p-6 pb-0">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {activeTab === 'login' ? 'Welcome Back!' : 'Join GameOn'}
              </h2>
              <p className="text-gray-400">
                {activeTab === 'login' 
                  ? 'Sign in to continue your gaming journey' 
                  : 'Create your account and start winning'
                }
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6">
              <button
                onClick={() => {
                  setActiveTab('login');
                  resetForm();
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === 'login'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  resetForm();
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                  activeTab === 'register'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    ✓
                  </motion.div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {activeTab === 'login' ? 'Welcome back!' : 'Account created!'}
                </h3>
                <p className="text-gray-400">
                  {activeTab === 'login' 
                    ? 'You have been successfully logged in.' 
                    : 'Your account has been created successfully.'
                  }
                </p>
              </motion.div>
            ) : (
              <>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {activeTab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-white font-medium mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="username"
                          value={registerData.username}
                          onChange={handleRegisterChange}
                          placeholder="Choose a username"
                          className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={registerData.email}
                          onChange={handleRegisterChange}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        BGMI In-Game Name (IGN)
                      </label>
                      <div className="relative">
                        <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="bgmiName"
                          value={registerData.bgmiName}
                          onChange={handleRegisterChange}
                          placeholder="Enter your BGMI in-game name"
                          className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-white font-medium">
                          BGMI Player ID
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowBgmiHelp(true)}
                          className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors duration-300"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span className="text-sm">How to find?</span>
                        </button>
                      </div>
                      <div className="relative">
                        <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="bgmiId"
                          value={registerData.bgmiId}
                          onChange={handleRegisterChange}
                          placeholder="Enter your 10-12 digit BGMI Player ID"
                          className={`w-full pl-10 pr-12 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                            bgmiIdValid === true 
                              ? 'border-green-500 focus:ring-green-500' 
                              : bgmiIdValid === false 
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-700 focus:ring-blue-500'
                          }`}
                          required
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {bgmiIdValidating ? (
                            <LoadingSpinner size="sm" color="blue" />
                          ) : bgmiIdValid === true ? (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          ) : bgmiIdValid === false ? (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✗</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      {registerData.bgmiId && !/^\d{10,12}$/.test(registerData.bgmiId) && (
                        <p className="text-red-400 text-sm mt-1">
                          Player ID must be 10-12 digits only
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={registerData.password}
                          onChange={handleRegisterChange}
                          placeholder="Create a password"
                          className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={registerData.confirmPassword}
                          onChange={handleRegisterChange}
                          placeholder="Confirm your password"
                          className="w-full pl-10 pr-12 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="agreeToTerms"
                          checked={registerData.agreeToTerms}
                          onChange={handleRegisterChange}
                          className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                          required
                        />
                        <label className="text-gray-300 text-sm">
                          I agree to the{' '}
                          <a href="#" className="text-blue-400 hover:text-blue-300">
                            Terms of Service
                          </a>
                          {' '}and{' '}
                          <a href="#" className="text-blue-400 hover:text-blue-300">
                            Privacy Policy
                          </a>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="autoLogin"
                          checked={autoLogin}
                          onChange={(e) => setAutoLogin(e.target.checked)}
                          className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label className="text-gray-300 text-sm">
                          Automatically sign in after registration
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
          </motion.div>

          {/* BGMI Help Modal */}
          {showBgmiHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowBgmiHelp(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">How to find your BGMI Player ID</h3>
                  <button
                    onClick={() => setShowBgmiHelp(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors duration-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Help Image */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src="/images/bgmi-player-id-help.png"
                      alt="BGMI Player ID Location"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Image className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">Step-by-step guide:</span>
                    </div>
                    <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
                      <li>Open BGMI (Battlegrounds Mobile India)</li>
                      <li>Tap your profile picture in the top-right corner</li>
                      <li>Your Player ID is shown below your username</li>
                      <li>It should be 8-12 digits long</li>
                    </ol>
                  </div>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-sm">
                      <strong>Important:</strong> Your Player ID is different from your in-game name. 
                      Make sure to enter the numeric ID, not your username.
                    </p>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm">
                      <strong>Example:</strong> If your profile shows "ID: 5123456789", enter only the numbers: 5123456789
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowBgmiHelp(false)}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors duration-300"
                >
                  Got it!
                </button>
              </motion.div>
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;