/**
 * Room Slot Management Model
 * Handles BGMI-style room layout and slot assignments
 */

const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  lockedAt: {
    type: Date,
    default: null
  }
});

const TeamSchema = new mongoose.Schema({
  teamNumber: {
    type: Number,
    required: true,
    min: 1
  },
  teamName: {
    type: String,
    default: function() {
      return `Team ${this.teamNumber}`;
    }
  },
  slots: [SlotSchema],
  isComplete: {
    type: Boolean,
    default: false
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

const RoomSlotSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    unique: true
  },
  tournamentType: {
    type: String,
    enum: ['solo', 'duo', 'squad'],
    required: true
  },
  maxTeams: {
    type: Number,
    required: true
  },
  maxPlayersPerTeam: {
    type: Number,
    required: true,
    default: function() {
      switch(this.tournamentType) {
        case 'solo': return 1;
        case 'duo': return 2;
        case 'squad': return 4;
        default: return 4;
      }
    }
  },
  teams: [TeamSchema],
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  lockedAt: {
    type: Date,
    default: null
  },
  roomCredentials: {
    roomId: String,
    password: String,
    map: String,
    perspective: {
      type: String,
      enum: ['FPP', 'TPP'],
      default: 'TPP'
    }
  },
  settings: {
    allowSlotChange: {
      type: Boolean,
      default: true
    },
    allowTeamSwitch: {
      type: Boolean,
      default: true
    },
    autoAssignTeams: {
      type: Boolean,
      default: true
    },
    slotChangeDeadline: {
      type: Date,
      default: null
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes
RoomSlotSchema.index({ tournament: 1 });
RoomSlotSchema.index({ 'teams.slots.player': 1 });

// Virtual for total players
RoomSlotSchema.virtual('totalPlayers').get(function() {
  return this.teams.reduce((total, team) => {
    return total + team.slots.filter(slot => slot.player).length;
  }, 0);
});

// Virtual for available slots
RoomSlotSchema.virtual('availableSlots').get(function() {
  const available = [];
  this.teams.forEach((team, teamIndex) => {
    team.slots.forEach((slot, slotIndex) => {
      if (!slot.player && !slot.isLocked) {
        available.push({
          teamNumber: team.teamNumber,
          slotNumber: slot.slotNumber,
          teamIndex,
          slotIndex
        });
      }
    });
  });
  return available;
});

// Instance Methods
RoomSlotSchema.methods.initializeTeams = function() {
  const teamsNeeded = this.maxTeams;
  const slotsPerTeam = this.maxPlayersPerTeam;
  
  this.teams = [];
  
  for (let i = 1; i <= teamsNeeded; i++) {
    const team = {
      teamNumber: i,
      teamName: `Team ${i}`,
      slots: [],
      isComplete: false,
      captain: null
    };
    
    for (let j = 1; j <= slotsPerTeam; j++) {
      team.slots.push({
        slotNumber: j,
        player: null,
        isLocked: false,
        lockedBy: null,
        lockedAt: null
      });
    }
    
    this.teams.push(team);
  }
  
  return this;
};

RoomSlotSchema.methods.assignPlayerToSlot = function(playerId, teamNumber, slotNumber) {
  const team = this.teams.find(t => t.teamNumber === teamNumber);
  if (!team) {
    throw new Error('Team not found');
  }
  
  const slot = team.slots.find(s => s.slotNumber === slotNumber);
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  if (slot.player) {
    throw new Error('Slot is already occupied');
  }
  
  if (slot.isLocked) {
    throw new Error('Slot is locked');
  }
  
  // Remove player from any existing slot
  this.removePlayerFromAllSlots(playerId);
  
  // Assign to new slot
  slot.player = playerId;
  
  // Set captain if first player in team
  if (!team.captain) {
    team.captain = playerId;
  }
  
  // Check if team is complete
  team.isComplete = team.slots.every(s => s.player !== null);
  
  return this;
};

RoomSlotSchema.methods.removePlayerFromAllSlots = function(playerId) {
  this.teams.forEach(team => {
    team.slots.forEach(slot => {
      if (slot.player && slot.player.toString() === playerId.toString()) {
        slot.player = null;
      }
    });
    
    // Update captain if removed player was captain
    if (team.captain && team.captain.toString() === playerId.toString()) {
      const remainingPlayer = team.slots.find(s => s.player);
      team.captain = remainingPlayer ? remainingPlayer.player : null;
    }
    
    // Update team completion status
    team.isComplete = team.slots.every(s => s.player !== null);
  });
  
  return this;
};

RoomSlotSchema.methods.getPlayerSlot = function(playerId) {
  for (let teamIndex = 0; teamIndex < this.teams.length; teamIndex++) {
    const team = this.teams[teamIndex];
    for (let slotIndex = 0; slotIndex < team.slots.length; slotIndex++) {
      const slot = team.slots[slotIndex];
      if (slot.player && slot.player.toString() === playerId.toString()) {
        return {
          teamNumber: team.teamNumber,
          slotNumber: slot.slotNumber,
          teamIndex,
          slotIndex,
          isCaptain: team.captain && team.captain.toString() === playerId.toString()
        };
      }
    }
  }
  return null;
};

RoomSlotSchema.methods.autoAssignPlayer = function(playerId) {
  // Find first available slot
  for (let team of this.teams) {
    for (let slot of team.slots) {
      if (!slot.player && !slot.isLocked) {
        return this.assignPlayerToSlot(playerId, team.teamNumber, slot.slotNumber);
      }
    }
  }
  
  throw new Error('No available slots');
};

RoomSlotSchema.methods.movePlayer = function(playerId, fromTeam, fromSlot, toTeam, toSlot) {
  // Validate source slot
  const sourceTeam = this.teams.find(t => t.teamNumber === fromTeam);
  if (!sourceTeam) {
    throw new Error('Source team not found');
  }
  
  const sourceSlot = sourceTeam.slots.find(s => s.slotNumber === fromSlot);
  if (!sourceSlot || !sourceSlot.player || sourceSlot.player.toString() !== playerId.toString()) {
    throw new Error('Player not found in source slot');
  }
  
  // Validate destination slot
  const destTeam = this.teams.find(t => t.teamNumber === toTeam);
  if (!destTeam) {
    throw new Error('Destination team not found');
  }
  
  const destSlot = destTeam.slots.find(s => s.slotNumber === toSlot);
  if (!destSlot) {
    throw new Error('Destination slot not found');
  }
  
  if (destSlot.player) {
    throw new Error('Destination slot is occupied');
  }
  
  if (destSlot.isLocked) {
    throw new Error('Destination slot is locked');
  }
  
  // Perform the move
  sourceSlot.player = null;
  destSlot.player = playerId;
  
  // Update captains
  if (sourceTeam.captain && sourceTeam.captain.toString() === playerId.toString()) {
    const remainingPlayer = sourceTeam.slots.find(s => s.player);
    sourceTeam.captain = remainingPlayer ? remainingPlayer.player : null;
  }
  
  if (!destTeam.captain) {
    destTeam.captain = playerId;
  }
  
  // Update team completion status
  sourceTeam.isComplete = sourceTeam.slots.every(s => s.player !== null);
  destTeam.isComplete = destTeam.slots.every(s => s.player !== null);
  
  return this;
};

RoomSlotSchema.methods.lockSlot = function(teamNumber, slotNumber, adminId) {
  const team = this.teams.find(t => t.teamNumber === teamNumber);
  if (!team) {
    throw new Error('Team not found');
  }
  
  const slot = team.slots.find(s => s.slotNumber === slotNumber);
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  slot.isLocked = true;
  slot.lockedBy = adminId;
  slot.lockedAt = new Date();
  
  return this;
};

RoomSlotSchema.methods.unlockSlot = function(teamNumber, slotNumber) {
  const team = this.teams.find(t => t.teamNumber === teamNumber);
  if (!team) {
    throw new Error('Team not found');
  }
  
  const slot = team.slots.find(s => s.slotNumber === slotNumber);
  if (!slot) {
    throw new Error('Slot not found');
  }
  
  slot.isLocked = false;
  slot.lockedBy = null;
  slot.lockedAt = null;
  
  return this;
};

// Static Methods
RoomSlotSchema.statics.createForTournament = async function(tournamentId, tournamentType, maxParticipants) {
  const maxPlayersPerTeam = tournamentType === 'solo' ? 1 : tournamentType === 'duo' ? 2 : 4;
  const maxTeams = Math.ceil(maxParticipants / maxPlayersPerTeam);
  
  const roomSlot = new this({
    tournament: tournamentId,
    tournamentType,
    maxTeams,
    maxPlayersPerTeam
  });
  
  roomSlot.initializeTeams();
  
  return await roomSlot.save();
};

module.exports = mongoose.model('RoomSlot', RoomSlotSchema);