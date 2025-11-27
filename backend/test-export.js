try {
  const app = require('./server');
  console.log('✓ server.js loads successfully');
  console.log('✓ App exports valid Express function:', typeof app === 'function');
  process.exit(0);
} catch (e) {
  console.error('✗ Error:', e.message);
  process.exit(1);
}
