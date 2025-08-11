/**
 * Custom Icon Provider for React Native Paper
 * Provides Expo vector icons to React Native Paper components
 */

import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const IconProvider = ({ name, size = 24, color = '#000', ...props }) => {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      {...props}
    />
  );
};

export default IconProvider;