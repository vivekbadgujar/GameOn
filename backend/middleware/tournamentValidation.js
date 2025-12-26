/**
 * Tournament Validation Middleware
 * Handles validation for tournament operations
 */

const { body, param } = require('express-validator');

// Validation for creating/updating tournaments
const validateTournament = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 50 }).withMessage('Title must be between 3 and 50 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  
  body('game')
    .trim()
    .notEmpty().withMessage('Game is required'),
  
  body('tournamentType')
    .isIn(['solo', 'duo', 'squad']).withMessage('Invalid tournament type'),
  
  body('entryFee')
    .isNumeric().withMessage('Entry fee must be a number')
    .custom(value => Number(value) >= 0).withMessage('Entry fee cannot be negative'),
  
  body('prizePool')
    .isNumeric().withMessage('Prize pool must be a number')
    .custom(value => value > 0).withMessage('Prize pool must be greater than 0')
    .custom((value, { req }) => {
      const entryFee = parseFloat(req.body.entryFee) || 0;
      const maxParticipants = parseInt(req.body.maxParticipants) || 1;
      const totalPotential = entryFee * maxParticipants;
      // Allow prize pool to be up to 150% of total potential (for sponsored tournaments)
      return value <= (totalPotential * 1.5) || entryFee === 0;
    }).withMessage('Prize pool is too high compared to entry fees'),
  
  body('maxParticipants')
    .isInt({ min: 2 }).withMessage('Minimum 2 participants required')
    .custom(value => {
      const validSizes = [2, 4, 8, 16, 32, 64, 100];
      return validSizes.includes(Number(value));
    }).withMessage('Invalid participant count. Must be one of: 2, 4, 8, 16, 32, 64, 100'),
  
  body('startDate')
    .isISO8601().withMessage('Invalid start date format')
    .custom(value => {
      const startDate = new Date(value);
      const now = new Date();
      return startDate > now;
    }).withMessage('Start date must be in the future'),
  
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      return endDate > startDate;
    }).withMessage('End date must be after start date'),
  
  body('rules')
    .optional()
    .isArray().withMessage('Rules must be an array')
    .custom(value => value.every(rule => typeof rule === 'string' && rule.length <= 200))
    .withMessage('Each rule must be a string of max 200 characters')
];

// Validation for room details
const validateRoomDetails = [
  body('roomId')
    .trim()
    .notEmpty().withMessage('Room ID is required')
    .matches(/^[A-Za-z0-9]{6,12}$/).withMessage('Invalid room ID format'),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Room password is required')
    .matches(/^[A-Za-z0-9]{4,8}$/).withMessage('Invalid password format')
];

// Validation for winner distribution
const validateWinnerDistribution = [
  body('winners')
    .optional()
    .isArray().withMessage('Winners must be an array')
    .custom((value, { req }) => {
      if (!value && !req.body.isAutomatic) {
        throw new Error('Winners array is required for manual distribution');
      }
      if (value) {
        const totalPrize = value.reduce((sum, winner) => sum + (winner.prize || 0), 0);
        const tournament = req.tournament; // Assuming tournament is attached in previous middleware
        if (totalPrize > tournament.prizePool) {
          throw new Error('Total distributed prize cannot exceed prize pool');
        }
      }
      return true;
    }),
  
  body('winners.*.userId')
    .optional()
    .isMongoId().withMessage('Invalid user ID'),
  
  body('winners.*.position')
    .optional()
    .isInt({ min: 1 }).withMessage('Position must be a positive integer'),
  
  body('winners.*.prize')
    .optional()
    .isNumeric().withMessage('Prize must be a number')
    .custom(value => value > 0).withMessage('Prize must be greater than 0'),
  
  body('isAutomatic')
    .isBoolean().withMessage('isAutomatic must be a boolean')
];

module.exports = {
  validateTournament,
  validateRoomDetails,
  validateWinnerDistribution
}; 