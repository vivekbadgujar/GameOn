require('./config/loadEnv')();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/gameon';
console.log('Connecting to', MONGODB_URI.substring(0, 20) + '...');

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.db;
    
    const roomSlots = await db.collection('roomslots').find({}).toArray();
    if(roomSlots.length === 0) {
      console.log('No roomslots found');
      process.exit(0);
    }
    
    // find a room slot with players
    const room = roomSlots.find(r => r.totalPlayers > 0) || roomSlots[0];
    const tournamentId = room.tournament;
    
    console.log('--- RAW MONGODB ROOM DOCUMENT ---');
    console.log(JSON.stringify({
      _id: room._id,
      tournament: room.tournament,
      totalPlayers: room.totalPlayers,
      teamsCount: room.teams?.length
    }, null, 2));

    const tournament = await db.collection('tournaments').findOne({ _id: tournamentId });
    console.log('\n--- RAW TOURNAMENT DOCUMENT ---');
    console.log(JSON.stringify({
      _id: tournament?._id,
      title: tournament?.title,
      participantsCount: tournament?.participants?.length
    }, null, 2));

    console.log('\n--- RAW PARTICIPANTS ARRAY ---');
    console.log(JSON.stringify(tournament?.participants, null, 2));

    console.log('\n--- SLOTS DISTRIBUTION ---');
    let dbOccupiedCount = 0;
    
    const userIds = [];
    room.teams?.forEach(t => t.slots?.forEach(s => {
      if(s.player) userIds.push(s.player);
    }));
    
    const users = await db.collection('users').find({ _id: { $in: userIds } }).toArray();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u.username || u.displayName || 'Unknown';
    });
    
    room.teams?.forEach(t => {
      t.slots?.forEach(s => {
        let playerName = 'null';
        let playerId = 'null';
        if (s.player) {
          dbOccupiedCount++;
          playerId = s.player.toString();
          playerName = userMap[playerId] || 'Unknown User';
        }
        console.log(`Team${t.teamNumber} Slot${s.slotNumber} -> playerId=${playerId} playerName=${playerName}`);
      });
    });

    console.log(`\nDB Total occupied: ${dbOccupiedCount}`);
    
    console.log('\n--- RAW TEAM 1 ---');
    console.log(JSON.stringify(room.teams?.[0], null, 2));

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
