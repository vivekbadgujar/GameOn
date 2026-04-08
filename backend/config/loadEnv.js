const path = require('path');
const dotenv = require('dotenv');

const ENV_FILE_BY_NAME = {
  production: '.env.production',
  test: '.env.test',
  development: '.env'
};

const loadEnv = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const preferredFile = ENV_FILE_BY_NAME[nodeEnv] || '.env';
  const preferredPath = path.join(__dirname, '..', preferredFile);
  const fallbackPath = path.join(__dirname, '..', '.env');

  const loaded = dotenv.config({ path: preferredPath });
  if (loaded.error && preferredPath !== fallbackPath) {
    dotenv.config({ path: fallbackPath });
  }
};

module.exports = loadEnv;
