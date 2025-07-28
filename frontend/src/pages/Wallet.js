import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  Plus, 
  Minus, 
  CreditCard, 
  Smartphone,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
  Eye,
  EyeOff,
  Trophy,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Lock
} from 'lucide-react';
import { getWalletBalance, getTransactionHistory, addFunds, withdrawFunds } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from '../components/Auth/AuthModal';
import { useAuthModal } from '../hooks/useAuthModal';

const Wallet = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    isAuthModalOpen, 
    authModalTab, 
    openAuthModal, 
    closeAuthModal, 
    openLoginModal, 
    openRegisterModal 
  } = useAuthModal();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [filterType, setFilterType] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: WalletIcon },
    { id: 'transactions', label: 'Transactions', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: Smartphone, description: 'PhonePe, GPay, Paytm' },
    { id: 'card', name: 'Card', icon: CreditCard, description: 'Debit/Credit Card' }
  ];

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [balanceRes, transactionsRes] = await Promise.all([
        getWalletBalance(),
        getTransactionHistory()
      ]);

      setBalance(balanceRes.balance || 0);
      setTransactions(transactionsRes.transactions || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      setBalance(0);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!addAmount || addAmount <= 0) return;

    try {
      await addFunds({
        amount: parseFloat(addAmount),
        paymentMethod: selectedPaymentMethod
      });
      
      setBalance(prev => prev + parseFloat(addAmount));
      setAddAmount('');
      setShowAddFunds(false);
      fetchWalletData(); // Refresh data
    } catch (error) {
      console.error('Error adding funds:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > balance) return;

    try {
      await withdrawFunds({
        amount: parseFloat(withdrawAmount),
        paymentMethod: selectedPaymentMethod
      });
      
      setBalance(prev => prev - parseFloat(withdrawAmount));
      setWithdrawAmount('');
      setShowWithdraw(false);
      fetchWalletData(); // Refresh data
    } catch (error) {
      console.error('Error withdrawing funds:', error);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filterType !== 'all' && transaction.type !== filterType) return false;
    
    if (filterPeriod !== 'all') {
      const transactionDate = new Date(transaction.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now - transactionDate) / (1000 * 60 * 60 * 24));
      
      switch (filterPeriod) {
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
        case 'quarter':
          if (daysDiff > 90) return false;
          break;
      }
    }
    
    return true;
  });

  const getTransactionIcon = (type) => {
    return type === 'credit' ? (
      <ArrowUpRight className="w-4 h-4 text-green-400" />
    ) : (
      <ArrowDownLeft className="w-4 h-4 text-red-400" />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateStats = () => {
    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebits = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalCredits, totalDebits };
  };

  const { totalCredits, totalDebits } = calculateStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-white/60 text-lg">
            Manage your funds and track your transactions
          </p>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="glass-card p-8 mb-8 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center">
                <WalletIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Current Balance</h2>
                <p className="text-white/60">Available for tournaments</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-300"
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5 text-white/60" />
              ) : (
                <Eye className="w-5 h-5 text-white/60" />
              )}
            </button>
          </div>

          <div className="mb-8">
            <div className="text-5xl font-bold text-green-400 mb-2">
              {showBalance ? `₹${balance.toLocaleString()}` : '₹••••••'}
            </div>
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>+₹{totalCredits.toLocaleString()} this month</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span>-₹{totalDebits.toLocaleString()} this month</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowAddFunds(true)}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Funds</span>
                </button>
                
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="btn-secondary flex items-center justify-center space-x-2"
                  disabled={balance <= 0}
                >
                  <Minus className="w-4 h-4" />
                  <span>Withdraw</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Login to Add Funds</span>
                </button>
                
                <button
                  onClick={openLoginModal}
                  className="btn-secondary flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Login to Withdraw</span>
                </button>
              </>
            )}
          </div>

          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -translate-y-32 translate-x-32" />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="glass-card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Total Earned</h3>
                <p className="text-white/60 text-sm">From tournaments</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-400">
              ₹{totalCredits.toLocaleString()}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Total Spent</h3>
                <p className="text-white/60 text-sm">Entry fees</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-red-400">
              ₹{totalDebits.toLocaleString()}
            </p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Net Profit</h3>
                <p className="text-white/60 text-sm">This month</p>
              </div>
            </div>
            <p className={`text-2xl font-bold ${
              totalCredits - totalDebits >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              ₹{(totalCredits - totalDebits).toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'glass-card text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {activeTab === 'transactions' && (
            <div className="glass-card p-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Only</option>
                  <option value="debit">Debits Only</option>
                </select>
                
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="input-field"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last 3 Months</option>
                </select>

                <button className="btn-secondary flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <div
                      key={transaction._id}
                      className="transaction-item"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">
                            {transaction.description}
                          </h4>
                          <p className="text-white/60 text-sm">
                            {formatDate(transaction.timestamp)}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold text-lg ${
                            transaction.type === 'credit' 
                              ? 'transaction-amount-positive' 
                              : 'transaction-amount-negative'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                          </p>
                          <p className="text-white/60 text-sm capitalize">
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-white/40 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Transactions Found</h3>
                    <p className="text-white/60">
                      {filterType !== 'all' || filterPeriod !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Your transaction history will appear here'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction._id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        transaction.type === 'credit' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <p className="text-white/60 text-sm">{formatDate(transaction.timestamp)}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${
                      transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6">Spending Analytics</h3>
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h4 className="text-xl font-bold text-white mb-2">Analytics Coming Soon</h4>
                <p className="text-white/60">
                  Detailed spending analytics and insights will be available soon
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Add Funds Modal */}
        {showAddFunds && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">Add Funds</h3>
              
              {/* Quick Amounts */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Quick Select</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAddAmount(amount.toString())}
                      className={`p-3 rounded-xl font-semibold transition-all duration-300 ${
                        addAmount === amount.toString()
                          ? 'bg-blue-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Custom Amount</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field w-full"
                  min="1"
                />
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Payment Method</label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 ${
                          selectedPaymentMethod === method.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-semibold">{method.name}</p>
                          <p className="text-sm opacity-80">{method.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1 btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFunds}
                  disabled={!addAmount || addAmount <= 0}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add ₹{addAmount || 0}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold text-white mb-6">Withdraw Funds</h3>
              
              <div className="mb-6">
                <p className="text-white/60 mb-2">Available Balance</p>
                <p className="text-2xl font-bold text-green-400">₹{balance.toLocaleString()}</p>
              </div>

              {/* Withdraw Amount */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Withdraw Amount</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="input-field w-full"
                  min="1"
                  max={balance}
                />
                <p className="text-white/60 text-sm mt-2">
                  Minimum withdrawal: ₹100
                </p>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-white font-semibold mb-3">Withdrawal Method</label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-300 ${
                          selectedPaymentMethod === method.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/5 text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-semibold">{method.name}</p>
                          <p className="text-sm opacity-80">{method.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowWithdraw(false)}
                  className="flex-1 btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || withdrawAmount <= 0 || withdrawAmount > balance}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw ₹{withdrawAmount || 0}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
        defaultTab={authModalTab} 
      />
    </div>
  );
};

export default Wallet;