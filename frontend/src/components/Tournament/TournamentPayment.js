/**
 * Tournament Payment Component with Cashfree Integration
 * Handles tournament entry payments using Cashfree
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  Wallet, 
  CheckCircle, 
  Loader2,
  Shield,
  Lock,
  Users,
  User
} from 'lucide-react';
import cashfreeService from '../../services/cashfreeService';
import toast from 'react-hot-toast';

const TournamentPayment = ({ 
  tournament, 
  joinType, 
  squadMembers, 
  gameProfile, 
  onSuccess, 
  onCancel 
}) => {
  const [selectedMethod, setSelectedMethod] = useState('cashfree');
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method');

  const paymentMethods = cashfreeService.getAvailablePaymentMethods();

  const calculateAmount = () => {
    const baseAmount = tournament.entryFee;
    const multiplier = joinType === 'squad' ? 4 : 1;
    return baseAmount * multiplier;
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setPaymentStep('processing');

      const tournamentData = {
        tournamentId: tournament._id,
        joinType,
        squadMembers,
        gameProfile
      };

      await cashfreeService.processTournamentPayment(
        tournamentData,
        (result) => {
          // Payment success
          setPaymentStep('success');
          setTimeout(() => {
            onSuccess({
              paymentId: result.data?.transactionId,
              tournamentId: tournament._id,
              participantId: result.data?.participantId,
              amount: calculateAmount(),
              method: selectedMethod
            });
          }, 2000);
        },
        (error) => {
          // Payment failure
          console.error('Tournament payment error:', error);
          toast.error(error.message || 'Payment failed. Please try again.');
          setProcessing(false);
          setPaymentStep('method');
        }
      );
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment. Please try again.');
      setProcessing(false);
      setPaymentStep('method');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      {/* Tournament Info */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">{tournament.title}</h2>
        
        {/* Join Type */}
        <div className="flex items-center space-x-2 mb-4">
          {joinType === 'squad' ? (
            <Users className="w-5 h-5 text-blue-400" />
          ) : (
            <User className="w-5 h-5 text-green-400" />
          )}
          <span className="text-white font-medium capitalize">{joinType} Entry</span>
        </div>

        {/* Amount Breakdown */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-white/60">
            <span>Entry Fee per player</span>
            <span>{cashfreeService.formatAmount(tournament.entryFee)}</span>
          </div>
          {joinType === 'squad' && (
            <div className="flex justify-between text-white/60">
              <span>Players (Squad)</span>
              <span>× 4</span>
            </div>
          )}
          <div className="border-t border-white/10 pt-2">
            <div className="flex justify-between text-white font-bold text-lg">
              <span>Total Amount</span>
              <span className="text-green-400">
                {cashfreeService.formatAmount(calculateAmount())}
              </span>
            </div>
          </div>
        </div>

        {/* Tournament Details */}
        <div className="text-sm text-white/60 space-y-1">
          <div>Prize Pool: {cashfreeService.formatAmount(tournament.prizePool)}</div>
          <div>Max Participants: {tournament.maxParticipants}</div>
          <div>Available Slots: {tournament.maxParticipants - tournament.currentParticipants}</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {paymentStep === 'method' && (
          <motion.div
            key="method"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
                    ? 'bg-gradient-to-r from-blue-500/20 to-transparent border-blue-500/30 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedMethod === method.id ? 'bg-white/20' : 'bg-white/10'
                  }`}>
                    <span className="text-2xl">{method.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{method.name}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                  )}
                </div>
              </motion.button>
            ))}

            {/* Security Notice */}
            <div className="flex items-start space-x-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-6">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-semibold text-sm">Secure Payment</p>
                <p className="text-white/60 text-xs">Powered by Cashfree - Bank-grade security</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePayment}
                disabled={processing}
                className="flex-1 btn-primary py-3 px-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Pay {cashfreeService.formatAmount(calculateAmount())}</span>
                </div>
              </motion.button>
            </div>
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
            <p className="text-white/60">Please complete the payment in the popup window...</p>
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
            <p className="text-white/60 mb-4">You have successfully joined the tournament</p>
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm font-semibold">
                🎉 Welcome to {tournament.title}!
              </p>
              <p className="text-white/60 text-xs mt-1">
                You will receive room details before the tournament starts
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TournamentPayment;