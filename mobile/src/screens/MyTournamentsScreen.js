/**
 * My Tournaments Screen
 * Shows user's joined tournaments and match history
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { fetchMyTournaments } from '../store/slices/tournamentsSlice';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';

const MyTournamentsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { myTournaments, isLoading, error } = useSelector(state => state.tournaments);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    loadMyTournaments();
  }, []);

  const loadMyTournaments = async () => {
    try {
      await dispatch(fetchMyTournaments()).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to load your tournaments');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyTournaments();
    setRefreshing(false);
  };

  const filteredTournaments = myTournaments.filter(tournament => {
    if (selectedStatus === 'all') return true;
    return tournament.status === selectedStatus;
  });

  const getStatusCounts = () => {
    const counts = {
      all: myTournaments.length,
      upcoming: 0,
      live: 0,
      completed: 0,
    };

    myTournaments.forEach(tournament => {
      counts[tournament.status] = (counts[tournament.status] || 0) + 1;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const renderTournament = ({ item }) => (
    <TournamentCard
      tournament={item}
      onPress={() => navigation.navigate('TournamentDetails', { 
        tournamentId: item._id 
      })}
      style={styles.tournamentCard}
      showStatus={true}
      showResult={item.status === 'completed'}
    />
  );

  const renderStatusFilters = () => (
    <View style={styles.filtersContainer}>
      {[
        { key: 'all', label: 'All' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'live', label: 'Live' },
        { key: 'completed', label: 'Completed' },
      ].map(({ key, label }) => (
        <Chip
          key={key}
          selected={selectedStatus === key}
          onPress={() => setSelectedStatus(key)}
          style={[
            styles.chip,
            selectedStatus === key && styles.selectedChip
          ]}
          textStyle={[
            styles.chipText,
            selectedStatus === key && styles.selectedChipText
          ]}
        >
          {label} ({statusCounts[key] || 0})
        </Chip>
      ))}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Icon name="trophy" size={24} color="#FFD700" />
        <Text style={styles.statValue}>{statusCounts.completed || 0}</Text>
        <Text style={styles.statLabel}>Completed</Text>
      </View>
      
      <View style={styles.statCard}>
        <Icon name="clock" size={24} color="#FF6B35" />
        <Text style={styles.statValue}>{statusCounts.upcoming || 0}</Text>
        <Text style={styles.statLabel}>Upcoming</Text>
      </View>
      
      <View style={styles.statCard}>
        <Icon name="play-circle" size={24} color="#4CAF50" />
        <Text style={styles.statValue}>{statusCounts.live || 0}</Text>
        <Text style={styles.statLabel}>Live</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="trophy-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>
        {selectedStatus === 'all' 
          ? 'No tournaments joined yet' 
          : `No ${selectedStatus} tournaments`
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedStatus === 'all'
          ? 'Join your first tournament to get started!'
          : 'Try selecting a different filter'
        }
      </Text>
      {selectedStatus === 'all' && (
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Tournaments')}
        >
          <Text style={styles.browseButtonText}>Browse Tournaments</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && myTournaments.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTournaments}
        renderItem={renderTournament}
        keyExtractor={item => item._id}
        ListHeaderComponent={() => (
          <>
            {renderStats()}
            {renderStatusFilters()}
          </>
        )}
        ListEmptyComponent={renderEmptyState}
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

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Tournaments')}
        color="#FFFFFF"
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
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
  tournamentCard: {
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B35',
  },
});

export default MyTournamentsScreen;