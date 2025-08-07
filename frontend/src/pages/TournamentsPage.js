import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTournaments } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import TournamentCard from '../components/UI/TournamentCard';
import AuthModal from '../components/Auth/AuthModal';
import { useAuthModal } from '../hooks/useAuthModal';

const tabs = [
  { label: 'Live', value: 'live' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
];

export default function TournamentsPage() {
  const { isAuthenticated } = useAuth();
  const { 
    isAuthModalOpen, 
    authModalTab, 
    openAuthModal, 
    closeAuthModal 
  } = useAuthModal();
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
            <div className="col-span-full text-center text-white/60">No tournaments found.</div>
          ) : filtered.map((tournament, index) => (
            <motion.div
              key={tournament._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <TournamentCard 
                tournament={tournament} 
                isAuthenticated={isAuthenticated}
                onRequireAuth={openAuthModal}
              />
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        defaultTab={authModalTab}
      />
    </div>
  );
} 