/**
 * Tournament Management Helper Functions
 * Handles tournament updates and notifications across platforms
 */

const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create tournament notification
const createTournamentNotification = async (tournament, type, recipients = null) => {
  try {
    const notificationData = {
      title: '',
      message: '',
      type: 'tournament',
      tournament: tournament._id,
      createdBy: 'system'
    };

    switch (type) {
      case 'created':
        notificationData.title = `New Tournament: ${tournament.title}`;
        notificationData.message = `A new ${tournament.game} tournament has been created with ₹${tournament.prizePool} prize pool!`;
        break;
      case 'updated':
        notificationData.title = `Tournament Updated: ${tournament.title}`;
        notificationData.message = `Tournament details have been updated. Check for changes in prize pool or schedule.`;
        break;
      case 'starting_soon':
        notificationData.title = `Tournament Starting Soon: ${tournament.title}`;
        notificationData.message = `Your tournament is starting in 30 minutes! Get ready.`;
        break;
      case 'cancelled':
        notificationData.title = `Tournament Cancelled: ${tournament.title}`;
        notificationData.message = `This tournament has been cancelled. Refunds will be processed.`;
        break;
      case 'completed':
        notificationData.title = `Tournament Completed: ${tournament.title}`;
        notificationData.message = `Tournament has been completed. Winners have been announced.`;
        break;
      default:
        return null;
    }

    // Create notification
    const notification = new Notification(notificationData);
    await notification.save();

    // If specific recipients provided, add them
    if (recipients && Array.isArray(recipients)) {
      notification.recipients = recipients;
      await notification.save();
    }

    return notification;
  } catch (error) {
    console.error('Error creating tournament notification:', error);
    return null;
  }
};

// Get tournament participants for notifications
const getTournamentParticipants = async (tournamentId) => {
  try {
    const tournament = await Tournament.findById(tournamentId)
      .populate('participants.user', 'username email pushTokens')
      .lean();
    
    if (!tournament) return [];

    return tournament.participants
      .filter(p => p.user && p.user.email)
      .map(p => ({
        userId: p.user._id,
        username: p.user.username,
        email: p.user.email,
        pushTokens: p.user.pushTokens || []
      }));
  } catch (error) {
    console.error('Error getting tournament participants:', error);
    return [];
  }
};

// Update tournament and handle notifications
const updateTournamentWithNotifications = async (tournamentId, updateData, io = null) => {
  try {
    const oldTournament = await Tournament.findById(tournamentId);
    if (!oldTournament) {
      throw new Error('Tournament not found');
    }

    // Update tournament
    const updatedTournament = await Tournament.findByIdAndUpdate(
      tournamentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('participants.user', 'username email');

    // Determine what changed
    const changes = [];
    if (updateData.prizePool && updateData.prizePool !== oldTournament.prizePool) {
      changes.push('prizePool');
    }
    if (updateData.startDate && new Date(updateData.startDate).getTime() !== new Date(oldTournament.startDate).getTime()) {
      changes.push('startDate');
    }
    if (updateData.status && updateData.status !== oldTournament.status) {
      changes.push('status');
    }

    // Create notifications for significant changes
    if (changes.length > 0) {
      const participants = await getTournamentParticipants(tournamentId);
      const recipientIds = participants.map(p => p.userId);

      // Create notification
      await createTournamentNotification(updatedTournament, 'updated', recipientIds);

      // Send real-time updates via Socket.IO if available
      if (io) {
        // Notify admin panel
        io.to('admin_room').emit('tournament_updated', {
          tournament: updatedTournament,
          changes: changes,
          timestamp: new Date()
        });

        // Notify participants
        participants.forEach(participant => {
          io.to(`user_${participant.userId}`).emit('tournament_updated', {
            tournament: updatedTournament,
            changes: changes,
            timestamp: new Date()
          });
        });
      }
    }

    return updatedTournament;
  } catch (error) {
    console.error('Error updating tournament with notifications:', error);
    throw error;
  }
};

// Handle tournament status changes
const handleTournamentStatusChange = async (tournamentId, newStatus, io = null) => {
  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const oldStatus = tournament.status;
    
    if (oldStatus === newStatus) {
      return tournament; // No change needed
    }

    // Update status
    tournament.status = newStatus;
    await tournament.save();

    // Get participants
    const participants = await getTournamentParticipants(tournamentId);
    const recipientIds = participants.map(p => p.userId);

    // Create appropriate notification
    let notificationType = null;
    switch (newStatus) {
      case 'live':
        notificationType = 'starting_soon';
        break;
      case 'completed':
        notificationType = 'completed';
        break;
      case 'cancelled':
        notificationType = 'cancelled';
        break;
    }

    if (notificationType) {
      await createTournamentNotification(tournament, notificationType, recipientIds);
    }

    // Send real-time updates
    if (io) {
      // Notify admin panel
      io.to('admin_room').emit('tournament_status_changed', {
        tournamentId: tournament._id,
        oldStatus: oldStatus,
        newStatus: newStatus,
        tournament: tournament,
        timestamp: new Date()
      });

      // Notify participants
      participants.forEach(participant => {
        io.to(`user_${participant.userId}`).emit('tournament_status_changed', {
          tournamentId: tournament._id,
          oldStatus: oldStatus,
          newStatus: newStatus,
          tournament: tournament,
          timestamp: new Date()
        });
      });
    }

    return tournament;
  } catch (error) {
    console.error('Error handling tournament status change:', error);
    throw error;
  }
};

module.exports = {
  createTournamentNotification,
  getTournamentParticipants,
  updateTournamentWithNotifications,
  handleTournamentStatusChange
};
