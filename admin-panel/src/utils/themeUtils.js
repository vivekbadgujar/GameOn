/**
 * Theme utility functions to ensure valid Material-UI props
 */

// Valid Material-UI Button colors
export const VALID_BUTTON_COLORS = ['inherit', 'primary', 'secondary', 'success', 'error', 'info', 'warning'];

// Valid Material-UI Chip colors  
export const VALID_CHIP_COLORS = ['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'];

/**
 * Validates and returns a safe color for Button components
 * @param {string} color - The color to validate
 * @param {string} fallback - Fallback color (default: 'primary')
 * @returns {string} Valid color for Button component
 */
export const getSafeButtonColor = (color, fallback = 'primary') => {
  return VALID_BUTTON_COLORS.includes(color) ? color : fallback;
};

/**
 * Validates and returns a safe color for Chip components
 * @param {string} color - The color to validate
 * @param {string} fallback - Fallback color (default: 'default')
 * @returns {string} Valid color for Chip component
 */
export const getSafeChipColor = (color, fallback = 'default') => {
  return VALID_CHIP_COLORS.includes(color) ? color : fallback;
};

/**
 * Validates theme color paths to prevent undefined access
 * @param {object} theme - Material-UI theme object
 * @param {string} colorPath - Color path like 'primary.main'
 * @param {string} fallback - Fallback color
 * @returns {string} Safe color value
 */
export const getSafeThemeColor = (theme, colorPath, fallback = '#1976d2') => {
  try {
    const pathParts = colorPath.split('.');
    let value = theme.palette;
    
    for (const part of pathParts) {
      value = value?.[part];
    }
    
    return value || fallback;
  } catch (error) {
    console.warn(`Invalid theme color path: ${colorPath}`, error);
    return fallback;
  }
};