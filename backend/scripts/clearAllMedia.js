/**
 * clearAllMedia.js
 * 
 * Production cleanup script — permanently removes ALL media records from the DB.
 * Run this ONCE to purge old/orphaned gallery images and videos.
 * 
 * Usage:
 *   node backend/scripts/clearAllMedia.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Media = require('../models/Media');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error('❌ No MongoDB URI found in environment. Set MONGODB_URI in .env');
  process.exit(1);
}

async function clearAllMedia() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const totalBefore = await Media.countDocuments({});
    console.log(`📊 Total media records before cleanup: ${totalBefore}`);

    if (totalBefore === 0) {
      console.log('✅ No media records found. Database is already clean.');
      await mongoose.disconnect();
      return;
    }

    // Show breakdown by status
    const active = await Media.countDocuments({ status: 'active' });
    const archived = await Media.countDocuments({ status: 'archived' });
    const deleted = await Media.countDocuments({ status: 'deleted' });
    console.log(`   Active: ${active}, Archived: ${archived}, Deleted (soft): ${deleted}`);

    // PERMANENTLY delete all media records
    const result = await Media.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} media records permanently`);

    const totalAfter = await Media.countDocuments({});
    console.log(`📊 Total media records after cleanup: ${totalAfter}`);
    console.log('✅ Media cleanup complete — gallery is now empty');

  } catch (error) {
    console.error('❌ Error during media cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

clearAllMedia();
