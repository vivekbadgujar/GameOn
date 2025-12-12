// Auto-generated lowercase login page to align with route casing on Linux
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Trophy, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Gamepad2,
  Star,
  Zap,
  Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { login as apiLogin } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ForgotPasswordModal from '../components/Auth/ForgotPasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiLogin(email, password);

      if (response.success) {
        // Store token and user data
        login(response.user, response.token);
        
        // Verify session with /users/profile endpoint before redirect
        try {
          const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.gameonesport.xyz/api'}/users/profile`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${response.token}`,
              'Content-Type': 'application/json'
            }
          });

          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              console.log('Session verified successfully');
              router.push('/dashboard');
            } else {
              setError('Session verification failed. Please try again.');
            }
          } else {
            console.warn('Session verification returned non-OK status:', verifyResponse.status);
            // Still allow redirect if cookie might be set
            router.push('/dashboard');
          }
        } catch (verifyError) {
          console.warn('Session verification error (non-blocking):', verifyError);
          // Still allow redirect - cookie might be set by backend
          router.push('/dashboard');
        }
      } else {
        setError(response.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
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
            <h1 className="text-5xl font-bold mb-4">GameOn</h1>
            <p className="text-xl text-white/80 mb-8">
              India's Premier Gaming Tournament Platform
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
                <h3 className="font-semibold text-lg">Multiple Games</h3>
                <p className="text-white/70">BGMI, VALORANT, Chess & more</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real Prizes</h3>
                <p className="text-white/70">Win cash prizes & rewards</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Live Tournaments</h3>
                <p className="text-white/70">Join tournaments 24/7</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">GameOn</h1>
            <p className="text-white/60">Welcome back, gamer!</p>
          </div>

          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Login to GameOn
              </h2>
              <p className="text-white/60">
                Enter your credentials to access your account
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

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-white font-semibold mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 bg-transparent border-2 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-white/80 text-sm">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300"
                >
                  Forgot password?
                </button>
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
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-white/60">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-300"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-white/40 text-sm mt-6">
            By continuing, you agree to our{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
          </p>
        </motion.div>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export async function getServerSideProps() {
  return {
    props: {},
  };
}

export default Login;
 