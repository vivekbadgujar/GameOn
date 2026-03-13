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
  toSlot: {
    teamNumber: Number(toTeam),
    slotNumber: Number(toSlot)
  }
});
