require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');

async function migrateTournamentStatus() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://gameon:Gameon321@cluster0.g2bfczw.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const tournaments = await Tournament.find({});
    let updatedCount = 0;

    for (let tournament of tournaments) {
      let isModified = false;

      // Migrate 'active' -> 'registration_open' or 'live'
      if (tournament.status === 'active') {
        const now = new Date();
        if (tournament.startDate <= now) {
          tournament.status = 'live';
        } else {
          tournament.status = 'registration_open';
        }
        isModified = true;
      }

      // 'completed', 'live', 'upcoming', 'cancelled' map directly.
      // We don't have 'archived' in the old set.

      if (isModified) {
        await tournament.save();
        updatedCount++;
        console.log(`Migrated tournament ${tournament._id} to status: ${tournament.status}`);
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} tournaments.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateTournamentStatus();
