import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUsers, FiPlus, FiHexagon, FiStar, FiAward, FiSettings,
  FiSearch, FiFilter, FiEye, FiLock, FiGlobe, FiMoreHorizontal
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const GroupsSection = ({ groups, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('my-groups');
  const [myGroups, setMyGroups] = useState(groups || []);
  const [publicGroups, setPublicGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setMyGroups(groups || []);
  }, [groups]);

  useEffect(() => {
    if (activeTab === 'public') {
      loadPublicGroups();
    }
  }, [activeTab]);

  const loadPublicGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/groups/public', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPublicGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Error loading public groups:', error);
      toast.error('Failed to load public groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        onRefresh();
        loadPublicGroups();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error(error.message || 'Failed to join group');
    }
  };

  const getGroupTypeIcon = (type) => {
    switch (type) {
      case 'squad':
        return <FiUsers className="w-4 h-4" />;
      case 'clan':
        return <FiHexagon className="w-4 h-4" />;
      case 'team':
        return <FiAward className="w-4 h-4" />;
      default:
        return <FiUsers className="w-4 h-4" />;
    }
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public':
        return <FiGlobe className="w-4 h-4 text-green-400" />;
      case 'private':
        return <FiLock className="w-4 h-4 text-red-400" />;
      default:
        return <FiEye className="w-4 h-4 text-yellow-400" />;
    }
  };

  const MyGroups = () => {
    if (myGroups.length === 0) {
      return (
        <div className="glass-card p-8 text-center">
          <FiUsers className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Groups Yet</h3>
          <p className="text-gray-500 mb-4">
            Create or join a group to start playing with your squad!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create Your First Group
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">My Groups ({myGroups.length})</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGroups.map((group, index) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-4 hover:bg-white/10 transition-all duration-300"
            >
              {/* Group Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {group.avatar ? (
                    <img
                      src={group.avatar}
                      alt={group.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      {getGroupTypeIcon(group.type)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-white">{group.name}</h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-blue-400 font-mono">[{group.tag}]</span>
                      {getPrivacyIcon(group.privacy)}
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <button className="p-1 text-gray-400 hover:text-white">
                    <FiMoreHorizontal className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg py-2 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2">
                      <FiEye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    {(group.userRole === 'owner' || group.userRole === 'admin') && (
                      <button className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 flex items-center space-x-2">
                        <FiSettings className="w-4 h-4" />
                        <span>Manage</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Description */}
              {group.description && (
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                  {group.description}
                </p>
              )}

              {/* Group Stats */}
              <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                <div className="text-center">
                  <div className="text-blue-400 font-semibold">{group.memberCount}</div>
                  <div className="text-gray-500">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 font-semibold">{group.stats.groupLevel}</div>
                  <div className="text-gray-500">Level</div>
                </div>
              </div>

              {/* User Role */}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  group.userRole === 'owner' 
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : group.userRole === 'admin'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {group.userRole?.toUpperCase()}
                </span>
                
                <div className="text-xs text-gray-500">
                  {group.rank}
                </div>
              </div>

              {/* Join Date */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-gray-500">
                  Joined {new Date(group.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const PublicGroups = () => {
    const filteredGroups = publicGroups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4">
        {/* Search */}
        <div className="glass-card p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search public groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
            />
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading public groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FiSearch className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Groups Found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'No public groups available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-4 hover:bg-white/10 transition-all duration-300"
              >
                {/* Group Header */}
                <div className="flex items-center space-x-3 mb-3">
                  {group.avatar ? (
                    <img
                      src={group.avatar}
                      alt={group.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      {getGroupTypeIcon(group.type)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{group.name}</h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-blue-400 font-mono">[{group.tag}]</span>
                      {getPrivacyIcon(group.privacy)}
                      <span className="text-gray-400 capitalize">{group.type}</span>
                    </div>
                  </div>
                </div>

                {/* Owner */}
                <div className="flex items-center space-x-2 mb-3">
                  <img
                    src={group.owner.avatar || '/default-avatar.png'}
                    alt={group.owner.displayName}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-400">
                    Owner: {group.owner.displayName}
                  </span>
                </div>

                {/* Description */}
                {group.description && (
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                  <div className="text-center">
                    <div className="text-blue-400 font-semibold">
                      {group.memberCount}/{group.maxMembers}
                    </div>
                    <div className="text-gray-500">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">{group.stats.groupLevel}</div>
                    <div className="text-gray-500">Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-semibold">{group.stats.tournamentsWon}</div>
                    <div className="text-gray-500">Wins</div>
                  </div>
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoinGroup(group.id)}
                  disabled={group.memberCount >= group.maxMembers}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
                >
                  {group.memberCount >= group.maxMembers ? 'Full' : 'Join Group'}
                </button>

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-gray-500">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="glass-card p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'my-groups'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiUsers className="w-4 h-4" />
            <span>My Groups</span>
            {myGroups.length > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {myGroups.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'public'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FiGlobe className="w-4 h-4" />
            <span>Public Groups</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'my-groups' ? <MyGroups /> : <PublicGroups />}
    </div>
  );
};

export default GroupsSection;