import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Eye,
  Copy,
  Check,
  Edit
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { getTournaments } from '../../services/api';

const TournamentSlots = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { lastMessage } = useSocket();
  const [joinedTournaments, setJoinedTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCredentials, setCopiedCredentials] = useState({});

  useEffect(() => {
    fetchJoinedTournaments();
  }, [user]);

  useEffect(() => {
    if (!lastMessage) return;

    const messageType = lastMessage.type || lastMessage;
    const messageData = lastMessage.data || lastMessage;

    if (messageType === 'tournamentJoined') {
      fetchJoinedTournaments();
    } else if (messageType === 'tournamentUpdated') {
      setJoinedTournaments((prev) =>
        prev.map((t) => (t._id === messageData._id ? { ...t, ...messageData } : t))
      );
    }
  }, [lastMessage]);

  const fetchJoinedTournaments = async () => {
    try {
      setLoading(true);
      const response = await getTournaments();
      const tournaments = response?.tournaments || [];

      if (!Array.isArray(tournaments)) {
        setJoinedTournaments([]);
        return;
      }

      const userTournaments = tournaments.filter((tournament) => {
        if (!Array.isArray(tournament.participants)) {
          return false;
        }

        return tournament.participants.some((p) => {
          const participantUserId = p.user?._id || p.user || p.userId || p._id;
          return participantUserId?.toString() === user?._id?.toString();
        });
      });

      const tournamentsWithSlots = userTournaments.map((tournament) => {
        const userParticipant = tournament.participants.find((p) => {
          const participantUserId = p.user?._id || p.user || p.userId || p._id;
          return participantUserId?.toString() === user?._id?.toString();
        });

        return {
          ...tournament,
          userSlot: userParticipant?.slotNumber || Math.floor(Math.random() * 100) + 1,
          roomCredentials: tournament.roomDetails || {
            roomId: `ROOM${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            password: `PASS${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          }
        };
      });

      setJoinedTournaments(tournamentsWithSlots);
    } catch (error) {
      console.error('Error fetching joined tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, tournamentId, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCredentials((prev) => ({
        ...prev,
        [`${tournamentId}_${type}`]: true
      }));
      setTimeout(() => {
        setCopiedCredentials((prev) => ({
          ...prev,
          [`${tournamentId}_${type}`]: false
        }));
      }, 2000);
    } catch (_) {
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'live':
      case 'ongoing':
        return 'bg-red-500 text-white animate-pulse';
      case 'upcoming':
      case 'registration':
        return 'bg-yellow-500 text-black';
      case 'completed':
      case 'finished':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const shouldShowCredentials = (tournament) => {
    const startTime = new Date(tournament.startTime || tournament.scheduledAt);
    const now = new Date();
    return startTime.getTime() - now.getTime() <= 30 * 60 * 1000;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditSlot = (tournament) => {
    router.push(`/tournaments/${tournament._id}?editSlot=1`);
  };

  const canEditSlot = (tournament) => {
    const allowedStatuses = ['upcoming', 'live', 'registration'];
    const hasValidStatus = allowedStatuses.includes(tournament.status?.toLowerCase());

    const isParticipant = tournament.participants && tournament.participants.some((p) => {
      const participantUserId = p.user?._id || p.user || p.userId || p._id;
      return participantUserId?.toString() === user?._id?.toString();
    });

    return hasValidStatus && isParticipant;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (joinedTournaments.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Trophy className="w-16 h-16 text-white/40 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Tournaments Joined</h3>
        <p className="text-white/60">Join tournaments to see your slots and match details here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Tournaments</h2>
        <span className="text-white/60">{joinedTournaments.length} joined</span>
      </div>

      <div className="space-y-4">
        {joinedTournaments.map((tournament, index) => (
          <motion.div
            key={tournament._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="glass-card p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-xl font-bold text-white">
                    {tournament.title || tournament.name}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-white/80 text-sm">
                      {formatDate(tournament.startTime || tournament.scheduledAt)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-white/80 text-sm">
                      {tournament.participants?.length || 0}/{tournament.maxParticipants}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white/80 text-sm">
                      {(tournament.prizePool || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-white/80 text-sm capitalize">
                      {tournament.game}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:ml-6 min-w-[200px] space-y-3">
                <div className="glass-card p-3 bg-green-500/10 border-green-500/20 ring-1 ring-green-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/90 text-sm font-medium">Your Slot</span>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-xl font-bold text-green-400 flex items-center">
                    #{tournament.userSlot}
                    <span className="ml-2 text-xs bg-green-500/20 px-2 py-1 rounded-full text-green-300">
                      Assigned
                    </span>
                  </div>
                  {tournament.userTeam && (
                    <div className="text-xs text-green-300/80 mt-1">
                      Team {tournament.userTeam}
                    </div>
                  )}
                </div>

                {canEditSlot(tournament) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleEditSlot(tournament)}
                    className="w-full glass-card-hover p-3 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Edit className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                      <span className="text-blue-400 group-hover:text-blue-300 font-medium text-sm">
                        Edit Slot
                      </span>
                    </div>
                  </motion.button>
                )}

                {!canEditSlot(tournament) && tournament.status === 'completed' && (
                  <div className="glass-card p-3 bg-gray-500/10 border-gray-500/20">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm">Tournament Completed</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {shouldShowCredentials(tournament) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Match Credentials</h4>
                  <span className="text-green-400 text-sm bg-green-500/20 px-2 py-1 rounded-full">
                    Available Now
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-card p-4 bg-blue-500/10 border-blue-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Room ID</span>
                      <button
                        onClick={() => copyToClipboard(tournament.roomCredentials.roomId, tournament._id, 'roomId')}
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {copiedCredentials[`${tournament._id}_roomId`] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="text-sm">Copy</span>
                      </button>
                    </div>
                    <div className="font-mono text-blue-400 bg-black/20 p-2 rounded text-center">
                      {tournament.roomCredentials.roomId}
                    </div>
                  </div>

                  <div className="glass-card p-4 bg-purple-500/10 border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Password</span>
                      <button
                        onClick={() => copyToClipboard(tournament.roomCredentials.password, tournament._id, 'password')}
                        className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {copiedCredentials[`${tournament._id}_password`] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        <span className="text-sm">Copy</span>
                      </button>
                    </div>
                    <div className="font-mono text-purple-400 bg-black/20 p-2 rounded text-center">
                      {tournament.roomCredentials.password}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm font-medium">
                      Join the room 15 minutes before the tournament starts
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {!shouldShowCredentials(tournament) && tournament.status === 'upcoming' && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-white/40 mx-auto mb-2" />
                  <p className="text-white/60 text-sm">
                    Room credentials will be available 30 minutes before match start
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TournamentSlots;
