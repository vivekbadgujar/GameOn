const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gameon';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    const roomSlots = await db.collection('roomslots').find({}).toArray();
    console.log('Found roomslots:', roomSlots.length);
    if(roomSlots.length > 0) {
      console.log('First roomslot id:', roomSlots[0]._id);
      console.log('Teams count:', roomSlots[0].teams?.length);
      const team1 = roomSlots[0].teams?.[0];
      console.log('Team 1 slots:', JSON.stringify(team1?.slots, null, 2));
      
      let occupiedCount = 0;
      let uniquePlayers = new Set();
      roomSlots[0].teams?.forEach(t => t.slots?.forEach(s => {
        if(s.player) {
          occupiedCount++;
          uniquePlayers.add(s.player.toString());
        }
      }));
      console.log(`DB Total occupied: ${occupiedCount}, Unique players: ${uniquePlayers.size}`);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
