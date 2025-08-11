/**
 * React Native Paper Icon Fix
 * This file provides a compatibility layer for React Native Paper's icon requirements
 */

// Mock the missing @react-native-vector-icons/material-design-icons package
const mockModule = {
  __esModule: true,
  default: require('@expo/vector-icons/MaterialCommunityIcons').default,
  MaterialCommunityIcons: require('@expo/vector-icons/MaterialCommunityIcons').default,
};

module.exports = mockModule;