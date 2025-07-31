import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { login as apiLogin, register as apiRegister } from '../../services/api';
import LoadingSpinner from '../UI/LoadingSpinner';

const AuthModal = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login } = useAuth();
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
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  // Update activeTab when defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiLogin(loginData.email, loginData.password);

      if (data.success) {
        login(data.user, data.token);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!registerData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      const data = await apiRegister({
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        agreeToTerms: registerData.agreeToTerms
      });

      if (data.success) {
        login(data.user, data.token);
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
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
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    });
    setError('');
    setSuccess(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
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
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;