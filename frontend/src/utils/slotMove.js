/**
 * Build the payload for a slot move API call.
 * Supports both Shape A: { toTeam, toSlot } (flat numbers)
 * and Shape B: { toSlot: { teamNumber, slotNumber } } (object)
 * The backend accepts both, but we send Shape A for simplicity.
 */
export const buildSlotMovePayload = ({
  tournamentId,
  playerId,
  fromSlot,
  toTeam,
  toSlot
}) => ({
  tournamentId,
  playerId,
  fromSlot: fromSlot
    ? {
        teamNumber: Number(fromSlot.teamNumber),
        slotNumber: Number(fromSlot.slotNumber)
      }
    : null,
  // Send flat numbers (Shape A) - backend accepts both shapes
  toTeam: Number(toTeam),
  toSlot: Number(toSlot)
});
