import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  Gamepad2,
  Trophy,
  Zap,
  Globe
} from 'lucide-react';

const NoConnection = ({ onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate retry delay
      if (onRetry) {
        onRetry();
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const floatingIcons = [
    { icon: Gamepad2, delay: 0, color: 'from-blue-500 to-cyan-400' },
    { icon: Trophy, delay: 0.5, color: 'from-yellow-500 to-orange-400' },
    { icon: Zap, delay: 1, color: 'from-purple-500 to-pink-400' },
    { icon: Globe, delay: 1.5, color: 'from-green-500 to-emerald-400' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Gaming Icons */}
        {floatingIcons.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              className={`absolute w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center opacity-10`}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 4,
                delay: item.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                left: `${20 + index * 20}%`,
                top: `${30 + index * 10}%`,
              }}
            >
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
          );
        })}

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 48 }).map((_, i) => (
              <motion.div
                key={i}
                className="bg-white/10 rounded"
                animate={{
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center max-w-2xl mx-auto"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              GameOn
            </span>
          </h1>
        </motion.div>

        {/* Connection Status Icon */}
        <motion.div
          className="mb-8"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-red-500/30">
              <AnimatePresence mode="wait">
                {animationStep < 2 ? (
                  <motion.div
                    key="wifi-off"
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 180 }}
                    transition={{ duration: 0.5 }}
                  >
                    <WifiOff className="w-16 h-16 text-red-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="wifi-searching"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Wifi className="w-16 h-16 text-yellow-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Pulse Rings */}
            <motion.div
              className="absolute inset-0 border-2 border-red-400/30 rounded-full"
              animate={{
                scale: [1, 1.5, 2],
                opacity: [0.5, 0.2, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <motion.div
              className="absolute inset-0 border-2 border-red-400/20 rounded-full"
              animate={{
                scale: [1, 1.8, 2.5],
                opacity: [0.3, 0.1, 0],
              }}
              transition={{
                duration: 2,
                delay: 0.5,
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Connection Lost
          </h2>
          <p className="text-xl text-white/70 mb-6 leading-relaxed">
            Looks like your internet connection is playing hide and seek! 
            <br className="hidden md:block" />
            Don't worry, we'll get you back in the game.
          </p>
          
          {/* Status Messages */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">Connection Status</span>
            </div>
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-center justify-between">
                <span>Network Status:</span>
                <span className="text-red-400 font-medium">Disconnected</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Last Connected:</span>
                <span className="text-white/80">Just now</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-retry:</span>
                <span className="text-blue-400 font-medium">Enabled</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-4"
        >
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3 mx-auto"
          >
            <motion.div
              animate={isRetrying ? { rotate: 360 } : {}}
              transition={isRetrying ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
            <span>{isRetrying ? 'Reconnecting...' : 'Try Again'}</span>
            
            {/* Button Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
          </button>

          <p className="text-white/50 text-sm">
            Or check your internet connection and refresh the page
          </p>
        </motion.div>

        {/* Gaming Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-white font-semibold mb-3 flex items-center justify-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-blue-400" />
            <span>Pro Gaming Tip</span>
          </h3>
          <p className="text-white/70 text-sm">
            While you wait, make sure your gaming setup is optimized! 
            A stable internet connection is crucial for competitive gaming. 
            Consider using a wired connection for the best performance.
          </p>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-8 text-white/40 text-xs"
        >
          <p>GameOn Platform • India's Premier Gaming Destination</p>
        </motion.div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full opacity-60" />
      <div className="absolute top-20 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-40" />
      <div className="absolute bottom-20 left-20 w-2 h-2 bg-green-400 rounded-full opacity-50" />
      <div className="absolute bottom-10 right-10 w-4 h-4 bg-yellow-400 rounded-full opacity-30" />
    </div>
  );
};

export default NoConnection;