/**
 * Enhanced Home Screen
 * Main dashboard showing synced data from website with real-time sync demo
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

const HomeScreenEnhanced = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { balance } = useSelector(state => state.wallet);
  const { tournaments } = useSelector(state => state.tournaments);
  const { isConnected, lastSyncTime } = useSelector(state => state.sync);
  
  const { syncAllData } = useSync();
  
  const [refreshing, setRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  useEffect(() => {
    updateSyncStatus();
  }, [isConnected, lastSyncTime]);

  const updateSyncStatus = () => {
    if (isConnected) {
      const lastSync = lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never';
      setSyncStatus(`🟢 Connected • Last sync: ${lastSync}`);
    } else {
      setSyncStatus('🔴 Disconnected • Data may be outdated');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncAllData();
      Alert.alert(
        'Sync Complete! 🎉',
        'Your data has been synced with the website. Any changes made on the website are now reflected here!',
        [{ text: 'Great!', style: 'default' }]
      );
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Sync Failed', 'Unable to sync data. Please check your connection.');
    } finally {
      setRefreshing(false);
    }
  };

  const navigateToWallet = () => {
    navigation.navigate('Wallet');
  };

  const navigateToTournaments = () => {
    navigation.navigate('Tournaments');
  };

  const myTournaments = tournaments.filter(tournament => 
    tournament.participants?.some(p => p.user === user?.id || p.user?._id === user?.id)
  );

  const upcomingTournaments = tournaments.filter(tournament => 
    tournament.status === 'upcoming' && 
    !tournament.participants?.some(p => p.user === user?.id || p.user?._id === user?.id)
  );

  return (
    <LinearGradient
      colors={['#1A1A1A', '#2A2A2A']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            title="Pull to sync with website..."
            titleColor="#FFFFFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.displayName || user?.username || 'Gamer'}</Text>
          </View>
          
          <TouchableOpacity style={styles.profileButton}>
            <Icon name="account-circle" size={32} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Sync Status */}
        <View style={styles.syncStatusContainer}>
          <Text style={styles.syncStatusText}>{syncStatus}</Text>
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Icon 
              name={refreshing ? "loading" : "sync"} 
              size={16} 
              color="#FF6B35" 
              style={refreshing ? styles.spinning : null}
            />
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity style={styles.walletCard} onPress={navigateToWallet}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.walletGradient}
          >
            <View style={styles.walletHeader}>
              <Icon name="wallet" size={24} color="#FFFFFF" />
              <Text style={styles.walletTitle}>Wallet Balance</Text>
            </View>
            
            <Text style={styles.walletBalance}>₹{balance || 0}</Text>
            
            <View style={styles.walletActions}>
              <View style={styles.walletAction}>
                <Icon name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.walletActionText}>Add Money</Text>
              </View>
              
              <View style={styles.walletAction}>
                <Icon name="history" size={16} color="#FFFFFF" />
                <Text style={styles.walletActionText}>History</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sync Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>🔄 Real-time Sync Demo</Text>
          <View style={styles.demoCard}>
            <Text style={styles.demoText}>
              Try adding money to your wallet on the website - you'll see the balance update here instantly!
            </Text>
            
            <View style={styles.demoSteps}>
              <View style={styles.demoStep}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Open website on computer</Text>
              </View>
              
              <View style={styles.demoStep}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Add money to wallet</Text>
              </View>
              
              <View style={styles.demoStep}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Watch balance update here!</Text>
              </View>
            </View>
          </View>
        </View>

        {/* My Tournaments */}
        {myTournaments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎮 My Tournaments</Text>
              <TouchableOpacity onPress={navigateToTournaments}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {myTournaments.slice(0, 3).map(tournament => (
                <View key={tournament._id} style={styles.tournamentCardContainer}>
                  <TournamentCard 
                    tournament={tournament}
                    onPress={() => navigation.navigate('TournamentDetails', { tournament })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Available Tournaments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏆 Available Tournaments</Text>
            <TouchableOpacity onPress={navigateToTournaments}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {upcomingTournaments.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {upcomingTournaments.slice(0, 3).map(tournament => (
                <View key={tournament._id} style={styles.tournamentCardContainer}>
                  <TournamentCard 
                    tournament={tournament}
                    onPress={() => navigation.navigate('TournamentDetails', { tournament })}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="trophy-outline" size={48} color="#666" />
              <Text style={styles.emptyStateText}>No tournaments available</Text>
              <Text style={styles.emptyStateSubtext}>Check back later for new tournaments!</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={navigateToTournaments}
            >
              <LinearGradient
                colors={['#4CAF50', '#45a049']}
                style={styles.quickActionGradient}
              >
                <Icon name="trophy" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Join Tournament</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={navigateToWallet}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.quickActionGradient}
              >
                <Icon name="plus" size={24} color="#FFFFFF" />
                <Text style={styles.quickActionText}>Add Money</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync Info */}
        <View style={styles.syncInfo}>
          <Text style={styles.syncInfoTitle}>🌟 Unified Platform Benefits</Text>
          
          <View style={styles.syncFeatures}>
            <View style={styles.syncFeature}>
              <Icon name="sync" size={16} color="#4CAF50" />
              <Text style={styles.syncFeatureText}>Real-time sync with website</Text>
            </View>
            
            <View style={styles.syncFeature}>
              <Icon name="devices" size={16} color="#4CAF50" />
              <Text style={styles.syncFeatureText}>Multi-device consistency</Text>
            </View>
            
            <View style={styles.syncFeature}>
              <Icon name="bell" size={16} color="#4CAF50" />
              <Text style={styles.syncFeatureText}>Instant notifications</Text>
            </View>
            
            <View style={styles.syncFeature}>
              <Icon name="wifi-off" size={16} color="#4CAF50" />
              <Text style={styles.syncFeatureText}>Offline-first design</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#B0B0B0',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  profileButton: {
    padding: 8,
  },
  syncStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  syncStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  syncButton: {
    padding: 4,
  },
  spinning: {
    // Add rotation animation if needed
  },
  walletCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  walletGradient: {
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  walletBalance: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
  },
  demoSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  demoCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  demoText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  demoSteps: {
    gap: 8,
  },
  demoStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    backgroundColor: '#FF6B35',
    color: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 20,
    marginRight: 12,
  },
  stepText: {
    color: '#B0B0B0',
    fontSize: 12,
    flex: 1,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  tournamentCardContainer: {
    marginRight: 12,
    width: width * 0.7,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyStateSubtext: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  syncInfo: {
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  syncInfoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  syncFeatures: {
    gap: 8,
  },
  syncFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncFeatureText: {
    color: '#B0B0B0',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default HomeScreenEnhanced;