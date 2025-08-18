import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiShare2, FiCopy, FiGift, FiUsers, FiDollarSign, FiStar,
  FiCheck, FiExternalLink, FiTrendingUp, FiAward
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ReferralSystem = ({ user }) => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      const response = await fetch('/api/friends/referral', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralData(data.referral);
      } else {
        throw new Error('Failed to load referral data');
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData?.link) return;

    try {
      await navigator.clipboard.writeText(referralData.link);
      setCopied(true);
      toast.success('Referral link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy link');
    }
  };

  const shareOnPlatform = (platform) => {
    if (!referralData?.link) return;

    const shareText = `🎮 Join me on GameOn - India's premier BGMI tournament platform! Use my referral code: ${referralData.code}`;
    const shareUrl = referralData.link;

    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing, so we'll copy the text
        navigator.clipboard.writeText(shareText + ' ' + shareUrl);
        toast.success('Text copied! Paste it in your Instagram story or post.');
        return;
      default:
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  const getReferralRewards = () => {
    const totalReferrals = referralData?.totalReferrals || 0;
    const rewards = [];

    // Define reward tiers
    const tiers = [
      { count: 1, reward: '50 coins + 100 XP', unlocked: totalReferrals >= 1 },
      { count: 5, reward: '250 coins + 500 XP + Bronze Badge', unlocked: totalReferrals >= 5 },
      { count: 10, reward: '500 coins + 1000 XP + Silver Badge', unlocked: totalReferrals >= 10 },
      { count: 25, reward: '1000 coins + 2500 XP + Gold Badge', unlocked: totalReferrals >= 25 },
      { count: 50, reward: '2000 coins + 5000 XP + Platinum Badge', unlocked: totalReferrals >= 50 },
      { count: 100, reward: '5000 coins + 10000 XP + Diamond Badge', unlocked: totalReferrals >= 100 }
    ];

    return tiers;
  };

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading referral data...</p>
      </div>
    );
  }

  if (!referralData) {
    return (
      <div className="glass-card p-8 text-center">
        <FiShare2 className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Referral System Unavailable</h3>
        <p className="text-gray-500">
          Unable to load referral data. Please try again later.
        </p>
      </div>
    );
  }

  const rewardTiers = getReferralRewards();
  const nextTier = rewardTiers.find(tier => !tier.unlocked);

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center"
        >
          <FiUsers className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{referralData.totalReferrals}</div>
          <div className="text-sm text-gray-400">Total Referrals</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 text-center"
        >
          <FiDollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">₹{referralData.referralEarnings}</div>
          <div className="text-sm text-gray-400">Total Earnings</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 text-center"
        >
          <FiTrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">
            {referralData.referredUsers.filter(ref => !ref.rewardClaimed).length}
          </div>
          <div className="text-sm text-gray-400">Pending Rewards</div>
        </motion.div>
      </div>

      {/* Referral Link Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <FiShare2 className="w-5 h-5" />
          <span>Your Referral Link</span>
        </h2>

        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Referral Code:</span>
            <span className="text-lg font-mono text-blue-400">{referralData.code}</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={referralData.link}
              readOnly
              className="flex-1 bg-transparent text-white text-sm border-none outline-none"
            />
            <button
              onClick={copyReferralLink}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center space-x-1"
            >
              {copied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => shareOnPlatform('whatsapp')}
            className="bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>📱</span>
            <span className="text-sm">WhatsApp</span>
          </button>
          
          <button
            onClick={() => shareOnPlatform('telegram')}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>✈️</span>
            <span className="text-sm">Telegram</span>
          </button>
          
          <button
            onClick={() => shareOnPlatform('instagram')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>📷</span>
            <span className="text-sm">Instagram</span>
          </button>
          
          <button
            onClick={() => shareOnPlatform('facebook')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>👥</span>
            <span className="text-sm">Facebook</span>
          </button>
          
          <button
            onClick={() => shareOnPlatform('twitter')}
            className="bg-sky-500 hover:bg-sky-600 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>🐦</span>
            <span className="text-sm">Twitter</span>
          </button>
        </div>
      </motion.div>

      {/* Reward Tiers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
          <FiGift className="w-5 h-5" />
          <span>Referral Rewards</span>
        </h2>

        {nextTier && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Next Reward</span>
              <span className="text-blue-400 font-bold">{nextTier.count} referrals</span>
            </div>
            <div className="text-sm text-gray-300 mb-3">{nextTier.reward}</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((referralData.totalReferrals / nextTier.count) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {referralData.totalReferrals} / {nextTier.count} referrals
            </div>
          </div>
        )}

        <div className="space-y-3">
          {rewardTiers.map((tier, index) => (
            <div
              key={tier.count}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                tier.unlocked
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tier.unlocked ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {tier.unlocked ? (
                    <FiCheck className="w-4 h-4 text-white" />
                  ) : (
                    <FiAward className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <div className="text-white font-medium">{tier.count} Referrals</div>
                  <div className="text-sm text-gray-400">{tier.reward}</div>
                </div>
              </div>
              {tier.unlocked && (
                <span className="text-green-400 text-sm font-medium">Unlocked!</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referred Users */}
      {referralData.referredUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <FiUsers className="w-5 h-5" />
            <span>Your Referrals ({referralData.referredUsers.length})</span>
          </h2>

          <div className="space-y-3">
            {referralData.referredUsers.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={referral.user.avatar || '/default-avatar.png'}
                    alt={referral.user.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-white font-medium">{referral.user.displayName}</div>
                    <div className="text-sm text-gray-400">
                      Joined {new Date(referral.dateReferred).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    referral.rewardClaimed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {referral.rewardClaimed ? 'Rewarded' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card p-6"
      >
        <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiShare2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-2">1. Share Your Link</h3>
            <p className="text-sm text-gray-400">
              Share your unique referral link with friends via social media or messaging apps.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-2">2. Friends Join</h3>
            <p className="text-sm text-gray-400">
              When your friends sign up using your link, they become your referrals.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiGift className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-white mb-2">3. Earn Rewards</h3>
            <p className="text-sm text-gray-400">
              Get coins, XP, and exclusive badges for each successful referral.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReferralSystem;