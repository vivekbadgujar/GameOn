import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import { Person, PersonAdd, Lock, LockOpen } from '@mui/icons-material';
import { Droppable, Draggable } from 'react-beautiful-dnd';

const SlotContent = ({ slot, user, showLockControls, onToggleLock }) => {
  const theme = useTheme();

  if (!slot.player) {
    return (
      <Box display="flex" alignItems="center" gap={1} width="100%">
        <PersonAdd color="disabled" />
        <Typography variant="body2" color="text.secondary">
          Empty Slot
        </Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar
          src={slot.player.avatar}
          alt={slot.player.username}
          sx={{ width: 32, height: 32 }}
        >
          <Person />
        </Avatar>
        <Box>
          <Typography variant="subtitle2" noWrap>
            {slot.player.username}
          </Typography>
          {slot.player.gameProfile?.bgmiName && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {slot.player.gameProfile.bgmiName}
            </Typography>
          )}
        </Box>
      </Box>
      {showLockControls && (
        <Tooltip title={slot.isLocked ? "Unlock Slot" : "Lock Slot"}>
          <IconButton
            size="small"
            onClick={() => onToggleLock(slot.teamNumber, slot.slotNumber, slot.isLocked)}
          >
            {slot.isLocked ? <Lock color="warning" /> : <LockOpen color="disabled" />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

const SlotContainer = React.memo(({
  team,
  slot,
  isSlotChangeable,
  isDraggable,
  user,
  onSlotClick,
  showLockControls = false,
  onToggleLock
}) => {
  const theme = useTheme();
  const slotId = `team-${team.teamNumber}-slot-${slot.slotNumber}`;
  const isMySlot = slot.player?._id === user?._id;
  const isLocked = slot.isLocked;

  const slotContent = (provided = {}, snapshot = {}) => (
    <Paper
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={() => onSlotClick(team.teamNumber, slot.slotNumber)}
      elevation={snapshot.isDragging ? 8 : 1}
      sx={{
        p: 2,
        minHeight: 70,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: snapshot.isDraggingOver
          ? alpha(theme.palette.primary.main, 0.1)
          : slot.player
            ? theme.palette.background.paper
            : alpha(theme.palette.grey[100], 0.5),
        border: '2px solid',
        borderColor: isLocked
          ? theme.palette.warning.main
          : isMySlot
            ? theme.palette.primary.main
            : slot.player
              ? theme.palette.success.light
              : theme.palette.grey[300],
        borderStyle: slot.player ? 'solid' : 'dashed',
        cursor: (!slot.player && isSlotChangeable && !isLocked) ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: (!slot.player && isSlotChangeable && !isLocked)
            ? alpha(theme.palette.primary.main, 0.1)
            : undefined,
          transform: (!slot.player && isSlotChangeable && !isLocked)
            ? 'translateY(-2px)'
            : undefined
        }
      }}
    >
      <SlotContent
        slot={slot}
        user={user}
        showLockControls={showLockControls}
        onToggleLock={onToggleLock}
      />
    </Paper>
  );

  if (!isDraggable || !slot.player || isLocked) {
    return (
      <Droppable droppableId={slotId} isDropDisabled={!isSlotChangeable || isLocked}>
        {(provided, snapshot) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {slotContent(provided, snapshot)}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    );
  }

  return (
    <Droppable droppableId={slotId} isDropDisabled={!isSlotChangeable || isLocked}>
      {(provided, snapshot) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}>
          <Draggable
            draggableId={`player-${slot.player._id}`}
            index={0}
            isDragDisabled={!isSlotChangeable || isLocked}
          >
            {(dragProvided, dragSnapshot) => slotContent(dragProvided, dragSnapshot)}
          </Draggable>
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
});

const RoomSlotLayout = ({
  teams,
  isSlotChangeable,
  user,
  onSlotClick,
  showLockControls,
  onToggleLock,
}) => {
  const theme = useTheme();

  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={3}>
      {teams.map((team) => (
        <Paper
          key={team.teamNumber}
          elevation={0}
          sx={{
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" color={team.isComplete ? 'success.main' : 'primary'}>
              Team {team.teamNumber}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: team.isComplete
                  ? alpha(theme.palette.success.main, 0.1)
                  : alpha(theme.palette.grey[500], 0.1),
                color: team.isComplete
                  ? theme.palette.success.main
                  : theme.palette.text.secondary,
              }}
            >
              {team.slots.filter(s => s.player).length}/{team.slots.length}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={1.5}>
            {team.slots.map((slot) => (
              <SlotContainer
                key={`${team.teamNumber}-${slot.slotNumber}`}
                team={team}
                slot={slot}
                isSlotChangeable={isSlotChangeable}
                isDraggable={slot.player?._id === user?._id}
                user={user}
                onSlotClick={onSlotClick}
                showLockControls={showLockControls}
                onToggleLock={onToggleLock}
              />
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default React.memo(RoomSlotLayout);
