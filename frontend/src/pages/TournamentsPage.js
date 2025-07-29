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
    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all tournaments from backend
        const data = await getTournaments();
        console.log('TournamentsPage: Raw API response:', data);
        console.log('TournamentsPage: Data type:', typeof data);
        console.log('TournamentsPage: Is array:', Array.isArray(data));
        
        if (Array.isArray(data)) {
          console.log('TournamentsPage: Setting tournaments:', data.length, 'items');
          console.log('TournamentsPage: Tournament titles:', data.map(t => t.title));
          setTournaments(data);
        } else {
          console.error('TournamentsPage: Unexpected data format:', data);
          setTournaments([]);
        }
      } catch (err) {
        console.error('TournamentsPage: Error fetching tournaments:', err);
        setError('Failed to load tournaments: ' + err.message);
        setTournaments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!lastMessage) return;
    
    console.log('TournamentsPage: Socket message received:', lastMessage.type, lastMessage.data);
    
    if (lastMessage.type === 'tournamentAdded') {
      setTournaments(prev => {
        // Check if tournament already exists to prevent duplicates
        const exists = prev.some(t => t._id === lastMessage.data._id);
        if (!exists) {
          console.log('TournamentsPage: Adding new tournament:', lastMessage.data.title || lastMessage.data.name);
          return [lastMessage.data, ...prev];
        }
        console.log('TournamentsPage: Tournament already exists, skipping duplicate');
        return prev;
      });
    } else if (lastMessage.type === 'tournamentUpdated') {
      console.log('TournamentsPage: Updating tournament:', lastMessage.data._id);
      setTournaments(prev => 
        prev.map(t => t._id === lastMessage.data._id ? lastMessage.data : t)
      );
    } else if (lastMessage.type === 'tournamentDeleted') {
      console.log('TournamentsPage: Deleting tournament:', lastMessage.data);
      setTournaments(prev => 
        prev.filter(t => t._id !== lastMessage.data)
      );
    }
  }, [lastMessage]);

  const filtered = tournaments.filter(t => {
    // Normalize status for robust filtering
    const status = (t.status || '').toLowerCase();
    const now = new Date();
    const start = t.startDate ? new Date(t.startDate) : null;
    const end = t.endDate ? new Date(t.endDate) : null;

    console.log('Filtering tournament:', t.title, 'Status:', status, 'Active tab:', activeTab);

    // Show ALL tournaments in ALL tabs for now
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
              <div className="h-48 bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 flex items-center justify-center relative">
                {(t.poster || t.posterUrl) ? (
                  <img 
                    src={t.poster || t.posterUrl} 
                    alt={t.title || 'Tournament'} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Image failed to load:', t.poster || t.posterUrl);
                      e.target.style.display = 'none';
                      e.target.parentElement.querySelector('.fallback-icon').style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded successfully:', t.poster || t.posterUrl);
                    }}
                  />
                ) : null}
                <div className="fallback-icon flex items-center justify-center text-4xl font-bold text-accent-blue/50 absolute inset-0" style={{display: (t.poster || t.posterUrl) ? 'none' : 'flex'}}>
                  🏆 {t.game || 'TOURNAMENT'}
                </div>
              </div>
              
              <div className="p-6 flex flex-col gap-2">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl">{t.title || t.name || 'Tournament'}</h3>
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