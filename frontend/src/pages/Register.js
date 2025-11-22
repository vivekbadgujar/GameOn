import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Trophy, 
  ArrowRight,
  Check,
  Gamepad2,
  Star,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { register as apiRegister } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bgmiName: '',
    bgmiId: '',
    agreeToTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.bgmiName.trim()) {
      setError('BGMI In-Game Name is required');
      return false;
    }
    if (formData.bgmiName.length < 3) {
      setError('BGMI In-Game Name must be at least 3 characters');
      return false;
    }
    if (!formData.bgmiId.trim()) {
      setError('BGMI Player ID is required');
      return false;
    }
    if (!/^\d{9,10}$/.test(formData.bgmiId)) {
      setError('BGMI Player ID must be 9-10 digits');
      return false;
    }
    if (!formData.agreeToTerms) {
      setError('Please agree to GameOn\'s Terms & Conditions, Refund Policy, Privacy Policy, and Fair Play Policy');
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        gameProfile: {
          bgmiName: formData.bgmiName,
          bgmiId: formData.bgmiId
        }
      };

      const data = await apiRegister(registrationData);

      if (data.success) {
        // Login the user
        login(data.user, data.token);
        setSuccess(true);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-blue-600 to-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm float-animation" />
        <div className="absolute top-40 right-32 w-16 h-16 bg-white/10 rounded-xl backdrop-blur-sm float-animation" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-32 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm float-animation" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Join GameOn</h1>
            <p className="text-xl text-white/80 mb-8">
              Start your esports journey today
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Free to Join</h3>
                <p className="text-white/70">No registration fees</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instant Payouts</h3>
                <p className="text-white/70">Win and get paid instantly</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">24/7 Support</h3>
                <p className="text-white/70">We're always here to help</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">GameOn</h1>
            <p className="text-white/60">Create your account</p>
          </div>

          <div className="glass-card p-8">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to GameOn!</h2>
                <p className="text-white/60 mb-6">
                  Your account has been created successfully. Redirecting to dashboard...
                </p>
                <LoadingSpinner size="md" color="green" />
              </motion.div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Create Account
                  </h2>
                  <p className="text-white/60">
                    Fill in your details to get started
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6"
                  >
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  </motion.div>
                )}

                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Choose a username"
                        className="input-field pl-12 w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter your email"
                        className="input-field pl-12 w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Create a password"
                        className="input-field pl-12 pr-12 w-full"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors duration-300"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm your password"
                        className="input-field pl-12 pr-12 w-full"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors duration-300"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">
                      BGMI In-Game Name (IGN) *
                    </label>
                    <div className="relative">
                      <Gamepad2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        name="bgmiName"
                        value={formData.bgmiName}
                        onChange={handleInputChange}
                        placeholder="Enter your BGMI IGN"
                        className="input-field pl-12 w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">
                      BGMI Player ID *
                    </label>
                    <div className="relative">
                      <Trophy className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <input
                        type="text"
                        name="bgmiId"
                        value={formData.bgmiId}
                        onChange={handleInputChange}
                        placeholder="Enter your BGMI Player ID (9-10 digits)"
                        className="input-field pl-12 w-full"
                        pattern="[0-9]{9,10}"
                        required
                      />
                    </div>
                    <p className="text-white/50 text-xs mt-2">
                      Your BGMI Player ID can be found in your game profile
                    </p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                      required
                    />
                    <label className="text-white/80 text-sm leading-relaxed">
                      I have read and agree to GameOn's{' '}
                      <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                        Terms & Conditions
                      </Link>
                      ,{' '}
                      <Link href="/refund" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                        Refund Policy
                      </Link>
                      ,{' '}
                      <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                        Privacy Policy
                      </Link>
                      , and{' '}
                      <Link href="/fairplay" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                        Fair Play Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

                <div className="mt-8 text-center">
                  <p className="text-white/60">
                    Already have an account?{' '}
                    <Link 
                      href="/login" 
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};


export default Register;