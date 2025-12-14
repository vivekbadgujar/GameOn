// ... existing code ...

// Check tournament join payment options (wallet balance vs Razorpay)
router.post('/check-tournament-payment',
  authenticateToken,
  [
    body('tournamentId').notEmpty().withMessage('Tournament ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { tournamentId } = req.body;
      const userId = req.user._id;

      // Get tournament
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      // Check if already joined
      const hasJoined = tournament.participants.some(p => 
        p.user.toString() === userId.toString()
      );

      if (hasJoined) {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this tournament'
        });
      }

      // Get wallet balance
      const walletBalance = await WalletService.getBalance(userId);
      const entryFee = tournament.entryFee;
      const topUpNeeded = Math.max(0, entryFee - walletBalance);

      // Determine payment options
      const canUseWallet = walletBalance >= entryFee;
      const needsTopUp = topUpNeeded > 0;

      res.json({
        success: true,
        data: {
          tournamentId: tournament._id,
          entryFee: entryFee,
          walletBalance: walletBalance,
          topUpNeeded: topUpNeeded,
          canUseWallet: canUseWallet,
          needsTopUp: needsTopUp,
          paymentOptions: {
            useWallet: canUseWallet,
            addFunds: needsTopUp,
            addRemainingAndJoin: needsTopUp && walletBalance > 0
          }
        }
      });

    } catch (error) {
      console.error('Check tournament payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check tournament payment options'
      });
    }
  }
);

// Create tournament join payment order (handles wallet + Razorpay)
router.post('/create-tournament-join-order',
  paymentLimiter,
  authenticateToken,
  [
    body('tournamentId').notEmpty().withMessage('Tournament ID is required'),
    body('paymentMethod').isIn(['wallet', 'razorpay', 'wallet_and_razorpay']).withMessage('Invalid payment method')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { tournamentId, paymentMethod } = req.body;
      const userId = req.user._id;

      // Get tournament
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      if (tournament.status !== 'upcoming') {
        return res.status(400).json({
          success: false,
          message: 'Tournament registration is closed'
        });
      }

      // Check if already joined
      const hasJoined = tournament.participants.some(p => 
        p.user.toString() === userId.toString()
      );

      if (hasJoined) {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this tournament'
        });
      }

      // Check if tournament is full
      if (tournament.currentParticipants >= tournament.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Tournament is full'
        });
      }

      const entryFee = tournament.entryFee;
      const walletBalance = await WalletService.getBalance(userId);

      // Handle wallet-only payment
      if (paymentMethod === 'wallet') {
        if (walletBalance < entryFee) {
          return res.status(400).json({
            success: false,
            message: `Insufficient wallet balance. Required: ₹${entryFee}, Available: ₹${walletBalance}`
          });
        }

        // Deduct from wallet
        const deductResult = await WalletService.deductFromWallet(
          userId,
          entryFee,
          'tournament_entry',
          {
            description: `Tournament entry fee - ${tournament.title}`,
            tournamentId: tournamentId
          }
        );

        // Join tournament immediately
        const slotNumber = tournament.currentParticipants + 1;
        tournament.participants.push({
          user: userId,
          joinedAt: new Date(),
          slotNumber: slotNumber,
          paymentStatus: 'completed',
          paymentData: {
            method: 'wallet',
            transactionId: deductResult.transaction.transactionId
          }
        });
        tournament.currentParticipants += 1;
        await tournament.save();

        res.json({
          success: true,
          message: 'Tournament joined successfully using wallet',
          data: {
            tournamentId: tournament._id,
            slotNumber: slotNumber,
            paymentMethod: 'wallet',
            newBalance: deductResult.newBalance,
            transactionId: deductResult.transaction._id
          }
        });
        return;
      }

      // Handle Razorpay payment (full amount or remaining)
      if (paymentMethod === 'razorpay' || paymentMethod === 'wallet_and_razorpay') {
        let razorpayAmount = entryFee;

        // If using wallet + Razorpay, deduct wallet balance first
        if (paymentMethod === 'wallet_and_razorpay' && walletBalance > 0) {
          const walletToUse = Math.min(walletBalance, entryFee);
          razorpayAmount = entryFee - walletToUse;

          // Deduct wallet portion
          await WalletService.deductFromWallet(
            userId,
            walletToUse,
            'tournament_entry',
            {
              description: `Tournament entry fee (wallet portion) - ${tournament.title}`,
              tournamentId: tournamentId
            }
          );
        }

        if (!razorpay) {
          return res.status(503).json({
            success: false,
            message: 'Payment service is currently unavailable'
          });
        }

        // Create Razorpay order for remaining amount
        const order = await razorpay.orders.create({
          amount: razorpayAmount * 100, // Convert to paise
          currency: 'INR',
          receipt: `tournament_${tournamentId}_${userId}_${Date.now()}`,
          notes: {
            tournamentId: tournamentId.toString(),
            userId: userId.toString(),
            type: 'tournament_entry',
            paymentMethod: paymentMethod
          }
        });

        // Create pending transaction record
        const transaction = new Transaction({
          user: userId,
          transactionId: Transaction.generateTransactionId(),
          amount: razorpayAmount,
          type: 'tournament_entry',
          status: 'pending',
          currency: 'INR',
          description: `Tournament entry fee - ${tournament.title}`,
          tournament: tournamentId,
          razorpayOrderId: order.id,
          paymentGateway: {
            provider: 'razorpay',
            gatewayOrderId: order.id
          },
          metadata: {
            entryFee: entryFee,
            walletBalanceUsed: paymentMethod === 'wallet_and_razorpay' ? Math.min(walletBalance, entryFee) : 0,
            paymentMethod: paymentMethod
          }
        });

        await transaction.save();

        res.json({
          success: true,
          message: 'Payment order created successfully',
          data: {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            razorpayAmount: razorpayAmount,
            paymentMethod: paymentMethod,
            entryFee: entryFee
          }
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });

    } catch (error) {
      console.error('Create tournament join order error:', error);
      const statusCode = error.message.includes('Insufficient') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Failed to create tournament join order'
      });
    }
  }
);

// ... existing code ...
