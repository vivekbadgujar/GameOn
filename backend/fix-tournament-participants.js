const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
require('dotenv').config();

async function fixTournamentParticipants() {
  try {
    console.log('🔧 Fixing tournament participants with missing slotNumber...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');
    
    // Find tournaments with participants that have missing slotNumber
    const tournaments = await Tournament.find({
      'participants.slotNumber': { $exists: false }
    });
    
    console.log(`Found ${tournaments.length} tournaments with participants missing slotNumber`);
    
    let fixedCount = 0;
    
    for (const tournament of tournaments) {
      console.log(`\nFixing tournament: ${tournament.title} (${tournament._id})`);
      
      let needsUpdate = false;
      
      // Fix each participant that's missing slotNumber
      tournament.participants.forEach((participant, index) => {
        if (participant.slotNumber === undefined || participant.slotNumber === null) {
          participant.slotNumber = index + 1; // Assign sequential slot numbers
          needsUpdate = true;
          console.log(`  - Fixed participant ${index + 1}: assigned slotNumber ${participant.slotNumber}`);
        }
      });
      
      if (needsUpdate) {
        // Use updateOne to bypass validation on other fields
        await Tournament.updateOne(
          { _id: tournament._id },
          { $set: { participants: tournament.participants } }
        );
        fixedCount++;
        console.log(`  ✅ Updated tournament ${tournament.title}`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} tournaments`);
    
    // Test the fix by trying to update a tournament status
    console.log('\n🧪 Testing tournament status update after fix...');
    const testTournament = await Tournament.findOne();
    
    if (testTournament) {
      console.log(`Testing with tournament: ${testTournament.title}`);
      
      const originalStatus = testTournament.status;
      testTournament.status = 'completed';
      testTournament.endDate = new Date();
      
      await testTournament.save();
      console.log('✅ Status update test successful!');
      
      // Revert the change
      testTournament.status = originalStatus;
      testTournament.endDate = null;
      await testTournament.save();
      console.log('✅ Status reverted successfully');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

fixTournamentParticipants();