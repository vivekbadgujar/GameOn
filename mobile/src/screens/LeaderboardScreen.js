/**
 * Leaderboard Screen
 * Display tournament and global leaderboards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Chip, Avatar, Card } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import LoadingSpinner from '../components/LoadingSpinner';

const LeaderboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [selectedGame, setSelectedGame] = useState('all');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod, selectedGame]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - replace with actual API call
      const mockData = [
        {
          _id: '1',
          username: 'ProGamer123',
          avatar: null,
          totalEarnings: 15000,
          tournamentsWon: 8,
          winRate: 75,
          rank: 1,
          isCurrentUser: false,
        },
        {
          _id: '2',
          username: 'ElitePlayer',
          avatar: null,
          totalEarnings: 12500,
          tournamentsWon: 6,
          winRate: 70,
          rank: 2,
          isCurrentUser: false,
        },
        {
          _id: '3',
          username: user?.username || 'You',
          avatar: null,
          totalEarnings: 8500,
          tournamentsWon: 4,
          winRate: 65,
          rank: 3,
          isCurrentUser: true,
        },
        {
          _id: '4',
          username: 'GameMaster',
          avatar: null,
          totalEarnings: 7200,
          tournamentsWon: 3,
          winRate: 60,
          rank: 4,
          isCurrentUser: false,
        },
        {
          _id: '5',
          username: 'SkillfulOne',
          avatar: null,
          totalEarnings: 6800,
          tournamentsWon: 3,
          winRate: 58,
          rank: 5,
          isCurrentUser: false,
        },
      ];
      
      setLeaderboardData(mockData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return 'trophy';
      case 2: return 'medal';
      case 3: return 'medal-outline';
      default: return null;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#666';
    }
  };

  const renderTopThree = () => {
    const topThree = leaderboardData.slice(0, 3);
    
    return (
      <Card style={styles.topThreeCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Top Performers</Text>
          <View style={styles.topThreeContainer}>
            {/* Second Place */}
            {topThree[1] && (
              <View style={[styles.topThreeItem, styles.secondPlace]}>
                <Avatar.Text
                  size={50}
                  label={topThree[1].username.charAt(0).toUpperCase()}
                  style={styles.avatar}
                />
                <Icon name="medal" size={24} color="#C0C0C0" style={styles.rankIcon} />
                <Text style={styles.topThreeUsername}>{topThree[1].username}</Text>
                <Text style={styles.topThreeEarnings}>₹{topThree[1].totalEarnings}</Text>
                <Text style={styles.topThreeRank}>2nd</Text>
              </View>
            )}
            
            {/* First Place */}
            {topThree[0] && (
              <View style={[styles.topThreeItem, styles.firstPlace]}>
                <Avatar.Text
                  size={60}
                  label={topThree[0].username.charAt(0).toUpperCase()}
                  style={styles.avatar}
                />
                <Icon name="crown" size={28} color="#FFD700" style={styles.crownIcon} />
                <Text style={styles.topThreeUsername}>{topThree[0].username}</Text>
                <Text style={styles.topThreeEarnings}>₹{topThree[0].totalEarnings}</Text>
                <Text style={styles.topThreeRank}>1st</Text>
              </View>
            )}
            
            {/* Third Place */}
            {topThree[2] && (
              <View style={[styles.topThreeItem, styles.thirdPlace]}>
                <Avatar.Text
                  size={50}
                  label={topThree[2].username.charAt(0).toUpperCase()}
                  style={styles.avatar}
                />
                <Icon name="medal-outline" size={24} color="#CD7F32" style={styles.rankIcon} />
                <Text style={styles.topThreeUsername}>{topThree[2].username}</Text>
                <Text style={styles.topThreeEarnings}>₹{topThree[2].totalEarnings}</Text>
                <Text style={styles.topThreeRank}>3rd</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderLeaderboardItem = ({ item, index }) => {
    if (index < 3) return null; // Top 3 are shown separately
    
    return (
      <TouchableOpacity
        style={[
          styles.leaderboardItem,
          item.isCurrentUser && styles.currentUserItem
        ]}
      >
        <View style={styles.rankContainer}>
          <Text style={[
            styles.rankNumber,
            item.isCurrentUser && styles.currentUserText
          ]}>
            {item.rank}
          </Text>
        </View>
        
        <Avatar.Text
          size={40}
          label={item.username.charAt(0).toUpperCase()}
          style={styles.avatar}
        />
        
        <View style={styles.playerInfo}>
          <Text style={[
            styles.username,
            item.isCurrentUser && styles.currentUserText
          ]}>
            {item.username}
            {item.isCurrentUser && ' (You)'}
          </Text>
          <Text style={styles.playerStats}>
            {item.tournamentsWon} wins • {item.winRate}% win rate
          </Text>
        </View>
        
        <View style={styles.earningsContainer}>
          <Text style={[
            styles.earnings,
            item.isCurrentUser && styles.currentUserText
          ]}>
            ₹{item.totalEarnings}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filterLabel}>Period:</Text>
      <View style={styles.chipContainer}>
        {['daily', 'weekly', 'monthly', 'all-time'].map(period => (
          <Chip
            key={period}
            selected={selectedPeriod === period}
            onPress={() => setSelectedPeriod(period)}
            style={[
              styles.chip,
              selectedPeriod === period && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              selectedPeriod === period && styles.selectedChipText
            ]}
          >
            {period.charAt(0).toUpperCase() + period.slice(1).replace('-', ' ')}
          </Chip>
        ))}
      </View>
      
      <Text style={styles.filterLabel}>Game:</Text>
      <View style={styles.chipContainer}>
        {['all', 'bgmi', 'freefire', 'cod'].map(game => (
          <Chip
            key={game}
            selected={selectedGame === game}
            onPress={() => setSelectedGame(game)}
            style={[
              styles.chip,
              selectedGame === game && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              selectedGame === game && styles.selectedChipText
            ]}
          >
            {game === 'all' ? 'All Games' : game.toUpperCase()}
          </Chip>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading leaderboard..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={item => item._id}
        ListHeaderComponent={() => (
          <>
            {renderFilters()}
            {renderTopThree()}
            <Text style={styles.sectionTitle}>Full Rankings</Text>
          </>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  filtersContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    backgroundColor: '#2A2A2A',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#FF6B35',
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  selectedChipText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  topThreeCard: {
    backgroundColor: '#1E1E1E',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 20,
  },
  topThreeItem: {
    alignItems: 'center',
    flex: 1,
  },
  firstPlace: {
    marginBottom: 0,
  },
  secondPlace: {
    marginBottom: 20,
  },
  thirdPlace: {
    marginBottom: 20,
  },
  avatar: {
    backgroundColor: '#FF6B35',
    marginBottom: 8,
  },
  rankIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  crownIcon: {
    position: 'absolute',
    top: -10,
    right: -5,
  },
  topThreeUsername: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  topThreeEarnings: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  topThreeRank: {
    color: '#666',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  currentUserItem: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  currentUserText: {
    color: '#FF6B35',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerStats: {
    color: '#666',
    fontSize: 12,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earnings: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LeaderboardScreen;