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
  Star,
  SwapHoriz
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const SlotContent = ({ slot, user, showLockControls, onToggleLock, isMobile, isMySlot, isCaptain }) => {
  const theme = useTheme();

  if (!slot.player) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" gap={1} width="100%" py={1}>
        <PersonAdd color="disabled" />
        <Typography variant="body2" color="text.secondary">
          {isMobile ? "Tap to join" : "Empty Slot"}
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
              variant={isMobile ? "caption" : "subtitle2"} 
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
  onToggleLock,
  isMobile = false
}) => {
  const theme = useTheme();
  const slotId = `team-${team.teamNumber}-slot-${slot.slotNumber}`;
  const isMySlot = slot.player?._id === user?._id;
  const isLocked = slot.isLocked;
  const isCaptain = team.captain?._id === slot.player?._id;

  const handleSlotInteraction = (e) => {
    if (isMobile && isSlotChangeable && !isLocked) {
      e.preventDefault();
      e.stopPropagation();
      
      // Add haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      onSlotClick(team.teamNumber, slot.slotNumber);
    } else if (!isMobile) {
      onSlotClick(team.teamNumber, slot.slotNumber);
    }
  };

  const slotContent = (provided = {}, snapshot = {}) => (
    <Paper
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...(!isMobile && provided.dragHandleProps)}
      onClick={handleSlotInteraction}
      onTouchStart={isMobile ? handleSlotInteraction : undefined}
      elevation={snapshot.isDragging ? 8 : 1}
      sx={{
        p: isMobile ? 1.5 : 2,
        minHeight: isMobile ? 60 : 70,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: snapshot.isDraggingOver
          ? alpha(theme.palette.primary.main, 0.15)
          : snapshot.isDragging
            ? alpha(theme.palette.primary.main, 0.1)
            : slot.player
              ? isMySlot 
                ? alpha(theme.palette.primary.main, 0.05)
                : theme.palette.background.paper
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
        cursor: (!slot.player && isSlotChangeable && !isLocked) ? 'pointer' : 
                (isMySlot && isSlotChangeable && !isLocked && !isMobile) ? 'grab' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
        touchAction: isMobile ? 'manipulation' : 'auto',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        '&:hover': {
          backgroundColor: (!slot.player && isSlotChangeable && !isLocked)
            ? alpha(theme.palette.primary.main, 0.1)
            : isMySlot && isSlotChangeable && !isLocked
              ? alpha(theme.palette.primary.main, 0.08)
              : undefined,
          transform: (!slot.player && isSlotChangeable && !isLocked) || 
                    (isMySlot && isSlotChangeable && !isLocked)
            ? 'translateY(-2px)'
            : undefined,
          boxShadow: (!slot.player && isSlotChangeable && !isLocked) || 
                    (isMySlot && isSlotChangeable && !isLocked)
            ? theme.shadows[4]
            : undefined
        },
        '&:active': {
          transform: (!slot.player && isSlotChangeable && !isLocked) || 
                    (isMySlot && isSlotChangeable && !isLocked)
            ? isMobile ? 'scale(0.98)' : 'translateY(0px)'
            : undefined,
          backgroundColor: isMobile && (!slot.player && isSlotChangeable && !isLocked)
            ? alpha(theme.palette.primary.main, 0.2)
            : undefined
        }
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
      
      {/* Visual indicator for locked slots */}
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
      
      {/* Visual indicator for draggable slots on mobile */}
      {isMobile && isMySlot && isSlotChangeable && !isLocked && (
        <Box
          position="absolute"
          bottom={4}
          right={4}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 0.5,
            py: 0.25,
            borderRadius: 0.5,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          <TouchApp sx={{ fontSize: 12, color: theme.palette.primary.main }} />
          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: theme.palette.primary.main }}>
            Tap to move
          </Typography>
        </Box>
      )}
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
  isModal = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
                variant={isMobile ? "subtitle1" : "h6"} 
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
              sx={{
                fontWeight: 'bold',
                fontSize: isMobile ? '0.65rem' : '0.75rem'
              }}
            />
          </Box>

          <Box display="flex" flexDirection="column" gap={isMobile ? 1 : 1.5}>
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
                isMobile={isMobile}
              />
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default React.memo(RoomSlotLayout);