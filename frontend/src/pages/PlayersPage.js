import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../services/api';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getLeaderboard('overall', 'all', 50)
      .then(data => {
        setPlayers(data?.players || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load leaderboard');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center text-secondary py-12">Loading leaderboard...</div>;
  if (error) return <div className="text-center text-accent-red py-12">{error}</div>;

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient">Top Players</span>
          </h1>
          <p className="text-white/60 text-lg max-w-3xl mx-auto">
            Discover the best players and their achievements on our platform
          </p>
        </div>
      <div className="flex flex-wrap gap-6 justify-center">
        {players.map((p, i) => (
          <div key={p._id || i} className="bg-glass rounded-xl shadow-neon px-8 py-6 flex flex-col items-center min-w-[180px]">
            <span className="text-2xl font-bold text-accent-blue">#{i+1}</span>
            <span className="font-semibold text-lg mt-2">{p.username || p.name || `Player ${i+1}`}</span>
            <span className="text-secondary text-sm">Points: {p.points || p.totalPoints || 0}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
} 