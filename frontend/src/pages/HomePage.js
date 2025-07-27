import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { getTournaments, getYouTubeVideos, getLeaderboard } from '../services/api';

export default function HomePage() {
  const [tournaments, setTournaments] = useState([]);
  const [videos, setVideos] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const controls = useAnimation();
  const sliderRef = useRef();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTournaments(),
      getYouTubeVideos(),
      getLeaderboard('overall', 'month', 10)
    ])
      .then(([tData, vData, pData]) => {
        setTournaments(tData.slice(0, 3));
        setVideos(vData?.videos?.slice(0, 3) || []);
        setPlayers(pData?.players || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load data');
        setLoading(false);
      });
  }, []);

  // Auto-scroll leaderboard slider
  useEffect(() => {
    if (!players.length) return;
    let i = 0;
    const interval = setInterval(() => {
      controls.start({ x: -i * 220 });
      i = (i + 1) % players.length;
    }, 2500);
    return () => clearInterval(interval);
  }, [players, controls]);

  if (loading) return <div className="text-center text-secondary py-12">Loading...</div>;
  if (error) return <div className="text-center text-accent-red py-12">{error}</div>;

  return (
    <div className="flex flex-col gap-12">
      {/* Hero Section */}
      <motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, type: 'spring' }} className="bg-glass rounded-glass shadow-glass p-8 mt-8 flex flex-col items-center text-center">
        <h1 className="font-display text-5xl md:text-6xl font-bold text-primary mb-4">Compete. Win. Repeat.</h1>
        <p className="text-xl text-secondary mb-6 max-w-2xl">The most premium esports tournaments platform. Real-time, pro-level, and built for gamers who want to win big.</p>
        <button className="px-8 py-3 rounded-xl bg-gradient-to-tr from-accent-blue to-accent-purple text-lg font-bold text-primary shadow-neon hover:scale-105 transition-transform">Join Now</button>
      </motion.section>
      {/* Featured Tournaments Slider */}
      <section>
        <h2 className="font-display text-3xl mb-4">Featured Tournaments</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tournaments.map(t => (
            <div key={t._id} className="bg-card-bg rounded-card shadow-glass p-6 flex flex-col gap-2 hover:scale-105 transition-transform">
              <div className="h-40 bg-gradient-to-tr from-accent-blue to-accent-purple rounded-xl mb-3" />
              <h3 className="font-bold text-xl">{t.name}</h3>
              <p className="text-secondary">Prize: <span className="text-accent-green font-bold">₹{t.prizePool}</span></p>
              <button className="mt-2 px-4 py-2 rounded-lg bg-accent-blue text-primary font-semibold hover:bg-accent-purple transition">View</button>
            </div>
          ))}
        </div>
      </section>
      {/* Video Highlights */}
      <section>
        <h2 className="font-display text-3xl mb-4">Video Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {videos.map((v, i) => (
            <div key={v.id || i} className="bg-glass rounded-xl shadow-glass p-4 flex flex-col items-center">
              <div className="w-full aspect-video bg-secondary-bg rounded-lg mb-2 flex items-center justify-center">
                {v.thumbnail ? <img src={v.thumbnail} alt={v.title} className="rounded-lg w-full h-full object-cover" /> : null}
              </div>
              <span className="text-lg font-semibold line-clamp-2">{v.title || `Highlight ${i+1}`}</span>
            </div>
          ))}
        </div>
      </section>
      {/* Leaderboard Slider */}
      <section>
        <h2 className="font-display text-3xl mb-4">Top Players</h2>
        <div className="overflow-x-hidden relative">
          <motion.div
            className="flex gap-6"
            ref={sliderRef}
            drag="x"
            dragConstraints={{ left: -((players.length-1)*220), right: 0 }}
            animate={controls}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{ cursor: 'grab' }}
          >
            {players.map((p, i) => (
              <div key={p._id || i} className="bg-glass rounded-xl shadow-neon px-6 py-4 flex flex-col items-center min-w-[200px]">
                <span className="text-2xl font-bold text-accent-blue">#{i+1}</span>
                <span className="font-semibold text-lg mt-2">{p.username || p.name || `Player ${i+1}`}</span>
                <span className="text-secondary text-sm">Points: {p.points || p.totalPoints || 0}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
} 