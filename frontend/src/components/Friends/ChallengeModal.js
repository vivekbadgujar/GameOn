import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiZap, FiUsers, FiClock, FiTarget, FiSettings,
  FiCalendar, FiDollarSign, FiEye, FiEyeOff
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ChallengeModal = ({ friend, onClose, onSuccess }) => {
  const [challengeData, setChallengeData] = useState({
    type: '1v1',
    game: 'BGMI',
    config: {
      mode: 'Classic',
      map: '',
      duration: 15,
      entryFee: 0,
      prizePool: 0
    },
    scheduledAt: '',
    settings: {
      isPrivate: false,
      allowSpectators: true,
      autoStart: false,
      recordMatch: false
    }
  });
  const [loading, setLoading] = useState(false);

  const challengeTypes = [
    { id: '1v1', label: '1v1 Duel', description: 'One-on-one battle', maxPlayers: 2, duration: 15 },
    { id: 'duo', label: 'Duo Match', description: 'Team up with a friend', maxPlayers: 4, duration: 20 },
    { id: 'squad', label: 'Squad Battle', description: '4v4 team battle', maxPlayers: 8, duration: 25 },
    { id: 'mini-tournament', label: 'Mini Tournament', description: 'Small tournament format', maxPlayers: 10, duration: 30 }
  ];

  const gameModes = [
    'Classic',
    'Arcade',
    'Arena',
    'TDM',
    'Sniper Training'
  ];

  const maps = [
    'Erangel',
    'Miramar',
    'Sanhok',
    'Vikendi',
    'Livik',
    'Karakin'
  ];

  const handleTypeChange = (type) => {
    const typeConfig = challengeTypes.find(t => t.id === type);
    setChallengeData(prev => ({
      ...prev,
      type,
      config: {
        ...prev.config,
        duration: typeConfig.duration,
        maxPlayers: typeConfig.maxPlayers
      }
    }));
  };

  const handleConfigChange = (field, value) => {
    setChallengeData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: value
      }
    }));
  };

  const handleSettingChange = (field, value) => {
    setChallengeData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/challenges/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          challengedId: friend.id,
          ...challengeData,
          scheduledAt: challengeData.scheduledAt || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Challenge sent successfully!');
        onSuccess(result.challenge);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send challenge');
      }
    } catch (error) {
      console.error('Error sending challenge:', error);
      toast.error(error.message || 'Failed to send challenge');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = challengeTypes.find(t => t.id === challengeData.type);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <FiZap className="w-6 h-6 text-red-400" />
              <div>
                <h2 className="text-xl font-semibold text-white">Challenge Friend</h2>
                <p className="text-sm text-gray-400">
                  Challenge {friend.displayName} to a match
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Challenge Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Challenge Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {challengeTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      challengeData.type === type.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    <div className="font-semibold text-white">{type.label}</div>
                    <div className="text-sm text-gray-400 mt-1">{type.description}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      {type.maxPlayers} players • {type.duration} min
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Game Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Game Mode
                </label>
                <select
                  value={challengeData.config.mode}
                  onChange={(e) => handleConfigChange('mode', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  {gameModes.map((mode) => (
                    <option key={mode} value={mode} className="bg-gray-800">
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Map (Optional)
                </label>
                <select
                  value={challengeData.config.map}
                  onChange={(e) => handleConfigChange('map', e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="" className="bg-gray-800">Any Map</option>
                  {maps.map((map) => (
                    <option key={map} value={map} className="bg-gray-800">
                      {map}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Duration and Entry Fee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={challengeData.config.duration}
                  onChange={(e) => handleConfigChange('duration', parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Entry Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={challengeData.config.entryFee}
                  onChange={(e) => handleConfigChange('entryFee', parseInt(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prize pool will be 2x entry fee (minus platform fee)
                </p>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                value={challengeData.scheduledAt}
                onChange={(e) => setChallengeData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to start immediately when accepted
              </p>
            </div>

            {/* Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Challenge Settings
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={challengeData.settings.isPrivate}
                    onChange={(e) => handleSettingChange('isPrivate', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <FiEyeOff className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Private Challenge</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={challengeData.settings.allowSpectators}
                    onChange={(e) => handleSettingChange('allowSpectators', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <FiEye className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Allow Spectators</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={challengeData.settings.autoStart}
                    onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <FiZap className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Auto Start</span>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={challengeData.settings.recordMatch}
                    onChange={(e) => handleSettingChange('recordMatch', e.target.checked)}
                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <FiTarget className="w-4 h-4 text-gray-400" />
                    <span className="text-white">Record Match</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Challenge Summary */}
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-3">Challenge Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white ml-2">{selectedType?.label}</span>
                </div>
                <div>
                  <span className="text-gray-400">Mode:</span>
                  <span className="text-white ml-2">{challengeData.config.mode}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white ml-2">{challengeData.config.duration} min</span>
                </div>
                <div>
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-white ml-2">
                    {challengeData.config.entryFee > 0 ? `₹${challengeData.config.entryFee}` : 'Free'}
                  </span>
                </div>
                {challengeData.config.map && (
                  <div>
                    <span className="text-gray-400">Map:</span>
                    <span className="text-white ml-2">{challengeData.config.map}</span>
                  </div>
                )}
                {challengeData.scheduledAt && (
                  <div>
                    <span className="text-gray-400">Scheduled:</span>
                    <span className="text-white ml-2">
                      {new Date(challengeData.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <FiZap className="w-4 h-4" />
                    <span>Send Challenge</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChallengeModal;