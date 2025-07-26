const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Transaction = require('../../models/Transaction');
const Notification = require('../../models/Notification');
const AIFlag = require('../../models/AIFlag');
const Media = require('../../models/Media');
const { authenticateAdmin } = require('../../middleware/adminAuth');
const csv = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs').promises;

// Export data endpoint
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { type, format, dateRange, filters } = req.body;
    const adminId = req.admin._id;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Export type is required'
      });
    }

    let query = {};
    let data = [];
    let recordCount = 0;

    // Apply date range filter
    if (dateRange && dateRange.start && dateRange.end) {
      query.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    // Apply additional filters
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          query[key] = filters[key];
        }
      });
    }

    // Fetch data based on type
    switch (type) {
      case 'users':
        data = await User.find(query).select('-password -otp -otpExpiry');
        recordCount = data.length;
        break;
      
      case 'tournaments':
        data = await Tournament.find(query).populate('createdBy', 'username email');
        recordCount = data.length;
        break;
      
      case 'transactions':
        data = await Transaction.find(query).populate('userId', 'username email');
        recordCount = data.length;
        break;
      
      case 'notifications':
        data = await Notification.find(query);
        recordCount = data.length;
        break;
      
      case 'ai_flags':
        data = await AIFlag.find(query).populate('userId', 'username email');
        recordCount = data.length;
        break;
      
      case 'media':
        data = await Media.find(query).populate('uploadedBy', 'username email');
        recordCount = data.length;
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    // Create export record
    const exportRecord = {
      type,
      format: format || 'csv',
      requestedBy: adminId,
      requestedAt: new Date(),
      status: 'processing',
      recordCount,
      filters: { dateRange, filters }
    };

    // Generate file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}_${timestamp}.${format || 'csv'}`;
    const filepath = path.join(__dirname, '../../exports', filename);

    // Ensure exports directory exists
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    if (format === 'json') {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    } else {
      // CSV format
      const csvWriter = csv({
        path: filepath,
        header: Object.keys(data[0] || {}).map(key => ({ id: key, title: key }))
      });
      await csvWriter.writeRecords(data);
    }

    // Update export record
    exportRecord.status = 'completed';
    exportRecord.downloadUrl = `/api/admin/export/download/${filename}`;
    exportRecord.filename = filename;

    // Save to database (you might want to create an Export model)
    // For now, we'll store in memory and emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('exportCompleted', {
        type: 'exportCompleted',
        data: exportRecord
      });
    }

    res.json({
      success: true,
      message: 'Export completed successfully',
      data: exportRecord
    });

  } catch (error) {
    console.error('Error creating export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create export'
    });
  }
});

// Get export statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      tournaments: await Tournament.countDocuments(),
      transactions: await Transaction.countDocuments(),
      notifications: await Notification.countDocuments(),
      aiFlags: await AIFlag.countDocuments(),
      media: await Media.countDocuments()
    };

    // Recent activity
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const recentTournaments = await Tournament.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const recentTransactions = await Transaction.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        total: stats,
        recent: {
          users: recentUsers,
          tournaments: recentTournaments,
          transactions: recentTransactions
        }
      }
    });

  } catch (error) {
    console.error('Error fetching export stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch export statistics'
    });
  }
});

// Get data preview
router.get('/preview/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10, filters } = req.query;

    let query = {};
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          query[key] = filters[key];
        }
      });
    }

    let data = [];
    let totalCount = 0;

    switch (type) {
      case 'users':
        data = await User.find(query).select('-password -otp -otpExpiry').limit(parseInt(limit));
        totalCount = await User.countDocuments(query);
        break;
      
      case 'tournaments':
        data = await Tournament.find(query).populate('createdBy', 'username email').limit(parseInt(limit));
        totalCount = await Tournament.countDocuments(query);
        break;
      
      case 'transactions':
        data = await Transaction.find(query).populate('userId', 'username email').limit(parseInt(limit));
        totalCount = await Transaction.countDocuments(query);
        break;
      
      case 'notifications':
        data = await Notification.find(query).limit(parseInt(limit));
        totalCount = await Notification.countDocuments(query);
        break;
      
      case 'ai_flags':
        data = await AIFlag.find(query).populate('userId', 'username email').limit(parseInt(limit));
        totalCount = await AIFlag.countDocuments(query);
        break;
      
      case 'media':
        data = await Media.find(query).populate('uploadedBy', 'username email').limit(parseInt(limit));
        totalCount = await Media.countDocuments(query);
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid data type'
        });
    }

    res.json({
      success: true,
      data: {
        records: data,
        totalCount,
        previewCount: data.length
      }
    });

  } catch (error) {
    console.error('Error fetching data preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch data preview'
    });
  }
});

// Download export file
router.get('/download/:filename', authenticateAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../../exports', filename);

    // Check if file exists
    try {
      await fs.access(filepath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Export file not found'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = require('fs').createReadStream(filepath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading export:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download export'
    });
  }
});

module.exports = router; 