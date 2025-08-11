/**
 * Wallet Screen
 * Manage wallet balance, add money, and view transactions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, TextInput, Modal, Portal } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { 
  fetchWalletBalance, 
  fetchTransactions, 
  addMoney,
  withdrawMoney 
} from '../store/slices/walletSlice';
import LoadingSpinner from '../components/LoadingSpinner';

const WalletScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { balance, transactions, isLoading, isProcessing, error } = useSelector(
    state => state.wallet
  );
  
  const [refreshing, setRefreshing] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      await Promise.all([
        dispatch(fetchWalletBalance()).unwrap(),
        dispatch(fetchTransactions()).unwrap(),
      ]);
    } catch (error) {
      Alert.alert('Error', error || 'Failed to load wallet data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    
    if (!amount || amount < 10) {
      Alert.alert('Invalid Amount', 'Minimum amount is ₹10');
      return;
    }

    if (amount > 50000) {
      Alert.alert('Invalid Amount', 'Maximum amount is ₹50,000');
      return;
    }

    try {
      await dispatch(addMoney({ 
        amount, 
        paymentMethod: 'razorpay' 
      })).unwrap();
      
      setShowAddMoneyModal(false);
      setAddAmount('');
      Alert.alert('Success', 'Money added successfully!');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to add money');
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal amount is ₹100');
      return;
    }

    if (amount > balance) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your current balance');
      return;
    }

    try {
      await dispatch(withdrawMoney({ 
        amount,
        bankDetails: {} // This would be collected from user
      })).unwrap();
      
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      Alert.alert('Success', 'Withdrawal request submitted successfully!');
    } catch (error) {
      Alert.alert('Error', error || 'Failed to process withdrawal');
    }
  };

  const renderWalletHeader = () => (
    <LinearGradient
      colors={['#FF6B35', '#F7931E']}
      style={styles.walletHeader}
    >
      <View style={styles.balanceContainer}>
        <Icon name="wallet" size={32} color="#FFFFFF" />
        <View style={styles.balanceInfo}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance?.toFixed(2) || '0.00'}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowAddMoneyModal(true)}
        >
          <Icon name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Add Money</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowWithdrawModal(true)}
        >
          <Icon name="bank-transfer-out" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderQuickAmounts = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Quick Add Amounts</Text>
        <View style={styles.quickAmountsContainer}>
          {[100, 500, 1000, 2000, 5000].map(amount => (
            <TouchableOpacity
              key={amount}
              style={styles.quickAmountButton}
              onPress={() => {
                setAddAmount(amount.toString());
                setShowAddMoneyModal(true);
              }}
            >
              <Text style={styles.quickAmountText}>₹{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionIcon}>
        <Icon
          name={item.type === 'credit' ? 'plus-circle' : 'minus-circle'}
          size={24}
          color={item.type === 'credit' ? '#4CAF50' : '#F44336'}
        />
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{item.description}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.createdAt).toLocaleDateString()} at{' '}
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
        <Text style={[
          styles.transactionStatus,
          { color: getStatusColor(item.status) }
        ]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.transactionAmount}>
        <Text style={[
          styles.amountText,
          { color: item.type === 'credit' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.type === 'credit' ? '+' : '-'}₹{item.amount}
        </Text>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#666';
    }
  };

  const renderTransactions = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.transactionsHeader}>
          <Text style={styles.cardTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {transactions.length > 0 ? (
          <FlatList
            data={transactions.slice(0, 5)}
            renderItem={renderTransaction}
            keyExtractor={item => item._id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyTransactions}>
            <Icon name="receipt" size={48} color="#666" />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderAddMoneyModal = () => (
    <Portal>
      <Modal
        visible={showAddMoneyModal}
        onDismiss={() => setShowAddMoneyModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Add Money to Wallet</Text>
        
        <TextInput
          label="Amount (₹)"
          value={addAmount}
          onChangeText={setAddAmount}
          keyboardType="numeric"
          style={styles.input}
          theme={{ colors: { primary: '#FF6B35' } }}
        />
        
        <Text style={styles.modalNote}>
          Minimum: ₹10 | Maximum: ₹50,000
        </Text>
        
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setShowAddMoneyModal(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleAddMoney}
            loading={isProcessing}
            style={[styles.modalButton, styles.primaryButton]}
          >
            Add Money
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  const renderWithdrawModal = () => (
    <Portal>
      <Modal
        visible={showWithdrawModal}
        onDismiss={() => setShowWithdrawModal(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text style={styles.modalTitle}>Withdraw Money</Text>
        
        <TextInput
          label="Amount (₹)"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
          keyboardType="numeric"
          style={styles.input}
          theme={{ colors: { primary: '#FF6B35' } }}
        />
        
        <Text style={styles.modalNote}>
          Minimum: ₹100 | Available: ₹{balance?.toFixed(2) || '0.00'}
        </Text>
        
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setShowWithdrawModal(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleWithdraw}
            loading={isProcessing}
            style={[styles.modalButton, styles.primaryButton]}
          >
            Withdraw
          </Button>
        </View>
      </Modal>
    </Portal>
  );

  if (isLoading && transactions.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderWalletHeader()}
        {renderQuickAmounts()}
        {renderTransactions()}
      </ScrollView>
      
      {renderAddMoneyModal()}
      {renderWithdrawModal()}
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
  walletHeader: {
    padding: 20,
    paddingTop: 40,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceInfo: {
    marginLeft: 16,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
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
  quickAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    width: '18%',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAmountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  transactionsHeader: {
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  transactionIcon: {
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  transactionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
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
  modalNote: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
});

export default WalletScreen;