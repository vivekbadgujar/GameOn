/**
 * Room Lobby Screen
 * Tournament room lobby with real-time updates
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Chip } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const API_BASE_URL = (process.env.API_URL || process.env.EXPO_PUBLIC_API_URL || 'https://api.gameonesport.xyz').replace(/\/$/, '');
import CountDown from 'react-native-countdown-component';

import LoadingSpinner from '../components/LoadingSpinner';

const RoomLobbyScreen = ({ route, navigation }) => {
  const { tournamentId } = route.params;
  const dispatch = useDispatch();
  
  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [roomDetails, setRoomDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoomData();
    
    // Set up real-time updates here
    // This would typically use WebSocket or Socket.IO
    
    return () => {
      // Cleanup real-time connections
    };
  }, [tournamentId]);

  const loadRoomData = async () => {
    try {
      setIsLoading(true);
      
      // Get auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        navigation.navigate('Login');
        return;
      }
      
      // Fetch tournament details
      const tournamentResponse = await fetch(`${API_BASE_URL}/api/tournaments/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!tournamentResponse.ok) {
        throw new Error('Failed to fetch tournament details');
      }
      
      const tournamentData = await tournamentResponse.json();
      setTournament(tournamentData.tournament);
      
      // Fetch room slot data
      const roomResponse = await fetch(`${API_BASE_URL}/api/room-slots/tournament/${tournamentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (roomResponse.ok) {
        const roomData = await roomResponse.json();
        
        // Extract participants from room slot data
        const allParticipants = [];
        if (roomData.data.roomSlot && roomData.data.roomSlot.teams) {
          roomData.data.roomSlot.teams.forEach(team => {
            const teamMembers = team.slots.filter(slot => slot.player).map(slot => slot.player);
            if (teamMembers.length > 0) {
              allParticipants.push({
                _id: team._id,
                teamName: `Team ${team.teamNumber}`,
                leader: team.captain?.username || teamMembers[0]?.username || 'Unknown',
                members: teamMembers.length,
                ready: team.isReady || false,
                players: teamMembers
              });
            }
          });
        }
        setParticipants(allParticipants);
        
        // Set room details if available
        if (tournamentData.tournament.roomDetails) {
          setRoomDetails({
            roomId: tournamentData.tournament.roomDetails.roomId,
            password: tournamentData.tournament.roomDetails.password,
            server: 'Asia',
            perspective: 'TPP',
          });
        }
      } else {
        // Fallback to tournament participants if room slots not available
        const tournamentParticipants = tournamentData.tournament.participants || [];
        const participantGroups = [];
        
        for (let i = 0; i < tournamentParticipants.length; i += 4) {
          const group = tournamentParticipants.slice(i, i + 4);
          participantGroups.push({
            _id: `team_${i / 4 + 1}`,
            teamName: `Team ${i / 4 + 1}`,
            leader: group[0]?.user?.username || 'Unknown',
            members: group.length,
            ready: false,
            players: group.map(p => p.user)
          });
        }
        setParticipants(participantGroups);
      }
      
    } catch (error) {
      console.error('Error loading room data:', error);
      Alert.alert('Error', 'Failed to load room data');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const getTimeUntilStart = () => {
    if (!tournament) return 0;
    const startTime = new Date(tournament.startTime).getTime();
    const now = new Date().getTime();
    return Math.max(0, Math.floor((startTime - now) / 1000));
  };

  const renderHeader = () => (
    <LinearGradient
      colors={['#FF6B35', '#F7931E']}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <Text style={styles.tournamentTitle}>{tournament?.title}</Text>
        <Text style={styles.gameInfo}>{tournament?.game?.toUpperCase()} • {tournament?.map}</Text>
        
        <View style={styles.statusContainer}>
          <Chip
            style={styles.statusChip}
            textStyle={styles.statusText}
          >
            LIVE LOBBY
          </Chip>
        </View>
      </View>
    </LinearGradient>
  );

  const renderCountdown = () => {
    const timeUntilStart = getTimeUntilStart();
    
    if (timeUntilStart <= 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.matchStarted}>
              <Icon name="play-circle" size={48} color="#4CAF50" />
              <Text style={styles.matchStartedText}>Match Started!</Text>
              <Text style={styles.matchStartedSubtext}>Join the game now</Text>
            </View>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Match Starts In</Text>
          <View style={styles.countdownContainer}>
            <CountDown
              until={timeUntilStart}
              size={20}
              digitStyle={styles.countdownDigit}
              digitTxtStyle={styles.countdownText}
              separatorStyle={styles.countdownSeparator}
              timeToShow={['M', 'S']}
              timeLabels={{ m: 'Minutes', s: 'Seconds' }}
              showSeparator
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderRoomDetails = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Room Details</Text>
        
        <View style={styles.roomDetailItem}>
          <View style={styles.roomDetailInfo}>
            <Text style={styles.roomDetailLabel}>Room ID</Text>
            <Text style={styles.roomDetailValue}>{roomDetails?.roomId}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(roomDetails?.roomId, 'Room ID')}
          >
            <Icon name="content-copy" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.roomDetailItem}>
          <View style={styles.roomDetailInfo}>
            <Text style={styles.roomDetailLabel}>Password</Text>
            <Text style={styles.roomDetailValue}>{roomDetails?.password}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(roomDetails?.password, 'Password')}
          >
            <Icon name="content-copy" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.roomDetailItem}>
          <View style={styles.roomDetailInfo}>
            <Text style={styles.roomDetailLabel}>Server</Text>
            <Text style={styles.roomDetailValue}>{roomDetails?.server}</Text>
          </View>
        </View>
        
        <View style={styles.roomDetailItem}>
          <View style={styles.roomDetailInfo}>
            <Text style={styles.roomDetailLabel}>Perspective</Text>
            <Text style={styles.roomDetailValue}>{roomDetails?.perspective}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderParticipant = ({ item }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantInfo}>
        <Text style={styles.teamName}>{item.teamName}</Text>
        <Text style={styles.teamLeader}>Leader: {item.leader}</Text>
        <Text style={styles.teamMembers}>{item.members}/4 members</Text>
      </View>
      
      <View style={styles.participantStatus}>
        <View style={[
          styles.readyIndicator,
          { backgroundColor: item.ready ? '#4CAF50' : '#F44336' }
        ]} />
        <Text style={[
          styles.readyText,
          { color: item.ready ? '#4CAF50' : '#F44336' }
        ]}>
          {item.ready ? 'Ready' : 'Not Ready'}
        </Text>
      </View>
    </View>
  );

  const renderParticipants = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.participantsHeader}>
          <Text style={styles.cardTitle}>Participants ({participants.length})</Text>
          <Text style={styles.readyCount}>
            {participants.filter(p => p.ready).length} Ready
          </Text>
        </View>
        
        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={item => item._id}
          scrollEnabled={false}
        />
      </Card.Content>
    </Card>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <Button
        mode="contained"
        style={styles.actionButton}
        onPress={() => {
          // Open game or show instructions
          Alert.alert(
            'Join Game',
            'Use the room details above to join the game in BGMI app.',
            [{ text: 'OK' }]
          );
        }}
      >
        Join Game
      </Button>
      
      <Button
        mode="outlined"
        style={styles.actionButton}
        onPress={() => navigation.goBack()}
      >
        Leave Lobby
      </Button>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading room..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[]}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderCountdown()}
            {renderRoomDetails()}
            {renderParticipants()}
          </>
        )}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flexGrow: 1,
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
  gameInfo: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusChip: {
    backgroundColor: '#4CAF50',
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
  matchStarted: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  matchStartedText: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  matchStartedSubtext: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 4,
  },
  roomDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  roomDetailInfo: {
    flex: 1,
  },
  roomDetailLabel: {
    color: '#666',
    fontSize: 14,
  },
  roomDetailValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  copyButton: {
    padding: 8,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  readyCount: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  participantInfo: {
    flex: 1,
  },
  teamName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamLeader: {
    color: '#666',
    fontSize: 14,
    marginTop: 2,
  },
  teamMembers: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  readyText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsContainer: {
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  actionButton: {
    marginBottom: 12,
    paddingVertical: 8,
  },
});

export default RoomLobbyScreen;