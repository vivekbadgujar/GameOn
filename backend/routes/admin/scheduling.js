const express = require('express');
const router = express.Router();

// Get Scheduled Events
router.get('/', async (req, res) => {
  try {
    // Mock data for scheduled events
    const scheduledEvents = [
      {
        id: 1,
        title: 'BGMI Championship',
        type: 'tournament',
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'scheduled',
        description: 'Monthly BGMI tournament'
      },
      {
        id: 2,
        title: 'System Maintenance',
        type: 'maintenance',
        scheduledDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        status: 'scheduled',
        description: 'Regular system maintenance'
      }
    ];

    res.json({
      success: true,
      data: scheduledEvents
    });

  } catch (error) {
    console.error('Scheduled events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled events'
    });
  }
});

// Create Scheduled Event
router.post('/', async (req, res) => {
  try {
    const { title, type, scheduledDate, description } = req.body;

    // Mock creation - replace with actual database save
    const newEvent = {
      id: Date.now(),
      title,
      type,
      scheduledDate,
      status: 'scheduled',
      description
    };

    res.json({
      success: true,
      data: newEvent
    });

  } catch (error) {
    console.error('Create scheduled event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scheduled event'
    });
  }
});

// Update Scheduled Event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Mock update - replace with actual database update
    const updatedEvent = {
      id: parseInt(id),
      ...updates
    };

    res.json({
      success: true,
      data: updatedEvent
    });

  } catch (error) {
    console.error('Update scheduled event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scheduled event'
    });
  }
});

// Delete Scheduled Event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Mock deletion - replace with actual database delete
    res.json({
      success: true,
      message: 'Scheduled event deleted successfully'
    });

  } catch (error) {
    console.error('Delete scheduled event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled event'
    });
  }
});

module.exports = router; 