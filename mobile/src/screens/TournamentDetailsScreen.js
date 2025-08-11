/**
 * Tournament Details Screen
 * Detailed view of a tournament with join functionality
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Chip, Avatar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import CountDown from 'react-native-countdown-component';

import { 
  fetchTournamentDetails, 
  joinTournament, 
  clearSelectedTournament 
} from '../store/slices/tournamentsSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const { width } = Dimensions.get('window');

const TournamentDetailsScreen = ({ route, navigation }) => {
  const { tournamentId } = route.params;
  const dispatch = useDispatch();
  
  const { selectedTournament, isLoading, isJoining, error } = useSelector(
    state => state.tournaments
  );
  const { user } = useSelector(state => state.auth);
  const { balance } = useSelector(state => state.wallet);

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamData, setTeamData] = useState({
    teamName: '',
    players: [{ name: user?.username || '', gameId: '' }],
  });

  useEffect(() => {
    loadTournamentDetails();
    
    return () => {
      dispatch(clearSelectedTournament());
    };
  }, [tournamentId]);

  const loadTournamentDetails = async () => {
    try {
      await dispatch(fetchTournamentDetails(tournamentId)).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to load tournament details');
      navigation.goBack();
    }
  };

  const handleJoinTournament = async () => {
    if (!selectedTournament) return;

    // Check wallet balance
    if (balance < selectedTournament.entryFee) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${selectedTournament.entryFee} to join this tournament. Your current balance is ₹${balance}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Add Money', 
            onPress: () => navigation.navigate('Wallet') 
          },
        ]
      );
      return;
    }

    try {
      await dispatch(joinTournament({ 
        tournamentId, 
        teamData 
      })).unwrap();
      
      Alert.alert(
        'Success!',
        'You have successfully joined the tournament!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error || 'Failed to join tournament');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#4CAF50';
      case 'live': return '#FF6B35';
      case 'completed': return '#666';
      default: return '#666';
    }
  };

  const getTimeUntilStart = () => {
    if (!selectedTournament) return 0;
    const startTime = new Date(selectedTournament.startTime).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((startTime - now) / 1000));
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#FF6B35', '#F7931E']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.tournamentTitle}>{selectedTournament.title}</Text>
        <Text style={styles.gameType}>{selectedTournament.game.toUpperCase()}</Text>
        
        <View style={styles.statusContainer}>
          <Chip
            style={[
              styles.statusChip,
              { backgroundColor: getStatusColor(selectedTournament.status) }
            ]}
            textStyle={styles.statusText}
          >
            {selectedTournament.status.toUpperCase()}
          </Chip>
        </View>
      </View>
    </LinearGradient>
  );

  const renderPrizePool = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.prizeContainer}>
          <Icon name="trophy" size={32} color="#FFD700" />
          <View style={styles.prizeInfo}>
            <Text style={styles.prizeLabel}>Total Prize Pool</Text>
            <Text style={styles.prizeAmount}>₹{selectedTournament.prizePool}</Text>
          </View>
          <View style={styles.entryFeeInfo}>
            <Text style={styles.entryFeeLabel}>Entry Fee</Text>
            <Text style={styles.entryFeeAmount}>
              {selectedTournament.entryFee === 0 ? 'FREE' : `₹${selectedTournament.entryFee}`}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderTournamentInfo = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Tournament Information</Text>
        
        <View style={styles.infoRow}>
          <Icon name="calendar" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>
            {new Date(selectedTournament.startTime).toLocaleDateString()} at{' '}
            {new Date(selectedTournament.startTime).toLocaleTimeString()}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="account-group" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>
            {selectedTournament.participants}/{selectedTournament.maxParticipants} Players
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="map" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>{selectedTournament.map}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="clock" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>
            Duration: {selectedTournament.duration} minutes
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderCountdown = () => {
    if (selectedTournament.status !== 'upcoming') return null;
    
    const timeUntilStart = getTimeUntilStart();
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Tournament Starts In</Text>
          <View style={styles.countdownContainer}>
            <CountDown
              until={timeUntilStart}
              size={20}
              digitStyle={styles.countdownDigit}
              digitTxtStyle={styles.countdownText}
              separatorStyle={styles.countdownSeparator}
              timeToShow={['H', 'M', 'S']}
              timeLabels={{ h: 'Hours', m: 'Minutes', s: 'Seconds' }}
              showSeparator
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderRules = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Rules & Regulations</Text>
        {selectedTournament.rules?.map((rule, index) => (
          <View key={index} style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>{index + 1}.</Text>
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderJoinButton = () => {
    if (selectedTournament.status !== 'upcoming') return null;
    if (selectedTournament.isJoined) {
      return (
        <Button
          mode="contained"
          style={[styles.joinButton, styles.joinedButton]}
          disabled
        >
          Already Joined
        </Button>
      );
    }

    const isFull = selectedTournament.participants >= selectedTournament.maxParticipants;
    
    return (
      <Button
        mode="contained"
        style={[styles.joinButton, isFull && styles.disabledButton]}
        onPress={handleJoinTournament}
        loading={isJoining}
        disabled={isFull || isJoining}
      >
        {isFull ? 'Tournament Full' : `Join Tournament (₹${selectedTournament.entryFee})`}
      </Button>
    );
  };

  if (isLoading || !selectedTournament) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderPrizePool()}
        {renderCountdown()}
        {renderTournamentInfo()}
        {renderRules()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      <View style={styles.bottomContainer}>
        {renderJoinButton()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  tournamentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  gameType: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusChip: {
    paddingHorizontal: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1E1E1E',
    margin: 16,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prizeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  prizeLabel: {
    color: '#666',
    fontSize: 14,
  },
  prizeAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  entryFeeInfo: {
    alignItems: 'flex-end',
  },
  entryFeeLabel: {
    color: '#666',
    fontSize: 14,
  },
  entryFeeAmount: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  countdownDigit: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countdownSeparator: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  ruleNumber: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 20,
  },
  ruleText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  joinButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
  },
  joinedButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default TournamentDetailsScreen;