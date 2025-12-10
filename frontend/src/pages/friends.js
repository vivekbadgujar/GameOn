import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiUserPlus, FiSearch, FiShare2, FiAward, 
  FiMessageCircle, FiZap, FiStar, FiGift, FiTarget,
  FiHexagon, FiHeart, FiMoreHorizontal, FiX,
  FiCheck, FiClock, FiEye, FiEyeOff, FiSettings
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import FriendsList from '../components/Friends/FriendsList';
import FriendRequests from '../components/Friends/FriendRequests';
import AddFriends from '../components/Friends/AddFriends';
import ReferralSystem from '../components/Friends/ReferralSystem';
import FriendsLeaderboard from '../components/Friends/FriendsLeaderboard';
import ChallengeModal from '../components/Friends/ChallengeModal';
import AchievementsFeed from '../components/Friends/AchievementsFeed';
import GroupsSection from '../components/Friends/GroupsSection';

const Friends = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({
    totalFriends: 0,
    onlineFriends: 0,
    pendingRequests: 0,
    totalReferrals: 0
  });
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const tabs = [
    { id: 'friends', label: 'Friends', icon: FiUsers, count: stats.totalFriends },
    { id: 'requests', label: 'Requests', icon: FiUserPlus, count: stats.pendingRequests },
    { id: 'add', label: 'Add Friends', icon: FiSearch },
    { id: 'referral', label: 'Invite Friends', icon: FiShare2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: FiAward },
    { id: 'achievements', label: 'Feed', icon: FiStar },
    { id: 'groups', label: 'Groups', icon: FiHexagon }
  ];

  useEffect(() => {
    loadFriendsData();
  }, []);

  const loadFriendsData = async () => {
    try {
      setLoading(true);
      
      // Load all friends data in parallel
      const [
        friendsRes,
        requestsRes,
        sentRes,
        achievementsRes,
        leaderboardRes,
        groupsRes
      ] = await Promise.allSettled([
        fetch('/api/friends/list', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/friends/requests/received', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/friends/requests/sent', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/achievements/feed', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/friends/leaderboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/groups/my-groups', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      // Process friends data
      if (friendsRes.status === 'fulfilled' && friendsRes.value.ok) {
        const data = await friendsRes.value.json();
        setFriends(data.friends || []);
      }

      // Process friend requests
      if (requestsRes.status === 'fulfilled' && requestsRes.value.ok) {
        const data = await requestsRes.value.json();
        setFriendRequests(data.requests || []);
      }

      // Process sent requests
      if (sentRes.status === 'fulfilled' && sentRes.value.ok) {
        const data = await sentRes.value.json();
        setSentRequests(data.requests || []);
      }

      // Process achievements feed
      if (achievementsRes.status === 'fulfilled' && achievementsRes.value.ok) {
        const data = await achievementsRes.value.json();
        setAchievements(data.feed || []);
      }

      // Process leaderboard
      if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value.ok) {
        const data = await leaderboardRes.value.json();
        setLeaderboard(data.leaderboard || []);
      }

      // Process groups
      if (groupsRes.status === 'fulfilled' && groupsRes.value.ok) {
        const data = await groupsRes.value.json();
        setGroups(data.groups || []);
      }

      // Update stats
      const friendsData = friendsRes.status === 'fulfilled' && friendsRes.value.ok ? 
        await friendsRes.value.json() : { friends: [] };
      const requestsData = requestsRes.status === 'fulfilled' && requestsRes.value.ok ? 
        await requestsRes.value.json() : { requests: [] };

      setStats({
        totalFriends: friendsData.friends?.length || 0,
        onlineFriends: friendsData.friends?.filter(f => f.friend.onlineStatus === 'online').length || 0,
        pendingRequests: requestsData.requests?.length || 0,
        totalReferrals: user?.referral?.totalReferrals || 0
      });

    } catch (error) {
      console.error('Error loading friends data:', error);
      toast.error('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeFriend = (friend) => {
    setSelectedFriend(friend);
    setShowChallengeModal(true);
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.success('Friend request accepted!');
        loadFriendsData();
      } else {
        throw new Error('Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.success('Friend request declined');
        loadFriendsData();
      } else {
        throw new Error('Failed to decline request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      toast.error('Failed to decline friend request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
      <div className="container-custom py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
            Friends & Social
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Connect with friends, challenge them to matches, and climb the leaderboards together
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalFriends}</div>
            <div className="text-sm text-gray-400">Total Friends</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.onlineFriends}</div>
            <div className="text-sm text-gray-400">Online Now</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.pendingRequests}</div>
            <div className="text-sm text-gray-400">Pending Requests</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalReferrals}</div>
            <div className="text-sm text-gray-400">Referrals</div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-2 mb-8 overflow-x-auto"
        >
          <div className="flex space-x-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'friends' && (
              <FriendsList 
                friends={friends}
                onChallenge={handleChallengeFriend}
                onRefresh={loadFriendsData}
              />
            )}

            {activeTab === 'requests' && (
              <FriendRequests
                receivedRequests={friendRequests}
                sentRequests={sentRequests}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                onRefresh={loadFriendsData}
              />
            )}

            {activeTab === 'add' && (
              <AddFriends onRefresh={loadFriendsData} />
            )}

            {activeTab === 'referral' && (
              <ReferralSystem user={user} />
            )}

            {activeTab === 'leaderboard' && (
              <FriendsLeaderboard 
                leaderboard={leaderboard}
                currentUser={user}
              />
            )}

            {activeTab === 'achievements' && (
              <AchievementsFeed 
                achievements={achievements}
                onRefresh={loadFriendsData}
              />
            )}

            {activeTab === 'groups' && (
              <GroupsSection 
                groups={groups}
                onRefresh={loadFriendsData}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Challenge Modal */}
        <AnimatePresence>
          {showChallengeModal && selectedFriend && (
            <ChallengeModal
              friend={selectedFriend}
              onClose={() => {
                setShowChallengeModal(false);
                setSelectedFriend(null);
              }}
              onSuccess={() => {
                setShowChallengeModal(false);
                setSelectedFriend(null);
                toast.success('Challenge sent!');
              }}
            />
          )}
        </AnimatePresence>
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

export default Friends;