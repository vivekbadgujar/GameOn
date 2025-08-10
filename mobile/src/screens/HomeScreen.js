/**
 * Home Screen
 * Main dashboard showing synced data from website
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSync } from '../providers/SyncProvider';
import TournamentCard from '../components/TournamentCard';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { balance } = useSelector(state => state.wallet);
  const { tournaments } = useSelector(state => state.tournaments);
  const { isConnected, lastSyncTime } = useSelector(state => state.sync);
  
  const { syncAllData } = useSync();
  
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load tournaments
      const tournamentsResponse = await fetch(`${API_BASE_URL}/api/tournaments?status=upcoming&limit=5`);
      const tournamentsData = await tournamentsResponse.json();
      
      if (tournamentsData.success) {
        dispatch(setTournaments(tournamentsData.tournaments));
      }

      // Load wallet balance
      const walletResponse = await fetch(`${API_BASE_URL}/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const walletData = await walletResponse.json();
      
      if (walletData.success) {
        dispatch(updateWallet({ balance: walletData.balance }));
      }

      // Load platform stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/stats/platform`);
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data);
      }

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
    
    // Force sync with server
    if (isConnected) {
      forceSync('home_refresh');
    }
    
    setRefreshing(false);
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#FF6B35', '#F7931E']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <View style={styles.userInfo}>
          <Avatar.Text 
            size={50} 
            label={user?.username?.charAt(0)?.toUpperCase() || 'U'}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.username}>{user?.username || 'Player'}</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Icon name="bell" size={24} color="#FFFFFF" />
            <Badge style={styles.notificationBadge}>3</Badge>
          </TouchableOpacity>
          
          <View style={styles.syncStatus}>
            <Icon 
              name={isConnected ? 'wifi' : 'wifi-off'} 
              size={20} 
              color={isConnected ? '#4CAF50' : '#F44336'} 
            />
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.walletCard}
        onPress={() => navigation.navigate('Wallet')}
      >
        <View style={styles.walletContent}>
          <Icon name="wallet" size={24} color="#FFFFFF" />
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletAmount}>₹{balance || 0}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Live Stats</Text>
      <View style={styles.statsGrid}>
        <StatsCard
          icon="trophy"
          title="Active Tournaments"
          value={stats.activeTournaments}
          color="#FF6B35"
        />
        <StatsCard
          icon="account-group"
          title="Total Players"
          value={stats.totalPlayers}
          color="#4CAF50"
        />
        <StatsCard
          icon="currency-inr"
          title="Prize Pool"
          value={`₹${stats.totalPrizePool}`}
          color="#2196F3"
        />
        <StatsCard
          icon="circle"
          title="Online Now"
          value={stats.onlineUsers}
          color="#9C27B0"
        />
      </View>
    </View>
  );

  const renderTournaments = () => (
    <View style={styles.tournamentsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Tournaments</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Tournaments')}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {tournaments.slice(0, 3).map((tournament) => (
        <TournamentCard
          key={tournament._id}
          tournament={tournament}
          onPress={() => navigation.navigate('TournamentDetails', { 
            tournamentId: tournament._id 
          })}
          style={styles.tournamentCard}
        />
      ))}
      
      {tournaments.length === 0 && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Icon name="trophy-outline" size={48} color="#666" />
            <Text style={styles.emptyText}>No upcoming tournaments</Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Tournaments')}
              style={styles.browseButton}
            >
              Browse Tournaments
            </Button>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Tournaments')}
        >
          <Icon name="trophy" size={32} color="#FF6B35" />
          <Text style={styles.quickActionText}>Join Tournament</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Icon name="plus-circle" size={32} color="#4CAF50" />
          <Text style={styles.quickActionText}>Add Money</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('MyTournaments')}
        >
          <Icon name="history" size={32} color="#2196F3" />
          <Text style={styles.quickActionText}>My Games</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Icon name="podium" size={32} color="#9C27B0" />
          <Text style={styles.quickActionText}>Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderHeader()}
      {renderStats()}
      {renderTournaments()}
      {renderQuickActions()}
      
      {lastSyncTime && (
        <Text style={styles.syncTime}>
          Last synced: {new Date(lastSyncTime).toLocaleTimeString()}
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userDetails: {
    marginLeft: 12,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
  },
  syncStatus: {
    padding: 4,
  },
  walletCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  walletContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletInfo: {
    flex: 1,
    marginLeft: 12,
  },
  walletLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  walletAmount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tournamentsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  tournamentCard: {
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#1E1E1E',
  },
  emptyContent: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginVertical: 12,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    marginTop: 8,
  },
  quickActionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (width - 60) / 2,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  syncTime: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    padding: 20,
  },
});

export default HomeScreen;