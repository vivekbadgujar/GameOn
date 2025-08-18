import React from 'react';
import { Trophy } from 'lucide-react';

const HeroSection3D = ({ user, isAuthenticated }) => {
  return (
    <div className="glass-card relative overflow-hidden py-16 px-8">


      {/* Main Content Container */}
      <div className="relative z-10 text-center">
        {/* Trophy Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Main Title */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome back,{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {user?.username || 'Champion'}
            </span>
            <span className="inline-block ml-2">👋</span>
          </h1>
          
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Ready to dominate the battlefield? Your next victory awaits in today's tournaments.
          </p>
        </div>

        {/* Stats Preview */}
        {isAuthenticated && (
          <div className="flex justify-center space-x-8 mb-8">
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
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="btn-primary">
            Join Tournament
          </button>
          <button className="btn-secondary">
            View Leaderboard
          </button>
        </div>

      </div>


    </div>
  );
};

export default HeroSection3D;