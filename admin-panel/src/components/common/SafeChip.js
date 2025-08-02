import React from 'react';
import { Chip } from '@mui/material';

/**
 * Safe Chip component that validates color props
 * to prevent Material-UI theme errors
 */
const SafeChip = ({ color, ...props }) => {
  // Valid Material-UI Chip colors
  const validColors = ['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'];
  
  // Use 'default' as fallback for invalid colors
  const safeColor = validColors.includes(color) ? color : 'default';
  
  return <Chip color={safeColor} {...props} />;
};

export default SafeChip;