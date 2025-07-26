const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { Notification } = require('../models/Notification');
const Admin = require('../models/Admin');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSampleUsers = async () => {
  const sampleUsers = [
    {
      phone: '9876543210',
      username: 'ProGamer01',
      displayName: 'Pro Gamer',
      email: 'progamer01@example.com',
      isVerified: true,
      status: 'active',
      gameProfile: {
        bgmiId: 'BGMI123456',
        bgmiName: 'ProGamer01',
        tier: 'Ace',
        level: 45
      },
      wallet: {
        balance: 500
      },
      stats: {
        totalTournaments: 15,
        tournamentsWon: 3,
        totalEarnings: 2500,
        winRate: 20
      }
    },
    {
      phone: '9876543211',
      username: 'ElitePlayer',
      displayName: 'Elite Player',
      email: 'elite@example.com',
      isVerified: true,
      status: 'active',
      gameProfile: {
        bgmiId: 'BGMI789012',
        bgmiName: 'ElitePlayer',
        tier: 'Conqueror',
        level: 52
      },
      wallet: {
        balance: 750
      },
      stats: {
        totalTournaments: 25,
        tournamentsWon: 8,
        totalEarnings: 5000,
        winRate: 32
      }
    },
    {
      phone: '9876543212',
      username: 'SkillMaster',
      displayName: 'Skill Master',
      email: 'skillmaster@example.com',
      isVerified: true,
      status: 'active',
      gameProfile: {
        bgmiId: 'BGMI345678',
        bgmiName: 'SkillMaster',
        tier: 'Crown',
        level: 38
      },
      wallet: {
        balance: 300
      },
      stats: {
        totalTournaments: 12,
        tournamentsWon: 2,
        totalEarnings: 1200,
        winRate: 16.7
      }
    },
    {
      phone: '9876543213',
      username: 'GameChanger',
      displayName: 'Game Changer',
      email: 'gamechanger@example.com',
      isVerified: true,
      status: 'active',
      gameProfile: {
        bgmiId: 'BGMI901234',
        bgmiName: 'GameChanger',
        tier: 'Diamond',
        level: 41
      },
      wallet: {
        balance: 450
      },
      stats: {
        totalTournaments: 18,
        tournamentsWon: 4,
        totalEarnings: 1800,
        winRate: 22.2
      }
    },
    {
      phone: '9876543214',
      username: 'VictorySeeker',
      displayName: 'Victory Seeker',
      email: 'victory@example.com',
      isVerified: true,
      status: 'active',
      gameProfile: {
        bgmiId: 'BGMI567890',
        bgmiName: 'VictorySeeker',
        tier: 'Platinum',
        level: 35
      },
      wallet: {
        balance: 200
      },
      stats: {
        totalTournaments: 10,
        tournamentsWon: 1,
        totalEarnings: 600,
        winRate: 10
      }
    }
  ];

  try {
    // Clear existing users (except admin)
    await User.deleteMany({ role: { $ne: 'admin' } });
    
    // Create new users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`Created ${createdUsers.length} sample users`);
    return createdUsers;
  } catch (error) {
    console.error('Error creating sample users:', error);
    return [];
  }
};

const createSampleTournaments = async (users) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const sampleTournaments = [
    {
      title: 'BGMI Championship Series - Solo',
      description: 'Join the ultimate solo championship and prove your skills in intense BGMI battles. Winner takes all!',
      game: 'BGMI',
      map: 'Erangel',
      tournamentType: 'solo',
      maxParticipants: 100,
      currentParticipants: 45,
      entryFee: 25,
      prizePool: 2000,
      startDate: tomorrow,
      status: 'upcoming',
      rules: [
        'No teaming allowed in solo matches',
        'Third-party software prohibited',
        'Screenshots required for top 10 finishes',
        'Fair play policy strictly enforced'
      ],
      participants: users.slice(0, 3).map(user => ({
        user: user._id,
        joinedAt: new Date(),
        status: 'registered'
      })),
      createdBy: users[0]._id
    },
    {
      title: 'Friday Night Duo Showdown',
      description: 'Team up with your partner for an epic duo tournament. Coordination and skill will determine the winners!',
      game: 'BGMI',
      map: 'Sanhok',
      tournamentType: 'duo',
      maxParticipants: 50,
      currentParticipants: 32,
      entryFee: 30,
      prizePool: 1200,
      startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'upcoming',
      rules: [
        'Both team members must be registered',
        'No substitutions after registration',
        'Voice chat allowed between teammates only',
        'Screenshots required for top 5 teams'
      ],
      participants: users.slice(1, 4).map(user => ({
        user: user._id,
        joinedAt: new Date(),
        status: 'registered'
      })),
      createdBy: users[0]._id
    },
    {
      title: 'Squad Legends Tournament',
      description: 'Assemble your squad of 4 players and dominate the battlefield. Strategy and teamwork are key to victory!',
      game: 'BGMI',
      map: 'Miramar',
      tournamentType: 'squad',
      maxParticipants: 25,
      currentParticipants: 20,
      entryFee: 40,
      prizePool: 800,
      startDate: nextWeek,
      status: 'upcoming',
      rules: [
        'All 4 squad members must be registered',
        'Squad leader responsible for team coordination',
        'No player substitutions during tournament',
        'Screenshots required for top 3 squads'
      ],
      participants: users.slice(0, 4).map(user => ({
        user: user._id,
        joinedAt: new Date(),
        status: 'registered'
      })),
      createdBy: users[0]._id
    },
    {
      title: 'Quick Match Solo - Live Now!',
      description: 'Fast-paced solo tournament currently in progress. Spectate the action!',
      game: 'BGMI',
      map: 'Vikendi',
      tournamentType: 'solo',
      maxParticipants: 60,
      currentParticipants: 60,
      entryFee: 20,
      prizePool: 1000,
      startDate: new Date(now.getTime() - 30 * 60 * 1000),
      status: 'live',
      rules: [
        'Match in progress',
        'No new registrations accepted',
        'Live spectating available',
        'Results will be announced shortly'
      ],
      participants: users.map(user => ({
        user: user._id,
        joinedAt: yesterday,
        status: 'playing',
        kills: Math.floor(Math.random() * 10),
        rank: Math.floor(Math.random() * 60) + 1
      })),
      roomDetails: {
        roomId: 'LIVE123456',
        password: 'bgmi2024',
        status: 'live'
      },
      createdBy: users[0]._id
    },
    {
      title: 'Weekend Warriors Championship - Completed',
      description: 'Epic weekend tournament that concluded with amazing performances. Check out the results!',
      game: 'BGMI',
      map: 'Erangel',
      tournamentType: 'solo',
      maxParticipants: 80,
      currentParticipants: 80,
      entryFee: 35,
      prizePool: 2500,
      startDate: yesterday,
      endDate: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
      status: 'completed',
      rules: [
        'Tournament completed',
        'All prizes distributed',
        'Results are final',
        'Thank you for participating'
      ],
      participants: users.map(user => ({
        user: user._id,
        joinedAt: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
        status: 'completed',
        kills: Math.floor(Math.random() * 15),
        rank: Math.floor(Math.random() * 80) + 1
      })),
      winners: [
        {
          user: users[1]._id,
          prize: 1250,
          position: 1,
          kills: 12
        },
        {
          user: users[0]._id,
          prize: 750,
          position: 2,
          kills: 10
        },
        {
          user: users[2]._id,
          prize: 500,
          position: 3,
          kills: 8
        }
      ],
      createdBy: users[0]._id
    }
  ];

  try {
    // Clear existing tournaments
    await Tournament.deleteMany({});
    
    // Create new tournaments
    const createdTournaments = await Tournament.insertMany(sampleTournaments);
    console.log(`Created ${createdTournaments.length} sample tournaments`);
    return createdTournaments;
  } catch (error) {
    console.error('Error creating sample tournaments:', error);
    return [];
  }
};

const createSampleTransactions = async (users, tournaments) => {
  const sampleTransactions = [];

  // Entry fee transactions
  users.forEach((user, index) => {
    tournaments.forEach((tournament, tIndex) => {
      if (tIndex <= index) { // Some users joined some tournaments
        sampleTransactions.push({
          user: user._id,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount: tournament.entryFee,
          type: 'tournament_entry',
          status: 'completed',
          description: `Entry fee for ${tournament.title}`,
          tournament: tournament._id,
          createdAt: new Date(tournament.startDate.getTime() - 24 * 60 * 60 * 1000)
        });
      }
    });
  });

  // Prize transactions for completed tournament
  const completedTournament = tournaments.find(t => t.status === 'completed');
  if (completedTournament && completedTournament.winners) {
    completedTournament.winners.forEach(winner => {
      sampleTransactions.push({
        user: winner.user,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: winner.prize,
        type: 'tournament_win',
        status: 'completed',
        description: `Prize for ${completedTournament.title} (Position: ${winner.position})`,
        tournament: completedTournament._id,
        createdAt: completedTournament.endDate
      });
    });
  }

  // Wallet top-up transactions
  users.forEach(user => {
    sampleTransactions.push({
      user: user._id,
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.floor(Math.random() * 500) + 100,
      type: 'deposit',
      status: 'completed',
      description: 'Wallet top-up via UPI',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    });
  });

  try {
    // Clear existing transactions
    await Transaction.deleteMany({});
    
    // Create new transactions
    const createdTransactions = await Transaction.insertMany(sampleTransactions);
    console.log(`Created ${createdTransactions.length} sample transactions`);
    return createdTransactions;
  } catch (error) {
    console.error('Error creating sample transactions:', error);
    return [];
  }
};

const createSampleNotifications = async (users) => {
  // First, ensure we have an admin user
  let admin = await Admin.findOne();
  if (!admin) {
    admin = await Admin.create({
      name: 'System Admin',
      email: 'admin@gameon.com',
      password: 'admin123',
      role: 'super_admin',
      status: 'active'
    });
  }
  const sampleNotifications = [
    {
      title: 'Welcome to GameOn!',
      message: 'Thank you for joining GameOn. Start participating in tournaments and win exciting prizes!',
      type: 'general_update',
      priority: 'normal',
      targetAudience: 'all_users',
      status: 'sent',
      totalRecipients: users.length,
      createdBy: admin._id
    },
    {
      title: 'New Tournament Alert!',
      message: 'BGMI Championship Series is now open for registration. Limited seats available!',
      type: 'tournament_announcement',
      priority: 'high',
      targetAudience: 'all_users',
      status: 'sent',
      totalRecipients: users.length,
      createdBy: admin._id
    },
    {
      title: 'System Maintenance Notice',
      message: 'Scheduled maintenance on Sunday 2 AM - 4 AM. Services may be temporarily unavailable.',
      type: 'system_maintenance',
      priority: 'normal',
      targetAudience: 'all_users',
      status: 'sent',
      totalRecipients: users.length,
      createdBy: admin._id
    },
    {
      title: 'Tournament Results Published',
      message: 'Weekend Warriors Championship results are now available. Check if you won!',
      type: 'tournament_announcement',
      priority: 'high',
      targetAudience: 'tournament_participants',
      status: 'sent',
      totalRecipients: 80,
      createdBy: admin._id
    }
  ];

  try {
    // Clear existing notifications
    await Notification.deleteMany({});
    
    // Create new notifications
    const createdNotifications = await Notification.insertMany(sampleNotifications);
    console.log(`Created ${createdNotifications.length} sample notifications`);
    return createdNotifications;
  } catch (error) {
    console.error('Error creating sample notifications:', error);
    return [];
  }
};

const populateDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Starting database population...');
    
    // Create sample data
    const users = await createSampleUsers();
    const tournaments = await createSampleTournaments(users);
    const transactions = await createSampleTransactions(users, tournaments);
    const notifications = await createSampleNotifications(users);
    
    console.log('✅ Database population completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Tournaments: ${tournaments.length}`);
    console.log(`   - Transactions: ${transactions.length}`);
    console.log(`   - Notifications: ${notifications.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  }
};

// Run the population script
if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase };