const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tournament = require('../../models/Tournament');
const Notification = require('../../models/Notification');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Get Scheduled Events
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    // Get scheduled tournaments
    const tournaments = await Tournament.find({
      ...query,
      status: 'upcoming',
      scheduledAt: { $gte: new Date() }
    })
    .sort({ scheduledAt: 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('createdBy', 'username email');

    // Get scheduled notifications
    const notifications = await Notification.find({
      ...query,
      type: 'scheduled',
      scheduledAt: { $gte: new Date() }
    })
    .sort({ scheduledAt: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Combine and format results
    const scheduledEvents = [
      ...tournaments.map(t => ({
        id: t._id,
        title: t.title,
        type: 'tournament',
        scheduledDate: t.scheduledAt,
        status: t.status,
        description: t.description,
        participants: t.currentParticipants || 0,
        maxParticipants: t.maxParticipants,
        prizePool: t.prizePool,
        entryFee: t.entryFee,
        teamType: t.teamType,
        map: t.map,
        createdBy: t.createdBy?.username
      })),
      ...notifications.map(n => ({
        id: n._id,
        title: n.title,
        type: 'notification',
        scheduledDate: n.scheduledAt,
        status: n.status,
        description: n.message,
        targetAudience: n.targetAudience,
        priority: n.priority
      }))
    ].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    // Get total count
    const totalTournaments = await Tournament.countDocuments({
      ...query,
      status: 'upcoming',
      scheduledAt: { $gte: new Date() }
    });

    const totalNotifications = await Notification.countDocuments({
      ...query,
      type: 'scheduled',
      scheduledAt: { $gte: new Date() }
    });

    const total = totalTournaments + totalNotifications;

    res.json({
      success: true,
      data: scheduledEvents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Scheduled events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled events',
      error: error.message
    });
  }
});

// Create Scheduled Event
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, type, scheduledDate, description, additionalData } = req.body;
    const adminId = req.admin._id;

    let newEvent;

    if (type === 'tournament') {
      // Create scheduled tournament
      newEvent = new Tournament({
        title,
        description,
        scheduledAt: new Date(scheduledDate),
        status: 'upcoming',
        createdBy: adminId,
        ...additionalData
      });

      await newEvent.save();

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('tournamentAdded', {
          type: 'tournamentAdded',
          data: newEvent
        });
      }

    } else if (type === 'notification') {
      // Create scheduled notification
      newEvent = new Notification({
        title,
        message: description,
        type: 'scheduled',
        scheduledAt: new Date(scheduledDate),
        status: 'scheduled',
        createdBy: adminId,
        ...additionalData
      });

      await newEvent.save();

      // Emit socket event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('broadcastScheduled', {
          type: 'broadcastScheduled',
          data: newEvent
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type'
      });
    }

    res.json({
      success: true,
      message: 'Scheduled event created successfully',
      data: newEvent
    });

  } catch (error) {
    console.error('Create scheduled event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheduled event',
      error: error.message
    });
  }
});

// Update Scheduled Event
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const adminId = req.admin._id;

    let updatedEvent;

    // Try to update tournament first
    updatedEvent = await Tournament.findByIdAndUpdate(
      id,
      { ...updates, updatedBy: adminId },
      { new: true }
    ).populate('createdBy', 'username email');

    if (!updatedEvent) {
      // Try to update notification
      updatedEvent = await Notification.findByIdAndUpdate(
        id,
        { ...updates, updatedBy: adminId },
        { new: true }
      );
    }

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled event not found'
      });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      if (updatedEvent.schema.obj.hasOwnProperty('prizePool')) {
        // It's a tournament
        io.emit('tournamentUpdated', {
          type: 'tournamentUpdated',
          data: updatedEvent
        });
      } else {
        // It's a notification
        io.emit('broadcastScheduled', {
          type: 'broadcastScheduled',
          data: updatedEvent
        });
      }
    }

    res.json({
      success: true,
      message: 'Scheduled event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Update scheduled event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled event',
      error: error.message
    });
  }
});

// Delete Scheduled Event
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    let deletedEvent;

    // Try to delete tournament first
    deletedEvent = await Tournament.findByIdAndDelete(id);

    if (!deletedEvent) {
      // Try to delete notification
      deletedEvent = await Notification.findByIdAndDelete(id);
    }

    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled event not found'
      });
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      if (deletedEvent.schema.obj.hasOwnProperty('prizePool')) {
        // It was a tournament
        io.emit('tournamentDeleted', {
          type: 'tournamentDeleted',
          data: id
        });
      } else {
        // It was a notification
        io.emit('broadcastDeleted', {
          type: 'broadcastDeleted',
          data: id
        });
      }
    }

    res.json({
      success: true,
      message: 'Scheduled event deleted successfully'
    });

  } catch (error) {
    console.error('Delete scheduled event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled event',
      error: error.message
    });
  }
});

// Get upcoming events count
router.get('/count', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [next24hTournaments, next7dTournaments, next24hNotifications, next7dNotifications] = await Promise.all([
      Tournament.countDocuments({
        status: 'upcoming',
        scheduledAt: { $gte: now, $lte: next24Hours }
      }),
      Tournament.countDocuments({
        status: 'upcoming',
        scheduledAt: { $gte: now, $lte: next7Days }
      }),
      Notification.countDocuments({
        type: 'scheduled',
        scheduledAt: { $gte: now, $lte: next24Hours }
      }),
      Notification.countDocuments({
        type: 'scheduled',
        scheduledAt: { $gte: now, $lte: next7Days }
      })
    ]);

    res.json({
      success: true,
      data: {
        next24Hours: {
          tournaments: next24hTournaments,
          notifications: next24hNotifications,
          total: next24hTournaments + next24hNotifications
        },
        next7Days: {
          tournaments: next7dTournaments,
          notifications: next7dNotifications,
          total: next7dTournaments + next7dNotifications
        }
      }
    });

  } catch (error) {
    console.error('Get upcoming events count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get upcoming events count',
      error: error.message
    });
  }
});

module.exports = router; 