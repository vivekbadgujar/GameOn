import React from 'react';
import { motion } from 'framer-motion';

const ModernBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/20 via-transparent to-purple-900/20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/10 via-transparent to-blue-900/10" />
      </div>

      {/* Floating geometric shapes */}
      <motion.div
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear"
        }}
        className="absolute top-1/4 right-1/6 w-64 h-64 opacity-10"
      >
        <div className="w-full h-full border border-blue-400/30 rounded-full">
          <div className="absolute inset-8 border border-purple-400/20 rounded-full">
            <div className="absolute inset-8 border border-cyan-400/20 rounded-full" />
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ 
          rotate: [360, 0],
          y: [0, -20, 0]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 left-1/6 w-48 h-48 opacity-10"
      >
        <div className="w-full h-full border border-green-400/30 rounded-lg rotate-45">
          <div className="absolute inset-6 border border-yellow-400/20 rounded-lg">
            <div className="absolute inset-6 border border-red-400/20 rounded-lg" />
          </div>
        </div>
      </motion.div>

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            animation: 'grid-drift 30s linear infinite'
          }}
        />
      </div>

      {/* Floating orbs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-xl"
          style={{
            width: `${60 + Math.random() * 40}px`,
            height: `${60 + Math.random() * 40}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
            scale: [1, 1.2, 0.8, 1],
            opacity: [0.3, 0.6, 0.3, 0.3],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Subtle light rays */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-blue-400/20 to-transparent transform -skew-x-12 opacity-30" />
      <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent transform skew-x-12 opacity-30" />
      <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent transform -skew-x-6 opacity-30" />

      {/* Animated particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Corner accent elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-br-full" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-tr-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-green-500/10 to-transparent rounded-tl-full" />

      <style jsx>{`
        @keyframes grid-drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(100px, 100px); }
        }
      `}</style>
    </div>
  );
};

export default ModernBackground;