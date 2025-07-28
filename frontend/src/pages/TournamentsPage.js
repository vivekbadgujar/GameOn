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
        console.log('Fetched tournaments:', data);
        setTournaments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load tournaments');
        setLoading(false);
      });
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('Received socket message:', lastMessage);
    
    if (lastMessage.type === 'tournamentAdded') {
      console.log('Adding new tournament:', lastMessage.data);
      setTournaments(prev => {
        // Check if tournament already exists to avoid duplicates
        const exists = prev.find(t => t._id === lastMessage.data._id);
        if (exists) return prev;
        return [lastMessage.data, ...prev];
      });
    } else if (lastMessage.type === 'tournamentUpdated') {
      console.log('Updating tournament:', lastMessage.data);
      setTournaments(prev => prev.map(t => t._id === lastMessage.data._id ? lastMessage.data : t));
    } else if (lastMessage.type === 'tournamentDeleted') {
      console.log('Deleting tournament:', lastMessage.data);
      setTournaments(prev => prev.filter(t => t._id !== lastMessage.data));
    }
  }, [lastMessage]);

  // Refresh tournaments periodically to ensure data consistency
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Refreshing tournaments data...');
      getTournaments()
        .then(data => {
          console.log('Refreshed tournaments:', data);
          setTournaments(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error('Error refreshing tournaments:', err);
        });
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const filtered = tournaments.filter(t => {
    console.log('Filtering tournament:', t.title, 'Status:', t.status, 'Active tab:', activeTab);
    
    if (activeTab === 'live') return t.status === 'active' || t.status === 'live';
    if (activeTab === 'upcoming') return t.status === 'upcoming';
    if (activeTab === 'past') return t.status === 'completed' || t.status === 'finished' || t.status === 'past';
    return true;
  });
  
  console.log('Total tournaments:', tournaments.length);
  console.log('Filtered tournaments for', activeTab, ':', filtered.length);

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
            <div key={t._id} className="bg-card-bg rounded-card shadow-glass overflow-hidden hover:scale-105 transition-transform">
              {/* Tournament Poster */}
              <div className="h-48 bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center">
                {t.poster || t.posterUrl ? (
                  <img 
                    src={t.poster || t.posterUrl} 
                    alt={t.title || 'Tournament'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="flex items-center justify-center text-4xl font-bold text-accent-blue/50">
                  🏆
                </div>
              </div>
              
              <div className="p-6 flex flex-col gap-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl">{t.title || t.name || 'Unnamed Tournament'}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  t.status === 'live' || t.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  t.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {t.status?.toUpperCase()}
                </span>
              </div>
              <span className="text-secondary">Game: <span className="text-accent-blue font-semibold">{t.game}</span></span>
              <span className="text-secondary">Prize: <span className="text-accent-green font-bold">₹{t.prizePool?.toLocaleString()}</span></span>
              <span className="text-secondary">Players: {t.currentParticipants || t.participants?.length || 0}/{t.maxParticipants}</span>
              {t.startDate && (
                <span className="text-secondary text-sm">
                  Start: {new Date(t.startDate).toLocaleDateString()} {new Date(t.startDate).toLocaleTimeString()}
                </span>
              )}
                <button className="mt-2 px-4 py-2 rounded-lg bg-accent-blue text-primary font-semibold hover:bg-accent-purple transition">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 