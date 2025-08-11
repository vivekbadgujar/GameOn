/**
 * Tournament Card Component
 * Unified tournament card for mobile app
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Card, Button, Chip, ProgressBar } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
// import FastImage from 'react-native-fast-image';

const { width } = Dimensions.get('window');

const TournamentCard = ({ tournament, onPress, style }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#4CAF50';
      case 'live': return '#FF6B35';
      case 'completed': return '#9E9E9E';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return 'clock-outline';
      case 'live': return 'play-circle';
      case 'completed': return 'check-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameIcon = (game) => {
    switch (game?.toLowerCase()) {
      case 'bgmi':
      case 'pubg':
        return 'gamepad-variant';
      case 'free fire':
      case 'freefire':
        return 'fire';
      case 'cod':
      case 'call of duty':
        return 'pistol';
      default:
        return 'gamepad';
    }
  };

  const participationPercentage = tournament.maxParticipants > 0 
    ? (tournament.currentParticipants / tournament.maxParticipants) * 100 
    : 0;

  const isAlmostFull = participationPercentage >= 80;
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, style]}>
      <Card style={styles.card}>
        <LinearGradient
          colors={['#1E1E1E', '#2A2A2A']}
          style={styles.cardContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.gameInfo}>
              <View style={styles.gameIconContainer}>
                <Icon
                  name={getGameIcon(tournament.game)}
                  size={24}
                  color="#FF6B35"
                />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {tournament.title}
                </Text>
                <Text style={styles.gameText}>{tournament.game}</Text>
              </View>
            </View>
            
            <Chip
              icon={getStatusIcon(tournament.status)}
              style={[styles.statusChip, { backgroundColor: getStatusColor(tournament.status) }]}
              textStyle={styles.statusText}
            >
              {tournament.status.toUpperCase()}
            </Chip>
          </View>

          {/* Tournament Details */}
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="currency-inr" size={16} color="#FF6B35" />
                <Text style={styles.detailText}>₹{tournament.entryFee}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Icon name="trophy" size={16} color="#FFD700" />
                <Text style={styles.detailText}>₹{tournament.prizePool}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Icon name="clock" size={16} color="#4CAF50" />
                <Text style={styles.detailText}>{formatDate(tournament.startDate)}</Text>
              </View>
            </View>

            {/* Participation Progress */}
            <View style={styles.participationContainer}>
              <View style={styles.participationHeader}>
                <Text style={styles.participationText}>
                  {tournament.currentParticipants}/{tournament.maxParticipants} Players
                </Text>
                <Text style={[
                  styles.participationPercentage,
                  { color: isAlmostFull ? '#FF6B35' : '#4CAF50' }
                ]}>
                  {Math.round(participationPercentage)}%
                </Text>
              </View>
              
              <ProgressBar
                progress={participationPercentage / 100}
                color={isAlmostFull ? '#FF6B35' : '#4CAF50'}
                style={styles.progressBar}
              />
            </View>

            {/* Tournament Type & Map */}
            <View style={styles.metaInfo}>
              <Chip style={styles.typeChip} textStyle={styles.typeText}>
                {tournament.tournamentType || 'Solo'}
              </Chip>
              
              {tournament.map && (
                <Chip style={styles.mapChip} textStyle={styles.mapText}>
                  {tournament.map}
                </Chip>
              )}
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionContainer}>
            {tournament.status === 'upcoming' && !isFull && (
              <Button
                mode="contained"
                style={styles.joinButton}
                labelStyle={styles.joinButtonText}
                icon="plus"
              >
                Join Tournament
              </Button>
            )}
            
            {tournament.status === 'live' && (
              <Button
                mode="contained"
                style={styles.liveButton}
                labelStyle={styles.liveButtonText}
                icon="play"
              >
                View Live
              </Button>
            )}
            
            {isFull && tournament.status === 'upcoming' && (
              <Button
                mode="outlined"
                style={styles.fullButton}
                labelStyle={styles.fullButtonText}
                disabled
              >
                Tournament Full
              </Button>
            )}
            
            {tournament.status === 'completed' && (
              <Button
                mode="outlined"
                style={styles.completedButton}
                labelStyle={styles.completedButtonText}
                icon="trophy"
              >
                View Results
              </Button>
            )}
          </View>

          {/* Urgent Indicators */}
          {isAlmostFull && tournament.status === 'upcoming' && (
            <View style={styles.urgentIndicator}>
              <Icon name="fire" size={16} color="#FF6B35" />
              <Text style={styles.urgentText}>Filling Fast!</Text>
            </View>
          )}
          
          {tournament.status === 'live' && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
          )}
        </LinearGradient>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  card: {
    backgroundColor: 'transparent',
    elevation: 4,
  },
  cardContent: {
    padding: 16,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  gameIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  gameText: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  participationContainer: {
    marginBottom: 12,
  },
  participationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  participationText: {
    color: '#B0B0B0',
    fontSize: 12,
  },
  participationPercentage: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    backgroundColor: '#333',
    height: 24,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  mapChip: {
    backgroundColor: '#444',
    height: 24,
  },
  mapText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  actionContainer: {
    marginTop: 12,
  },
  joinButton: {
    backgroundColor: '#FF6B35',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  liveButton: {
    backgroundColor: '#4CAF50',
  },
  liveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  fullButton: {
    borderColor: '#666',
  },
  fullButtonText: {
    color: '#666',
  },
  completedButton: {
    borderColor: '#FFD700',
  },
  completedButtonText: {
    color: '#FFD700',
  },
  urgentIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  liveText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default TournamentCard;