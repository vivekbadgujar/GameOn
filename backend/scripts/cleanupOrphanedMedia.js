/**
 * Cleanup Orphaned Media Script
 * 
 * Removes old/stale media records that appear on frontend Videos & Gallery
 * but are no longer managed via the Admin Panel.
 * 
 * Run: node scripts/cleanupOrphanedMedia.js
 * 
 * This script:
 * 1. Finds all Media records in the database
 * 2. Marks any record NOT explicitly managed by admin (no uploadedBy or deleted admin) as archived
 * 3. Marks TournamentVideos with no valid tournament reference as invisible
 */

require('../config/loadEnv')();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI not set');
  process.exit(1);
}

const Media = require('../models/Media');
const TournamentVideo = require('../models/TournamentVideo');
const Admin = require('../models/Admin');

async function cleanupOrphanedMedia() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4
  });
  console.log('Connected.');

  // ─── Step 1: Find all admin IDs ─────────────────────────────────────
  const adminIds = (await Admin.find({}).select('_id').lean()).map(a => a._id.toString());
  console.log(`Found ${adminIds.length} admin(s).`);

  // ─── Step 2: Find media with no valid admin uploader ─────────────────
  const allMedia = await Media.find({ status: 'active' }).lean();
  console.log(`Found ${allMedia.length} active media records.`);

  let archivedCount = 0;
  for (const m of allMedia) {
    const uploaderId = m.uploadedBy?.toString();
    const hasValidUploader = uploaderId && adminIds.includes(uploaderId);

    if (!hasValidUploader) {
      await Media.findByIdAndUpdate(m._id, {
        status: 'archived',
        isVisible: false,
        isPublic: false
      });
      archivedCount++;
      console.log(`Archived orphaned media: "${m.title}" (${m._id})`);
    }
  }
  console.log(`Archived ${archivedCount} orphaned media record(s).`);

  // ─── Step 3: Hide TournamentVideos without valid tournament ───────────
  const Tournament = require('../models/Tournament');
  const tournamentIds = (await Tournament.find({}).select('_id').lean()).map(t => t._id.toString());

  const allVideos = await TournamentVideo.find({ isVisible: true }).lean();
  console.log(`Found ${allVideos.length} visible tournament video(s).`);

  let hiddenVideoCount = 0;
  for (const v of allVideos) {
    if (v.tournament) {
      const refId = v.tournament.toString();
      if (!tournamentIds.includes(refId)) {
        await TournamentVideo.findByIdAndUpdate(v._id, { isVisible: false });
        hiddenVideoCount++;
        console.log(`Hidden orphaned TournamentVideo: "${v.title}" (${v._id})`);
      }
    }
  }
  console.log(`Hidden ${hiddenVideoCount} orphaned tournament video(s).`);

  // ─── Done ─────────────────────────────────────────────────────────────
  console.log('\n✅ Cleanup complete.');
  console.log(`Total archived media: ${archivedCount}`);
  console.log(`Total hidden videos: ${hiddenVideoCount}`);

  await mongoose.connection.close();
  process.exit(0);
}

cleanupOrphanedMedia().catch(err => {
  console.error('Cleanup failed:', err);
  mongoose.connection.close();
  process.exit(1);
});
