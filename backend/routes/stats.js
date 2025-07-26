/**
 * Platform Statistics Routes
 * Provides real-time platform statistics and leaderboard data
 */

const express = require('express');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Transaction = require('../models/Transaction');
const router = express.Router();

// Get platform statistics
router.get('/platform', async (req, res) => {
  try {
    // Get active tournaments count
    const activeTournaments = await Tournament.countDocuments({
      status: { $in: ['upcoming', 'live'] }
    });

    // Get total players in active tournaments
    const activePlayersPipeline = await Tournament.aggregate([
      { $match: { status: { $in: ['upcoming', 'live'] } } },
      { $group: { _id: null, totalPlayers: { $sum: '$currentParticipants' } } }
    ]);
    const totalPlayers = activePlayersPipeline[0]?.totalPlayers || 0;

    // Get total prize pool for active tournaments
    const prizePipeline = await Tournament.aggregate([
      { $match: { status: { $in: ['upcoming', 'live'] } } },
      { $group: { _id: null, totalPrizePool: { $sum: '$prizePool' } } }
    ]);
    const totalPrizePool = prizePipeline[0]?.totalPrizePool || 0;

    // Get total registered users
    const totalUsers = await User.countDocuments({ status: 'active' });

    // Get online users (mock for now - would need session tracking)
    const onlineUsers = Math.floor(totalUsers * 0.1); // Assume 10% are online

    res.json({
      success: true,
      data: {
        activeTournaments,
        totalPlayers,
        totalPrizePool,
        onlineUsers,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform statistics',
      error: error.message
    });
  }
});

// Get recent winners
router.get('/recent-winners', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent tournament winners
    const recentWinners = await Tournament.aggregate([
      {
        $match: {
          status: 'completed',
          winners: { $exists: true, $ne: [] }
        }
      },
      { $sort: { endDate: -1 } },
      { $limit: limit },
      { $unwind: '$winners' },
      {
        $match: {
          'winners.position': 1 // Only first place winners
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'winners.user',
          foreignField: '_id',
          as: 'winnerUser'
        }
      },
      { $unwind: '$winnerUser' },
      {
        $project: {
          _id: 1,
          tournamentTitle: '$title',
          username: '$winnerUser.username',
          prize: '$winners.prize',
          wonAt: '$endDate',
          gameProfile: '$winnerUser.gameProfile'
        }
      }
    ]);

    res.json({
      success: true,
      data: recentWinners
    });
  } catch (error) {
    console.error('Error fetching recent winners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent winners',
      error: error.message
    });
  }
});

// Get leaderboard data
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'overall', timeFilter = 'all', limit = 50 } = req.query;
    
    let matchStage = {};
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeFilter) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      matchStage.createdAt = { $gte: startDate };
    }

    // Build aggregation pipeline based on type
    let pipeline = [];
    
    switch (type) {
      case 'winnings':
        pipeline = [
          {
            $lookup: {
              from: 'tournaments',
              localField: '_id',
              foreignField: 'winners.user',
              as: 'wonTournaments'
            }
          },
          {
            $addFields: {
              totalWinnings: {
                $sum: {
                  $map: {
                    input: '$wonTournaments',
                    as: 'tournament',
                    in: {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$$tournament.winners',
                              cond: { $eq: ['$$this.user', '$_id'] }
                            }
                          },
                          as: 'winner',
                          in: '$$winner.prize'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          { $match: { totalWinnings: { $gt: 0 } } },
          { $sort: { totalWinnings: -1 } }
        ];
        break;
        
      case 'wins':
        pipeline = [
          {
            $lookup: {
              from: 'tournaments',
              localField: '_id',
              foreignField: 'winners.user',
              as: 'wonTournaments'
            }
          },
          {
            $addFields: {
              tournamentsWon: {
                $size: {
                  $filter: {
                    input: '$wonTournaments',
                    cond: {
                      $in: [
                        '$_id',
                        {
                          $map: {
                            input: {
                              $filter: {
                                input: '$$this.winners',
                                cond: { $eq: ['$$this.position', 1] }
                              }
                            },
                            in: '$$this.user'
                          }
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          { $match: { tournamentsWon: { $gt: 0 } } },
          { $sort: { tournamentsWon: -1 } }
        ];
        break;
        
      case 'kills':
        pipeline = [
          {
            $lookup: {
              from: 'tournaments',
              localField: '_id',
              foreignField: 'participants.user',
              as: 'participatedTournaments'
            }
          },
          {
            $addFields: {
              totalKills: {
                $sum: {
                  $map: {
                    input: '$participatedTournaments',
                    as: 'tournament',
                    in: {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$$tournament.participants',
                              cond: { $eq: ['$$this.user', '$_id'] }
                            }
                          },
                          as: 'participant',
                          in: '$$participant.kills'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          { $match: { totalKills: { $gt: 0 } } },
          { $sort: { totalKills: -1 } }
        ];
        break;
        
      default: // overall
        pipeline = [
          {
            $lookup: {
              from: 'tournaments',
              localField: '_id',
              foreignField: 'winners.user',
              as: 'wonTournaments'
            }
          },
          {
            $lookup: {
              from: 'tournaments',
              localField: '_id',
              foreignField: 'participants.user',
              as: 'participatedTournaments'
            }
          },
          {
            $addFields: {
              totalWinnings: {
                $sum: {
                  $map: {
                    input: '$wonTournaments',
                    as: 'tournament',
                    in: {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$$tournament.winners',
                              cond: { $eq: ['$$this.user', '$_id'] }
                            }
                          },
                          as: 'winner',
                          in: '$$winner.prize'
                        }
                      }
                    }
                  }
                }
              },
              tournamentsWon: { $size: '$wonTournaments' },
              totalTournaments: { $size: '$participatedTournaments' },
              totalKills: {
                $sum: {
                  $map: {
                    input: '$participatedTournaments',
                    as: 'tournament',
                    in: {
                      $sum: {
                        $map: {
                          input: {
                            $filter: {
                              input: '$$tournament.participants',
                              cond: { $eq: ['$$this.user', '$_id'] }
                            }
                          },
                          as: 'participant',
                          in: '$$participant.kills'
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            $addFields: {
              winRate: {
                $cond: {
                  if: { $gt: ['$totalTournaments', 0] },
                  then: {
                    $multiply: [
                      { $divide: ['$tournamentsWon', '$totalTournaments'] },
                      100
                    ]
                  },
                  else: 0
                }
              }
            }
          },
          { $match: { totalTournaments: { $gt: 0 } } },
          { $sort: { totalWinnings: -1, tournamentsWon: -1 } }
        ];
    }

    // Add common stages
    pipeline.unshift({ $match: { status: 'active', ...matchStage } });
    pipeline.push(
      { $limit: parseInt(limit) },
      {
        $project: {
          username: 1,
          gameProfile: 1,
          totalWinnings: { $ifNull: ['$totalWinnings', 0] },
          tournamentsWon: { $ifNull: ['$tournamentsWon', 0] },
          totalKills: { $ifNull: ['$totalKills', 0] },
          winRate: { $ifNull: [{ $round: ['$winRate', 1] }, 0] },
          totalTournaments: { $ifNull: ['$totalTournaments', 0] }
        }
      }
    );

    const leaderboard = await User.aggregate(pipeline);

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      user: {
        username: user.username,
        gameProfile: user.gameProfile
      }
    }));

    // Get overall stats
    const totalPlayers = await User.countDocuments({ status: 'active' });
    const totalTournaments = await Tournament.countDocuments({ status: 'completed' });
    const totalPrizeDistributed = await Tournament.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$winners' },
      { $group: { _id: null, total: { $sum: '$winners.prize' } } }
    ]);

    res.json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        stats: {
          totalPlayers,
          totalTournaments,
          totalPrizeDistributed: totalPrizeDistributed[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

module.exports = router;