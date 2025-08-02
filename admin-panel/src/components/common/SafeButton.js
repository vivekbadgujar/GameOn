import React from 'react';
import { Button } from '@mui/material';

/**
 * Safe Button component that validates color props
 * to prevent Material-UI theme errors
 */
const SafeButton = ({ color, ...props }) => {
  // Valid Material-UI Button colors
  const validColors = ['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'];
  
  // Use 'primary' as fallback for invalid colors
  const safeColor = validColors.includes(color) ? color : 'primary';
  
  return <Button color={safeColor} {...props} />;
};

export default SafeButton;