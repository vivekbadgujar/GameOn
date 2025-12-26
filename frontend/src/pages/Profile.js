import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Gamepad2, 
  Trophy, 
  Wallet, 
  Calendar,
  Edit3,
  Save,
  X,
  Star,
  Target,
  Award,
  TrendingUp,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Profile = () => {
  const { user, updateUser, token, loading: authLoading } = useAuth();
  const { showError, showInfo } = useNotification();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bgmiName: '',
    bgmiId: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bgmiName: user.gameProfile?.bgmiName || '',
        bgmiId: user.gameProfile?.bgmiId || ''
      });
    }
  }, [user]);

  // Fetch user tournaments
  useEffect(() => {
    const fetchTournaments = async () => {
      if (!user || !token) return;
      
      try {
        const response = await fetch('/api/users/tournaments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 401 || response.status === 403) {
          showInfo('Please login to view your profile');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setTournaments(data.tournaments || []);
        } else {
          setTournaments([]);
        }
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        showError('Failed to load your tournaments. Please try again.');
        setTournaments([]);
      }
    };

    fetchTournaments();
  }, [user, token]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full glass-card p-6 text-center">
          <h1 className="text-xl font-semibold text-white">Login Required</h1>
          <p className="text-white/70 mt-2">Please login to view your profile.</p>
          <button
            className="btn-primary mt-4"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/login';
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          gameProfile: {
            bgmiName: formData.bgmiName,
            bgmiId: formData.bgmiId
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data.user);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || '',
      email: user.email || '',
      bgmiName: user.gameProfile?.bgmiName || '',
      bgmiId: user.gameProfile?.bgmiId || ''
    });
    setEditing(false);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setPhotoUploading(true);
      
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const apiUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'https://api.gameonesport.xyz/api';
      const response = await fetch(`${apiUrl}/users/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data.user);
        alert('Profile photo updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient">Player Profile</span>
          </h1>
          <p className="text-white/60 text-lg max-w-3xl mx-auto">
            Manage your gaming profile and statistics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar?.startsWith('http') ? user.avatar : `${process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'https://api.gameonesport.xyz'}${user.avatar}`} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-1">
                  {user.gameProfile?.bgmiName || user.username}
                </h2>
                <p className="text-white/60">
                  Level {user.stats?.level || 1} • {user.stats?.xpPoints || 0} XP
                </p>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-white">Tournaments</span>
                  </div>
                  <span className="text-white font-semibold">
                    {user.stats?.totalTournaments || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-green-400" />
                    <span className="text-white">Wins</span>
                  </div>
                  <span className="text-white font-semibold">
                    {user.stats?.tournamentsWon || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-blue-400" />
                    <span className="text-white">Wallet</span>
                  </div>
                  <span className="text-white font-semibold">
                    ₹{user.wallet?.balance || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    <span className="text-white">Win Rate</span>
                  </div>
                  <span className="text-white font-semibold">
                    {user.stats?.winRate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Profile Information</h3>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-300"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-300 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors duration-300"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="input-field pl-10 w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="input-field pl-10 w-full"
                    />
                  </div>
                </div>

                {/* Profile Photo Upload - Only show when editing */}
                {editing && (
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Profile Photo
                    </label>
                    <div className="relative">
                      <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                      <label 
                        htmlFor="photo-upload" 
                        className="input-field pl-10 w-full cursor-pointer flex items-center justify-between hover:bg-white/10 transition-colors"
                      >
                        <span className="text-white/60">
                          {photoUploading ? 'Uploading...' : 'Choose profile photo'}
                        </span>
                        {photoUploading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Upload className="w-4 h-4 text-white/60" />
                        )}
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={photoUploading}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={user.phone || 'Not provided'}
                      disabled
                      className="input-field pl-10 w-full opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    Member Since
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      value={new Date(user.createdAt).toLocaleDateString()}
                      disabled
                      className="input-field pl-10 w-full opacity-60"
                    />
                  </div>
                </div>

                {/* BGMI Information */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    BGMI In-Game Name
                  </label>
                  <div className="relative">
                    <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="bgmiName"
                      value={formData.bgmiName}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="input-field pl-10 w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    BGMI Player ID
                  </label>
                  <div className="relative">
                    <Trophy className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="bgmiId"
                      value={formData.bgmiId}
                      onChange={handleInputChange}
                      disabled={!editing}
                      className="input-field pl-10 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tournament History */}
            <div className="glass-card p-6 mt-6">
              <h3 className="text-xl font-bold text-white mb-6">Tournament History</h3>
              
              {tournaments.length > 0 ? (
                <div className="space-y-4">
                  {tournaments.map((tournament, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <h4 className="text-white font-semibold">{tournament.title}</h4>
                        <p className="text-white/60 text-sm">
                          {new Date(tournament.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tournament.status === 'won' 
                            ? 'bg-green-500/20 text-green-400'
                            : tournament.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tournament.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No tournaments participated yet</p>
                  <p className="text-white/40 text-sm">Join your first tournament to see history here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Prevent static generation - force server-side rendering
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}

export default Profile;