import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Edit3, 
  Save, 
  X, 
  Trophy, 
  Target, 
  TrendingUp,
  Calendar,
  Award,
  Star,
  Crown,
  Gamepad2,
  Camera,
  Shield,
  Settings
} from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    bio: '',
    favoriteGame: '',
    location: ''
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const games = [
    { id: 'bgmi', name: 'BGMI', icon: '🔫' },
    { id: 'valorant', name: 'VALORANT', icon: '⚡' },
    { id: 'chess', name: 'Chess', icon: '♟️' },
    { id: 'freefire', name: 'Free Fire', icon: '🔥' },
    { id: 'codm', name: 'COD Mobile', icon: '💥' }
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await getUserProfile();
      const profileData = response.data || user;
      setProfile(profileData);
      setEditForm({
        username: profileData.username || '',
        email: profileData.email || '',
        bio: profileData.bio || '',
        favoriteGame: profileData.favoriteGame || '',
        location: profileData.location || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use user data from context as fallback
      setProfile(user);
      setEditForm({
        username: user?.username || '',
        email: user?.email || '',
        bio: user?.bio || '',
        favoriteGame: user?.favoriteGame || '',
        location: user?.location || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editing) {
      // Cancel editing - reset form
      setEditForm({
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || '',
        favoriteGame: profile.favoriteGame || '',
        location: profile.location || ''
      });
    }
    setEditing(!editing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const response = await updateUserProfile(editForm);
      const updatedProfile = response.data;
      setProfile(updatedProfile);
      updateUser(updatedProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const getGameIcon = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game?.icon || '🎮';
  };

  const getGameName = (gameId) => {
    const game = games.find(g => g.id === gameId);
    return game?.name || 'Unknown Game';
  };

  const mockStats = {
    tournamentsPlayed: 24,
    tournamentsWon: 8,
    winRate: 33.3,
    totalEarnings: 15420,
    currentRank: 156,
    bestRank: 42,
    averagePosition: 3.2,
    favoriteGame: profile?.favoriteGame || 'bgmi'
  };

  const mockAchievements = [
    {
      id: 1,
      title: 'First Victory',
      description: 'Won your first tournament',
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      earned: true,
      date: '2024-01-15'
    },
    {
      id: 2,
      title: 'Winning Streak',
      description: 'Won 3 tournaments in a row',
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      earned: true,
      date: '2024-01-20'
    },
    {
      id: 3,
      title: 'Top Player',
      description: 'Reached top 50 in rankings',
      icon: Star,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      earned: true,
      date: '2024-01-25'
    },
    {
      id: 4,
      title: 'Big Winner',
      description: 'Earn ₹10,000 in a single tournament',
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      earned: false,
      date: null
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 mb-8 relative overflow-hidden"
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-32 translate-x-32" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
              <div className="flex items-center space-x-6 mb-6 md:mb-0">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center">
                    {profile?.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile.username}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-3xl">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* User Info */}
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {profile?.username || 'Unknown User'}
                  </h1>
                  <p className="text-white/60 mb-2">
                    {profile?.email || 'No email provided'}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-white/60">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    {profile?.location && (
                      <div className="flex items-center space-x-1">
                        <span>📍</span>
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex space-x-3">
                {editing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="btn-ghost flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEditToggle}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-6">
              {editing ? (
                <textarea
                  name="bio"
                  value={editForm.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows="3"
                  className="input-field w-full resize-none"
                />
              ) : (
                <p className="text-white/80 leading-relaxed">
                  {profile?.bio || 'No bio available. Click edit to add one!'}
                </p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {mockStats.tournamentsPlayed}
                </div>
                <div className="text-white/60 text-sm">Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {mockStats.tournamentsWon}
                </div>
                <div className="text-white/60 text-sm">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {mockStats.winRate}%
                </div>
                <div className="text-white/60 text-sm">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  #{mockStats.currentRank}
                </div>
                <div className="text-white/60 text-sm">Rank</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'glass-card text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Personal Information */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3">Username</label>
                    {editing ? (
                      <input
                        type="text"
                        name="username"
                        value={editForm.username}
                        onChange={handleInputChange}
                        className="input-field w-full"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                        <User className="w-5 h-5 text-blue-400" />
                        <span className="text-white">{profile?.username || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Email</label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleInputChange}
                        className="input-field w-full"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                        <Mail className="w-5 h-5 text-green-400" />
                        <span className="text-white">{profile?.email || 'Not set'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Phone</label>
                    <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                      <Phone className="w-5 h-5 text-purple-400" />
                      <span className="text-white">{profile?.phone || 'Not set'}</span>
                      <div className="ml-auto">
                        <Shield className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Location</label>
                    {editing ? (
                      <input
                        type="text"
                        name="location"
                        value={editForm.location}
                        onChange={handleInputChange}
                        placeholder="Your city, country"
                        className="input-field w-full"
                      />
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                        <span className="text-lg">📍</span>
                        <span className="text-white">{profile?.location || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Gaming Preferences */}
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">Gaming Preferences</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-3">Favorite Game</label>
                    {editing ? (
                      <select
                        name="favoriteGame"
                        value={editForm.favoriteGame}
                        onChange={handleInputChange}
                        className="input-field w-full"
                      >
                        <option value="">Select a game</option>
                        {games.map((game) => (
                          <option key={game.id} value={game.id}>
                            {game.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl">
                        <span className="text-2xl">{getGameIcon(profile?.favoriteGame)}</span>
                        <span className="text-white">
                          {profile?.favoriteGame ? getGameName(profile.favoriteGame) : 'Not set'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-3">Gaming Stats</label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-white/80">Total Earnings</span>
                        <span className="text-green-400 font-bold">
                          ₹{mockStats.totalEarnings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-white/80">Best Rank</span>
                        <span className="text-yellow-400 font-bold">#{mockStats.bestRank}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-white/80">Average Position</span>
                        <span className="text-blue-400 font-bold">{mockStats.averagePosition}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Detailed Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white/5 rounded-xl">
                  <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {mockStats.tournamentsWon}
                  </div>
                  <div className="text-white/60">Tournaments Won</div>
                </div>

                <div className="text-center p-6 bg-white/5 rounded-xl">
                  <Gamepad2 className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {mockStats.tournamentsPlayed}
                  </div>
                  <div className="text-white/60">Tournaments Played</div>
                </div>

                <div className="text-center p-6 bg-white/5 rounded-xl">
                  <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    {mockStats.winRate}%
                  </div>
                  <div className="text-white/60">Win Rate</div>
                </div>

                <div className="text-center p-6 bg-white/5 rounded-xl">
                  <Target className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    ₹{mockStats.totalEarnings.toLocaleString()}
                  </div>
                  <div className="text-white/60">Total Earnings</div>
                </div>

                <div className="text-center p-6 bg-white/5 rounded-xl">
                  <Star className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    #{mockStats.currentRank}
                  </div>
                  <div className="text-white/60">Current Rank</div>
                </div>

                <div className="text-center p-6 bg-white/5 rounded-xl">
                  <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">
                    #{mockStats.bestRank}
                  </div>
                  <div className="text-white/60">Best Rank</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Achievements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-6 rounded-xl border transition-all duration-300 ${
                        achievement.earned
                          ? 'bg-white/5 border-white/20'
                          : 'bg-white/5 border-white/10 opacity-50'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 ${achievement.bgColor} rounded-xl flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${achievement.color}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-white mb-2">
                            {achievement.title}
                          </h4>
                          <p className="text-white/60 text-sm mb-3">
                            {achievement.description}
                          </p>
                          {achievement.earned ? (
                            <div className="text-green-400 text-xs font-semibold">
                              Earned on {new Date(achievement.date).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-white/40 text-xs">
                              Not earned yet
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Account Settings</h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="text-lg font-semibold text-white mb-2">Privacy Settings</h4>
                  <p className="text-white/60 text-sm mb-4">
                    Control who can see your profile and gaming statistics
                  </p>
                  <button className="btn-secondary">
                    Manage Privacy
                  </button>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="text-lg font-semibold text-white mb-2">Notification Preferences</h4>
                  <p className="text-white/60 text-sm mb-4">
                    Choose what notifications you want to receive
                  </p>
                  <button className="btn-secondary">
                    Manage Notifications
                  </button>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <h4 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h4>
                  <p className="text-white/60 text-sm mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <button className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-300">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;