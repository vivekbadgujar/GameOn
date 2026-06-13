const cron = require('node-cron');
const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const RoomSlot = require('../models/RoomSlot');

function startCronJobs(io) {
  console.log('[Cron] Starting tournament lifecycle cron jobs...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // 1. Close Registration & Lock Slots (30 mins before start)
      const lockThreshold = new Date(now.getTime() + 30 * 60 * 1000);
      
      const closingTournaments = await Tournament.find({
        status: { $in: ['upcoming', 'registration_open'] },
        startDate: { $lte: lockThreshold }
      });

      for (const tournament of closingTournaments) {
        tournament.status = 'registration_closed';
        await tournament.save();

        // Lock RoomSlots
        const roomSlot = await RoomSlot.findOne({ tournament: tournament._id });
        if (roomSlot) {
          roomSlot.isLocked = true;
          await roomSlot.save();
        }

        console.log(`[Cron] Tournament ${tournament._id} registration closed and slots locked.`);
        
        if (io) {
          io.emit('tournamentUpdated', {
            type: 'tournamentUpdated',
            data: tournament
          });
          io.to(`tournament_${tournament._id}`).emit('slotsLocked', {
            tournamentId: tournament._id,
            action: 'lock',
            roomSlot
          });
        }
      }

      // 2. Set to Live (When start time passes)
      const liveTournaments = await Tournament.find({
        status: 'registration_closed',
        startDate: { $lte: now }
      });

      for (const tournament of liveTournaments) {
        tournament.status = 'live';
        await tournament.save();

        console.log(`[Cron] Tournament ${tournament._id} is now LIVE.`);
        
        if (io) {
          io.emit('tournamentUpdated', {
            type: 'tournamentUpdated',
            data: tournament
          });
        }
      }
      
    } catch (error) {
      console.error('[Cron] Error running tournament lifecycle cron:', error);
    }
  });
}

module.exports = { startCronJobs };
