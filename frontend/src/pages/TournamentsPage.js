import React, { useState, useEffect } from 'react';
import { getTournaments } from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const tabs = [
  { label: 'Live', value: 'live' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
];

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState('live');
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { lastMessage } = useSocket();

  // Fetch tournaments
  useEffect(() => {
    setLoading(true);
    getTournaments()
      .then(data => {
        setTournaments(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load tournaments');
        setLoading(false);
      });
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'tournamentAdded') {
      setTournaments(prev => [lastMessage.data, ...prev]);
    } else if (lastMessage.type === 'tournamentUpdated') {
      setTournaments(prev => prev.map(t => t._id === lastMessage.data._id ? lastMessage.data : t));
    } else if (lastMessage.type === 'tournamentDeleted') {
      setTournaments(prev => prev.filter(t => t._id !== lastMessage.data));
    }
  }, [lastMessage]);

  const filtered = tournaments.filter(t => {
    if (activeTab === 'live') return t.status === 'live';
    if (activeTab === 'upcoming') return t.status === 'upcoming';
    if (activeTab === 'past') return t.status === 'past';
    return true;
  });

  return (
    <div className="flex flex-col gap-8 mt-8">
      <div className="flex gap-4 mb-6">
        {tabs.map(tab => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`px-6 py-2 rounded-xl font-semibold transition-all ${activeTab === tab.value ? 'bg-accent-blue text-primary shadow-neon' : 'bg-glass text-secondary hover:text-primary'}`}>{tab.label}</button>
        ))}
      </div>
      {loading ? (
        <div className="text-center text-secondary py-12">Loading tournaments...</div>
      ) : error ? (
        <div className="text-center text-accent-red py-12">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center text-secondary">No tournaments found.</div>
          ) : filtered.map(t => (
            <div key={t._id} className="bg-card-bg rounded-card shadow-glass p-6 flex flex-col gap-2 hover:scale-105 transition-transform">
              <h3 className="font-bold text-xl mb-1">{t.name}</h3>
              <span className="text-secondary">Prize: <span className="text-accent-green font-bold">₹{t.prizePool}</span></span>
              <span className="text-secondary">Players: {t.participants?.length || 0}</span>
              <button className="mt-2 px-4 py-2 rounded-lg bg-accent-blue text-primary font-semibold hover:bg-accent-purple transition">View Details</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 