import React, { useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Person,
  PersonAdd,
  Lock,
  LockOpen,
  TouchApp,
  DragIndicator,
  Star
} from '@mui/icons-material';
import { Droppable, Draggable } from '@hello-pangea/dnd';

const SlotContent = ({ slot, user, showLockControls, onToggleLock, isMobile, isMySlot, isCaptain }) => {
  const theme = useTheme();

  if (!slot.player) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" gap={1} width="100%" py={1}>
        <PersonAdd color="disabled" />
        <Typography variant="body2" color="text.secondary">
          {isMobile ? 'Tap to move here' : 'Empty Slot'}
        </Typography>
        {!isMobile && <TouchApp color="disabled" fontSize="small" />}
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
      <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2} flex={1} minWidth={0}>
        <Box position="relative">
          <Avatar
            src={slot.player.avatar}
            alt={slot.player.username}
            sx={{
              width: isMobile ? 28 : 32,
              height: isMobile ? 28 : 32,
              border: isMySlot ? `2px solid ${theme.palette.primary.main}` : 'none'
            }}
          >
            <Person />
          </Avatar>
          {isCaptain && (
            <Star
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                fontSize: 16,
                color: theme.palette.warning.main
              }}
            />
          )}
        </Box>
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography
              variant={isMobile ? 'caption' : 'subtitle2'}
              noWrap
              sx={{ fontWeight: isMySlot ? 'bold' : 'normal' }}
            >
              {slot.player.username}
            </Typography>
            {isMySlot && (
              <Chip
                label="You"
                size="small"
                color="primary"
                sx={{ height: 16, fontSize: '0.6rem' }}
              />
            )}
          </Box>
          {slot.player.gameProfile?.bgmiName && (
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{ fontSize: isMobile ? '0.65rem' : '0.75rem' }}
            >
              {slot.player.gameProfile.bgmiName}
            </Typography>
          )}
        </Box>
      </Box>

      <Box display="flex" alignItems="center" gap={0.5}>
        {isMySlot && !isMobile && (
          <DragIndicator color="primary" fontSize="small" />
        )}
        {showLockControls && (
          <Tooltip title={slot.isLocked ? 'Unlock Slot' : 'Lock Slot'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(slot.teamNumber, slot.slotNumber, slot.isLocked);
              }}
            >
              {slot.isLocked ? <Lock color="warning" /> : <LockOpen color="disabled" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

// Normalize player ID comparison to handle both populated objects and raw IDs
function isSamePlayer(slotPlayer, userId) {
  if (!slotPlayer || !userId) return false;
  const pid = slotPlayer._id ? slotPlayer._id.toString() : slotPlayer.toString();
  const uid = userId._id ? userId._id.toString() : userId.toString();
  return pid === uid;
}

const SlotContainer = React.memo(({
  team,
  slot,
  isSlotChangeable,
  isDraggable,
  user,
  onSlotClick,
  showLockControls = false,
  onToggleLock,
  isMobile = false,
  isSelected = false
}) => {
  const theme = useTheme();
  const slotId = `team-${team.teamNumber}-slot-${slot.slotNumber}`;
  const isMySlot = isSamePlayer(slot.player, user?._id);
  const isLocked = slot.isLocked;
  const isCaptain = team.captain && slot.player && isSamePlayer(team.captain, slot.player);

  const isClickable = isSlotChangeable && !isLocked && (
    isMySlot || // my slot - select/deselect
    (!slot.player) // empty - move here
  );

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSlotChangeable && !isLocked) {
      if (navigator.vibrate) navigator.vibrate(30);
      onSlotClick(team.teamNumber, slot.slotNumber);
    }
  }, [isSlotChangeable, isLocked, onSlotClick, team.teamNumber, slot.slotNumber]);

  const handleDoubleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Double-click on my slot: immediate move mode (same as single click for now)
    if (isSlotChangeable && !isLocked) {
      onSlotClick(team.teamNumber, slot.slotNumber);
    }
  }, [isSlotChangeable, isLocked, onSlotClick, team.teamNumber, slot.slotNumber]);

  // Determine visual state
  const getBorderColor = () => {
    if (isLocked) return theme.palette.warning.main;
    if (isSelected) return theme.palette.warning.main;
    if (isMySlot) return theme.palette.primary.main;
    if (slot.player) return theme.palette.success.light;
    return theme.palette.grey[300];
  };

  const getBgColor = () => {
    if (isSelected) return alpha(theme.palette.warning.main, 0.15);
    if (isMySlot) return alpha(theme.palette.primary.main, 0.07);
    if (slot.player) return theme.palette.background.paper;
    return alpha(theme.palette.grey[100], 0.5);
  };

  const slotContent = (provided = {}, snapshot = {}) => (
    <Paper
      ref={provided.innerRef}
      {...(provided.draggableProps || {})}
      {...(!isMobile && provided.dragHandleProps ? provided.dragHandleProps : {})}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onTouchEnd={isMobile ? handleClick : undefined}
      elevation={snapshot.isDragging ? 8 : isSelected ? 4 : 1}
      sx={{
        p: isMobile ? 1.5 : 2,
        minHeight: isMobile ? 60 : 70,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: snapshot.isDraggingOver
          ? alpha(theme.palette.primary.main, 0.15)
          : snapshot.isDragging
            ? alpha(theme.palette.primary.main, 0.1)
            : getBgColor(),
        border: '2px solid',
        borderColor: getBorderColor(),
        borderStyle: isSelected ? 'dashed' : (slot.player ? 'solid' : 'dashed'),
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        touchAction: isMobile ? 'manipulation' : 'auto',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        '&:hover': isClickable ? {
          backgroundColor: slot.player
            ? alpha(theme.palette.primary.main, 0.1)
            : alpha(theme.palette.primary.main, 0.08),
          transform: 'translateY(-1px)',
          boxShadow: theme.shadows[3]
        } : {},
        '&:active': isClickable ? {
          transform: 'scale(0.98)',
        } : {}
      }}
    >
      <SlotContent
        slot={slot}
        user={user}
        showLockControls={showLockControls}
        onToggleLock={onToggleLock}
        isMobile={isMobile}
        isMySlot={isMySlot}
        isCaptain={isCaptain}
      />

      {/* Lock indicator */}
      {isLocked && (
        <Box
          position="absolute"
          top={0}
          right={0}
          sx={{
            width: 0,
            height: 0,
            borderLeft: '20px solid transparent',
            borderTop: `20px solid ${theme.palette.warning.main}`,
          }}
        />
      )}

      {/* "Selected" animation overlay */}
      {isSelected && (
        <Box
          position="absolute"
          inset={0}
          sx={{
            background: `linear-gradient(45deg, ${alpha(theme.palette.warning.main, 0.1)}, transparent)`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Mobile tap indicator */}
      {isMobile && isMySlot && isSlotChangeable && !isLocked && (
        <Box
          position="absolute"
          bottom={3}
          right={3}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          <TouchApp sx={{ fontSize: 10, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ fontSize: '0.55rem', color: theme.palette.primary.main }}>
            tap
          </Typography>
        </Box>
      )}

      {provided.placeholder}
    </Paper>
  );

  // Empty slot - droppable only
  if (!slot.player) {
    return (
      <Droppable droppableId={slotId} isDropDisabled={!isSlotChangeable || isLocked || !!slot.player}>
        {(provided, snapshot) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {slotContent(provided, snapshot)}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    );
  }

  // Occupied by another player - droppable but not draggable
  if (!isDraggable) {
    return (
      <Droppable droppableId={slotId} isDropDisabled={true}>
        {(provided, snapshot) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {slotContent(provided, snapshot)}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    );
  }

  // My slot - draggable
  return (
    <Droppable droppableId={slotId} isDropDisabled={true}>
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
  selectedSlot,
  isModal = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!teams || teams.length === 0) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="text.secondary">No teams available</Typography>
      </Box>
    );
  }

  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: '1fr',
        sm: isModal ? 'repeat(2, 1fr)' : '1fr',
        md: 'repeat(2, 1fr)',
        lg: isModal ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        xl: 'repeat(3, 1fr)'
      }}
      gap={isMobile ? 2 : 3}
    >
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
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={isMobile ? 1.5 : 2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                color={team.isComplete ? 'success.main' : 'primary'}
              >
                Team {team.teamNumber}
              </Typography>
              {team.captain && (
                <Chip
                  icon={<Star />}
                  label={team.captain.username}
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ height: isMobile ? 20 : 24, fontSize: isMobile ? '0.65rem' : '0.75rem' }}
                />
              )}
            </Box>
            <Chip
              label={`${team.slots.filter(s => s.player).length}/${team.slots.length}`}
              size="small"
              color={team.isComplete ? 'success' : 'default'}
              sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.65rem' : '0.75rem' }}
            />
          </Box>

          <Box display="flex" flexDirection="column" gap={isMobile ? 1 : 1.5}>
            {team.slots.map((slot) => {
              const isThisSlotMine = isSamePlayer(slot.player, user?._id);
              const isThisSlotSelected = selectedSlot?.teamNumber === team.teamNumber &&
                selectedSlot?.slotNumber === slot.slotNumber;

              return (
                <SlotContainer
                  key={`${team.teamNumber}-${slot.slotNumber}`}
                  team={team}
                  slot={slot}
                  isSlotChangeable={isSlotChangeable}
                  isDraggable={isThisSlotMine && isSlotChangeable}
                  user={user}
                  onSlotClick={onSlotClick}
                  showLockControls={showLockControls}
                  onToggleLock={onToggleLock}
                  isMobile={isMobile}
                  isSelected={isThisSlotSelected}
                />
              );
            })}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default React.memo(RoomSlotLayout);