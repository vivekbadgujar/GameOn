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
    <div className="mt-8">
      <h2 className="font-display text-3xl mb-6">Top Players</h2>
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
  );
} 