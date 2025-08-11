/**
 * Notifications Screen
 * Display and manage user notifications
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
import { FAB, Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification 
} from '../store/slices/notificationsSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const NotificationsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { notifications, unreadCount, isLoading, error } = useSelector(
    state => state.notifications
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      await dispatch(fetchNotifications()).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to load notifications');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dispatch(markAsRead(notificationId)).unwrap();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to mark all as read');
    }
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteNotification(notificationId)).unwrap();
            } catch (error) {
              Alert.alert('Error', error || 'Failed to delete notification');
            }
          }
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'tournament': return 'trophy';
      case 'payment': return 'credit-card';
      case 'system': return 'cog';
      case 'promotion': return 'gift';
      default: return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'tournament': return '#FF6B35';
      case 'payment': return '#4CAF50';
      case 'system': return '#2196F3';
      case 'promotion': return '#9C27B0';
      default: return '#666';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.type === filter;
  });

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => {
        if (!item.read) {
          handleMarkAsRead(item._id);
        }
        // Handle navigation based on notification type
        if (item.type === 'tournament' && item.data?.tournamentId) {
          navigation.navigate('TournamentDetails', { 
            tournamentId: item.data.tournamentId 
          });
        }
      }}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.iconContainer}>
            <Icon
              name={getNotificationIcon(item.type)}
              size={24}
              color={getNotificationColor(item.type)}
            />
          </View>
          
          <View style={styles.notificationInfo}>
            <Text style={[
              styles.notificationTitle,
              !item.read && styles.unreadTitle
            ]}>
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>
              {new Date(item.createdAt).toLocaleDateString()} at{' '}
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteNotification(item._id)}
          >
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>
        
        {!item.read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      {[
        { key: 'all', label: 'All' },
        { key: 'unread', label: 'Unread' },
        { key: 'tournament', label: 'Tournaments' },
        { key: 'payment', label: 'Payments' },
        { key: 'system', label: 'System' },
      ].map(({ key, label }) => (
        <Chip
          key={key}
          selected={filter === key}
          onPress={() => setFilter(key)}
          style={[
            styles.chip,
            filter === key && styles.selectedChip
          ]}
          textStyle={[
            styles.chipText,
            filter === key && styles.selectedChipText
          ]}
        >
          {label}
        </Chip>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Notifications</Text>
      {unreadCount > 0 && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="bell-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>
        {filter === 'all' 
          ? 'No notifications yet' 
          : `No ${filter} notifications`
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all'
          ? 'You\'ll see notifications here when you have them'
          : 'Try selecting a different filter'
        }
      </Text>
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={item => item._id}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderFilters()}
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

      {unreadCount > 0 && (
        <FAB
          style={styles.fab}
          icon="check-all"
          onPress={handleMarkAllAsRead}
          color="#FFFFFF"
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  notificationItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    color: '#666',
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  notificationMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
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
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B35',
  },
});

export default NotificationsScreen;