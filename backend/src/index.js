
require('dotenv').config();

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// A simple route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Welcome to the GameOn API! Let the games begin! 🚀');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // For testing purposes

