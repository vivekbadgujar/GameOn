/**
 * Profile Screen
 * User profile management and settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Avatar, 
  Card, 
  List, 
  Switch, 
  Button,
  TextInput,
  Modal,
  Portal 
} from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { logoutUser, updateUser } from '../store/slices/authSlice';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => dispatch(logoutUser())
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    try {
      await dispatch(updateUser(editData)).unwrap();
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to update profile');
    }
  };

  const renderProfileHeader = () => (
    <LinearGradient
      colors={['#FF6B35', '#F7931E']}
      style={styles.profileHeader}
    >
      <View style={styles.avatarContainer}>
        <Avatar.Text
          size={80}
          label={user?.username?.charAt(0)?.toUpperCase() || 'U'}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.editAvatarButton}>
          <Icon name="camera" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.username}>{user?.username || 'User'}</Text>
      <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
      
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => setShowEditModal(true)}
      >
        <Icon name="pencil" size={16} color="#FFFFFF" />
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  const renderStats = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Gaming Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹2,500</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>67%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Settings</Text>
        
        <List.Item
          title="Notifications"
          description="Push notifications for tournaments"
          left={props => <List.Icon {...props} icon="bell" color="#FF6B35" />}
          right={() => (
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              color="#FF6B35"
            />
          )}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDescription}
        />
        
        <List.Item
          title="Dark Mode"
          description="Use dark theme"
          left={props => <List.Icon {...props} icon="theme-light-dark" color="#FF6B35" />}
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              color="#FF6B35"
            />
          )}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDescription}
        />
        
        <List.Item
          title="Language"
          description="English"
          left={props => <List.Icon {...props} icon="translate" color="#FF6B35" />}
          right={props => <List.Icon {...props} icon="chevron-right" color="#666" />}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDescription}
          onPress={() => {}}
        />
      </Card.Content>
    </Card>
  );

  const renderMenuItems = () => (
    <Card style={styles.card}>
      <Card.Content>
        <List.Item
          title="Payment Methods"
          left={props => <List.Icon {...props} icon="credit-card" color="#FF6B35" />}
          right={props => <List.Icon {...props} icon="chevron-right" color="#666" />}
          titleStyle={styles.listTitle}
          onPress={() => {}}
        />
        
        <List.Item
          title="Transaction History"
          left={props => <List.Icon {...props} icon="history" color="#FF6B35" />}
          right={props => <List.Icon {...props} icon="chevron-right" color="#666" />}
          titleStyle={styles.listTitle}
          onPress={() => navigation.navigate('Wallet')}
        />
        
        <List.Item
          title="Help & Support"
          left={props => <List.Icon {...props} icon="help-circle" color="#FF6B35" />}
          right={props => <List.Icon {...props} icon="chevron-right" color="#666" />}
          titleStyle={styles.listTitle}
          onPress={() => {}}
        />
        
        <List.Item
          title="Terms & Conditions"
          left={props => <List.Icon {...props} icon="file-document" color="#FF6B35" />}
          right={props => <List.Icon {...props} icon="chevron-right" color="#666" />}
          titleStyle={styles.listTitle}
          onPress={() => {}}
        />
        
        <List.Item
          title="Privacy Policy"
          left={props => <List.Icon {...props} icon="shield-check" color="#FF6B35" />}
          right={props => <List.Icon {...props} icon="chevron-right" color="#666" />}
          titleStyle={styles.listTitle}
          onPress={() => {}}
        />
      </Card.Content>
    </Card>
  );

  const renderEditModal = () => (
    <Portal>
      <Modal
        visible={showEditModal}
        onDismiss={() => setShowEditModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Edit Profile</Text>
        
        <TextInput
          label="Username"
          value={editData.username}
          onChangeText={(text) => setEditData({ ...editData, username: text })}
          style={styles.input}
          theme={{ colors: { primary: '#FF6B35' } }}
        />
        
        <TextInput
          label="Email"
          value={editData.email}
          onChangeText={(text) => setEditData({ ...editData, email: text })}
          keyboardType="email-address"
          style={styles.input}
          theme={{ colors: { primary: '#FF6B35' } }}
        />
        
        <TextInput
          label="Phone"
          value={editData.phone}
          onChangeText={(text) => setEditData({ ...editData, phone: text })}
          keyboardType="phone-pad"
          style={styles.input}
          theme={{ colors: { primary: '#FF6B35' } }}
        />
        
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setShowEditModal(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleUpdateProfile}
            style={[styles.modalButton, styles.primaryButton]}
          >
            Update
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderStats()}
        {renderSettings()}
        {renderMenuItems()}
        
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={styles.logoutButton}
              icon="logout"
            >
              Logout
            </Button>
          </Card.Content>
        </Card>
        
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>GameOn Mobile v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 GameOn Platform</Text>
        </View>
      </ScrollView>
      
      {renderEditModal()}
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
  profileHeader: {
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  listTitle: {
    color: '#FFFFFF',
  },
  listDescription: {
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appVersion: {
    color: '#666',
    fontSize: 14,
  },
  copyright: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2A2A2A',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
});

export default ProfileScreen;