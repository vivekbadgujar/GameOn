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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient">Top Players</span>
          </h1>
          <p className="text-white/60 text-base sm:text-lg max-w-3xl mx-auto">
            Discover the best players and their achievements on our platform
          </p>
        </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {players.map((p, i) => (
          <div key={p._id || i} className="glass-card px-4 py-5 flex flex-col items-center text-center">
            <span className="text-xl sm:text-2xl font-bold text-blue-400">#{i + 1}</span>
            <span className="font-semibold text-sm sm:text-base mt-2 text-white truncate w-full text-center">{p.username || p.name || `Player ${i + 1}`}</span>
            <span className="text-white/60 text-xs mt-1">Points: {p.points || p.totalPoints || 0}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
} 