/**
 * Metro configuration for React Native
 * https://github.com/facebook/metro
 *
 * @format
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Override the serializer to avoid the importLocationsPlugin issue
if (config.serializer && config.serializer.customSerializer) {
  delete config.serializer.customSerializer;
}

module.exports = config;