/**
 * React Native Paper Configuration
 * Configure Paper to use Expo Vector Icons
 */

import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Custom icon component for React Native Paper
export const PaperIcon = ({ name, size, color, ...props }) => {
  return (
    <MaterialCommunityIcons 
      name={name} 
      size={size} 
      color={color} 
      {...props} 
    />
  );
};

// Configure React Native Paper settings
export const paperSettings = {
  icon: PaperIcon,
};

export default paperSettings;