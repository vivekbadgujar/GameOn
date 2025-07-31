import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Shield,
  Lock
} from 'lucide-react';
import { createPaymentOrder, acceptPolicies } from '../../services/api';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, amount, onSuccess, tournamentName }) => {
  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method'); // method, processing, success
  const [agreeToPolicies, setAgreeToPolicies] = useState(false);

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Credit/Debit Card, UPI, Net Banking',
      icon: CreditCard,
      color: 'blue'
    },
    {
      id: 'upi',
      name: 'UPI',
      description: 'Google Pay, PhonePe, Paytm',
      icon: Smartphone,
      color: 'green'
    },
    {
      id: 'wallet',
      name: 'GameOn Wallet',
      description: 'Use your wallet balance',
      icon: Wallet,
      color: 'purple'
    }
  ];

  const handlePayment = async () => {
    if (!agreeToPolicies) {
      toast.error('Please agree to the Terms & Conditions and Policies to proceed with payment');
      return;
    }

    try {
      setProcessing(true);
      setPaymentStep('processing');

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (selectedMethod === 'razorpay') {
        // Initialize Razorpay
        const orderResponse = await createPaymentOrder(amount);
        
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: amount * 100, // Amount in paise
          currency: 'INR',
          name: 'GameOn Platform',
          description: `Entry fee for ${tournamentName}`,
          order_id: orderResponse.data.orderId,
          handler: async function (response) {
            setPaymentStep('success');
            
            // Save policy acceptance for the user
            try {
              const user = JSON.parse(localStorage.getItem('user'));
              if (user && user._id) {
                await acceptPolicies(user._id, '1.0');
              }
            } catch (error) {
              console.error('Error saving policy acceptance:', error);
            }
            
            setTimeout(() => {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                method: selectedMethod,
                amount: amount
              });
            }, 1500);
          },
          prefill: {
            name: 'Player',
            email: 'player@gameon.com',
            contact: '9999999999'
          },
          theme: {
            color: '#3B82F6'
          },
          modal: {
            ondismiss: function() {
              setProcessing(false);
              setPaymentStep('method');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Mock payment success for other methods
        setPaymentStep('success');
        
        // Save policy acceptance for the user
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          if (user && user._id) {
            await acceptPolicies(user._id, '1.0');
          }
        } catch (error) {
          console.error('Error saving policy acceptance:', error);
        }
        
        setTimeout(() => {
          onSuccess({
            paymentId: `mock_${Date.now()}`,
            method: selectedMethod,
            amount: amount
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      setProcessing(false);
      setPaymentStep('method');
    }
  };

  const getMethodColor = (method) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 border-blue-500/30',
      green: 'from-green-500 to-green-600 border-green-500/30',
      purple: 'from-purple-500 to-purple-600 border-purple-500/30'
    };
    return colors[method.color] || colors.blue;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md glass-card p-6 mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Payment</h2>
            <p className="text-white/60 text-sm">Complete your tournament entry</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Payment Amount */}
        <div className="glass-card p-4 mb-6 bg-gradient-to-r from-green-500/20 to-transparent border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Entry Fee</p>
              <p className="text-white font-medium">{tournamentName}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold text-2xl">₹{amount}</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {paymentStep === 'method' && (
            <motion.div
              key="method"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Choose Payment Method</h3>
              
              {paymentMethods.map((method) => (
                <motion.button
                  key={method.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedMethod === method.id
                      ? `bg-gradient-to-r ${getMethodColor(method)} shadow-lg`
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedMethod === method.id ? 'bg-white/20' : 'bg-white/10'
                    }`}>
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-white font-semibold">{method.name}</p>
                      <p className="text-white/60 text-sm">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <CheckCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                </motion.button>
              ))}

              {/* Security Notice */}
              <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-6">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 font-semibold text-sm">Secure Payment</p>
                  <p className="text-white/60 text-xs">Your payment information is encrypted and secure</p>
                </div>
              </div>

              {/* Policy Agreement */}
              <div className="flex items-start space-x-3 mt-6">
                <input
                  type="checkbox"
                  id="agreeToPolicies"
                  checked={agreeToPolicies}
                  onChange={(e) => setAgreeToPolicies(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-2 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
                  required
                />
                <label htmlFor="agreeToPolicies" className="text-white/80 text-xs leading-relaxed">
                  I have read and agree to GameOn's{' '}
                  <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                    Terms & Conditions
                  </Link>
                  ,{' '}
                  <Link to="/refund" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                    Refund Policy
                  </Link>
                  ,{' '}
                  <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                    Privacy Policy
                  </Link>
                  , and{' '}
                  <Link to="/fairplay" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                    Fair Play Policy
                  </Link>
                  .
                </label>
              </div>

              {/* Pay Button */}
              <motion.button
                whileHover={{ scale: agreeToPolicies && !processing ? 1.02 : 1 }}
                whileTap={{ scale: agreeToPolicies && !processing ? 0.98 : 1 }}
                onClick={handlePayment}
                disabled={processing || !agreeToPolicies}
                className="w-full btn-primary py-4 text-lg font-bold mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Pay ₹{amount}</span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {paymentStep === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Processing Payment</h3>
              <p className="text-white/60">Please wait while we process your payment...</p>
              <div className="mt-6 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {paymentStep === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
              <p className="text-white/60">You have successfully joined the tournament</p>
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm font-semibold">
                  Your slot will be assigned shortly
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PaymentModal;