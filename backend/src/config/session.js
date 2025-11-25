const session = require('express-session');
const pool = require('./database');

// Simple in-memory session store for development
// For production, consider using connect-pg-simple or redis
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

module.exports = session(sessionConfig);
