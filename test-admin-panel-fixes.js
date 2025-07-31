/**
 * Test Admin Panel Fixes
 * Comprehensive test for the admin panel analytics and game distribution fixes
 */

const mongoose = require('mongoose');
const Tournament = require('./backend/models/Tournament');
const User = require('./backend/models/User');
const Transaction = require('./backend/models/Transaction');
require('dotenv').config();

async function createTestData() {
  try {
    console.log('🔧 Creating test data for analytics...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test users
    const testUsers = [];
    for (let i = 1; i <= 10; i++) {
      const user = new User({
        username: `testuser${i}`,
        email: `testuser${i}@example.com`,
        password: 'hashedpassword',
        displayName: `Test User ${i}`,
        security: {
          lastLogin: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random login within last 24 hours
        }
      });
      testUsers.push(await user.save());
    }
    console.log(`✅ Created ${testUsers.length} test users`);

    // Create test tournaments with different games
    const games = ['BGMI', 'PUBG', 'Free Fire', 'Valorant', 'COD'];
    const testTournaments = [];
    
    for (let i = 1; i <= 20; i++) {
      const game = games[Math.floor(Math.random() * games.length)];
      const status = ['upcoming', 'live', 'completed'][Math.floor(Math.random() * 3)];
      const participants = Math.floor(Math.random() * 50) + 10;
      
      const tournament = new Tournament({
        title: `${game} Tournament ${i}`,
        description: `Test tournament for ${game}`,
        game: game,
        map: 'Test Map',
        tournamentType: 'squad',
        entryFee: Math.floor(Math.random() * 500) + 100,
        prizePool: Math.floor(Math.random() * 10000) + 5000,
        maxParticipants: participants + 20,
        currentParticipants: participants,
        startDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000),
        status: status,
        isVisible: true,
        isPublic: true,
        rules: ['No cheating', 'Fair play'],
        roomDetails: {
          roomId: `ROOM${i}`,
          password: `PASS${i}`
        },
        participants: testUsers.slice(0, Math.min(participants, testUsers.length)).map(user => ({
          user: user._id,
          joinedAt: new Date()
        })),
        winners: status === 'completed' ? [testUsers[0]._id] : []
      });
      
      testTournaments.push(await tournament.save());
    }
    console.log(`✅ Created ${testTournaments.length} test tournaments`);

    // Create test transactions
    const testTransactions = [];
    for (let i = 0; i < 30; i++) {
      const tournament = testTournaments[Math.floor(Math.random() * testTournaments.length)];
      const user = testUsers[Math.floor(Math.random() * testUsers.length)];
      
      const transaction = new Transaction({
        user: user._id,
        tournament: tournament._id,
        type: 'tournament_entry',
        amount: tournament.entryFee,
        status: 'completed',
        description: `Entry fee for ${tournament.title}`
      });
      
      testTransactions.push(await transaction.save());
    }
    console.log(`✅ Created ${testTransactions.length} test transactions`);

    // Display game distribution
    const gameDistribution = await Tournament.aggregate([
      { $group: { _id: '$game', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🎮 Game Distribution:');
    const totalTournaments = gameDistribution.reduce((sum, game) => sum + game.count, 0);
    gameDistribution.forEach(game => {
      const percentage = Math.round((game.count / totalTournaments) * 100);
      console.log(`   - ${game._id}: ${percentage}% (${game.count} tournaments)`);
    });

    // Display analytics summary
    console.log('\n📊 Analytics Summary:');
    console.log(`   - Total Users: ${testUsers.length}`);
    console.log(`   - Total Tournaments: ${testTournaments.length}`);
    console.log(`   - Active Tournaments: ${testTournaments.filter(t => t.status === 'upcoming' || t.status === 'live').length}`);
    console.log(`   - Completed Tournaments: ${testTournaments.filter(t => t.status === 'completed').length}`);
    console.log(`   - Total Transactions: ${testTransactions.length}`);
    console.log(`   - Total Revenue: ₹${testTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}`);

    console.log('\n✅ Test data created successfully!');
    console.log('🚀 You can now test the admin panel analytics with real data');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

async function testAnalyticsQueries() {
  try {
    console.log('\n🧪 Testing analytics queries...\n');

    await mongoose.connect(process.env.MONGODB_URI);

    // Test game distribution query
    const gameDistribution = await Tournament.aggregate([
      { $group: { _id: '$game', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('🎮 Game Distribution Query Result:');
    console.log(JSON.stringify(gameDistribution, null, 2));

    // Test user statistics
    const totalUsers = await User.countDocuments();
    const activeUsersToday = await User.countDocuments({
      'security.lastLogin': { 
        $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
      }
    });

    console.log('\n👥 User Statistics:');
    console.log(`   - Total Users: ${totalUsers}`);
    console.log(`   - Active Users Today: ${activeUsersToday}`);

    // Test tournament statistics
    const totalTournaments = await Tournament.countDocuments();
    const activeTournaments = await Tournament.countDocuments({ 
      status: { $in: ['upcoming', 'live'] } 
    });

    console.log('\n🏆 Tournament Statistics:');
    console.log(`   - Total Tournaments: ${totalTournaments}`);
    console.log(`   - Active Tournaments: ${activeTournaments}`);

    // Test revenue statistics
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'tournament_entry' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log('\n💰 Revenue Statistics:');
    console.log(`   - Total Revenue: ₹${(totalRevenue[0]?.total || 0).toLocaleString()}`);

    console.log('\n✅ Analytics queries test completed!');

  } catch (error) {
    console.error('❌ Error testing analytics queries:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-data')) {
    await createTestData();
  }
  
  if (args.includes('--test-queries')) {
    await testAnalyticsQueries();
  }
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node test-admin-panel-fixes.js --create-data    # Create test data');
    console.log('  node test-admin-panel-fixes.js --test-queries   # Test analytics queries');
    console.log('  node test-admin-panel-fixes.js --create-data --test-queries  # Both');
  }
}

main();