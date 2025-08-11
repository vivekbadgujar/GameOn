/**
 * Tournaments Screen
 * Browse and filter available tournaments
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
import { Searchbar, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { fetchTournaments, setFilters } from '../store/slices/tournamentsSlice';
import TournamentCard from '../components/TournamentCard';
import LoadingSpinner from '../components/LoadingSpinner';

const TournamentsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { tournaments, isLoading, error, filters } = useSelector(state => state.tournaments);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTournaments();
  }, [filters]);

  const loadTournaments = async () => {
    try {
      await dispatch(fetchTournaments(filters)).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to load tournaments');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTournaments();
    setRefreshing(false);
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const filteredTournaments = tournaments.filter(tournament =>
    tournament.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tournament.game.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTournament = ({ item }) => (
    <TournamentCard
      tournament={item}
      onPress={() => navigation.navigate('TournamentDetails', { 
        tournamentId: item._id 
      })}
      style={styles.tournamentCard}
    />
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <Text style={styles.filtersTitle}>Status</Text>
      <View style={styles.chipContainer}>
        {['upcoming', 'live', 'completed'].map(status => (
          <Chip
            key={status}
            selected={filters.status === status}
            onPress={() => handleFilterChange('status', status)}
            style={[
              styles.chip,
              filters.status === status && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              filters.status === status && styles.selectedChipText
            ]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Chip>
        ))}
      </View>

      <Text style={styles.filtersTitle}>Game</Text>
      <View style={styles.chipContainer}>
        {['all', 'bgmi', 'freefire', 'cod'].map(game => (
          <Chip
            key={game}
            selected={filters.game === game}
            onPress={() => handleFilterChange('game', game)}
            style={[
              styles.chip,
              filters.game === game && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              filters.game === game && styles.selectedChipText
            ]}
          >
            {game === 'all' ? 'All Games' : game.toUpperCase()}
          </Chip>
        ))}
      </View>

      <Text style={styles.filtersTitle}>Entry Fee</Text>
      <View style={styles.chipContainer}>
        {['all', 'free', 'paid'].map(fee => (
          <Chip
            key={fee}
            selected={filters.entryFee === fee}
            onPress={() => handleFilterChange('entryFee', fee)}
            style={[
              styles.chip,
              filters.entryFee === fee && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              filters.entryFee === fee && styles.selectedChipText
            ]}
          >
            {fee.charAt(0).toUpperCase() + fee.slice(1)}
          </Chip>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder="Search tournaments..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        inputStyle={styles.searchInput}
        iconColor="#FF6B35"
      />
      
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Icon 
          name={showFilters ? "filter-off" : "filter"} 
          size={24} 
          color="#FF6B35" 
        />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="trophy-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No tournaments found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your filters or check back later
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && tournaments.length === 0) {
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
            {renderHeader()}
            {showFilters && renderFilters()}
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
        icon="refresh"
        onPress={onRefresh}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchbar: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    elevation: 0,
  },
  searchInput: {
    color: '#FFFFFF',
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
  },
  filtersContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filtersTitle: {
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
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
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

export default TournamentsScreen;