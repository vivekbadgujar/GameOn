import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ targetDate, onComplete, className = '' }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (!isComplete) {
          setIsComplete(true);
          onComplete && onComplete();
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete, isComplete]);

  const TimeUnit = ({ value, label, isLast = false }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/10 backdrop-blur-md rounded-lg p-3 min-w-[60px] border border-white/20"
      >
        <span className="text-2xl font-bold text-white font-mono">
          {value.toString().padStart(2, '0')}
        </span>
      </motion.div>
      <span className="text-white/60 text-sm mt-2 font-medium">{label}</span>
      {!isLast && (
        <span className="text-white/40 text-xl font-bold absolute -right-3 top-3">:</span>
      )}
    </div>
  );

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center justify-center space-x-2 text-green-400 ${className}`}
      >
        <Clock className="w-5 h-5" />
        <span className="font-semibold">Time's up!</span>
      </motion.div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-blue-400" />
        <span className="text-white/80 font-medium">Credentials available in:</span>
      </div>
      
      <div className="flex items-center justify-center space-x-4 relative">
        {timeLeft.days > 0 && (
          <>
            <TimeUnit value={timeLeft.days} label="Days" />
            <span className="text-white/40 text-xl font-bold">:</span>
          </>
        )}
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <span className="text-white/40 text-xl font-bold">:</span>
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <span className="text-white/40 text-xl font-bold">:</span>
        <TimeUnit value={timeLeft.seconds} label="Seconds" isLast />
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="w-full bg-white/10 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
            initial={{ width: '100%' }}
            animate={{ 
              width: `${Math.max(0, (timeLeft.days * 24 * 60 * 60 + timeLeft.hours * 60 * 60 + timeLeft.minutes * 60 + timeLeft.seconds) / (30 * 60) * 100)}%` 
            }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;