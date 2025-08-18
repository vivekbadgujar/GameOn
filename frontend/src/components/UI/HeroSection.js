import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Zap, Target, Crown } from 'lucide-react';

const HeroSection = ({ user, isAuthenticated }) => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 rounded-3xl" />
      
      {/* Floating Elements */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full flex items-center justify-center"
      >
        <Crown className="w-8 h-8 text-yellow-400" />
      </motion.div>

      <motion.div
        animate={{ 
          y: [0, 15, 0],
          x: [0, 5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-xl flex items-center justify-center"
      >
        <Target className="w-6 h-6 text-green-400" />
      </motion.div>

      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute top-1/2 right-8 w-8 h-8 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full flex items-center justify-center"
      >
        <Zap className="w-4 h-4 text-purple-400" />
      </motion.div>

      {/* Main Content */}
      <div className="relative z-10 text-center py-16 px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-6xl font-bold text-white mb-4"
            >
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                {user?.username || 'Champion'}
              </span>
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block ml-2"
              >
                👋
              </motion.span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-white/70 max-w-2xl mx-auto mb-8"
            >
              Ready to dominate the battlefield? Your next victory awaits in today's tournaments.
            </motion.p>
          </div>

          {/* Stats Preview */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex justify-center space-x-8 mb-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">12</div>
                <div className="text-sm text-white/60">Tournaments Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">₹2,450</div>
                <div className="text-sm text-white/60">Total Earnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">#47</div>
                <div className="text-sm text-white/60">Global Rank</div>
              </div>
            </motion.div>
          )}

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Join Tournament
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              View Leaderboard
            </motion.button>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-8 left-8 w-2 h-2 bg-blue-400/40 rounded-full animate-ping" />
        <div className="absolute top-16 right-16 w-1 h-1 bg-purple-400/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-12 left-12 w-1.5 h-1.5 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-8 right-24 w-1 h-1 bg-green-400/40 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
      </div>
    </div>
  );
};

export default HeroSection;