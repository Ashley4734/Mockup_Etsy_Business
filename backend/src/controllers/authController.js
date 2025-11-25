const pool = require('../config/database');
const GoogleDriveService = require('../services/googleDrive');

/**
 * Initiate Google OAuth flow
 */
exports.initiateGoogleAuth = (req, res) => {
  try {
    const authUrl = GoogleDriveService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    res.status(500).json({ error: 'Failed to initiate Google authentication' });
  }
};

/**
 * Handle Google OAuth callback
 */
exports.handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=no_code`);
    }

    // Exchange code for tokens
    const tokens = await GoogleDriveService.getTokensFromCode(code);

    // Get user email
    const driveService = new GoogleDriveService(tokens);
    const email = await driveService.getUserEmail();

    // Find or create user
    let userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const insertResult = await pool.query(
        'INSERT INTO users (email, google_tokens) VALUES ($1, $2) RETURNING *',
        [email, JSON.stringify(tokens)]
      );
      user = insertResult.rows[0];
    } else {
      // Update existing user
      const updateResult = await pool.query(
        'UPDATE users SET google_tokens = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING *',
        [JSON.stringify(tokens), email]
      );
      user = updateResult.rows[0];
    }

    // Store user info in session
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.googleTokens = tokens;

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?auth=success`);
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=auth_failed`);
  }
};

/**
 * Get authentication status
 */
exports.getAuthStatus = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({
        authenticated: false,
        googleConnected: false
      });
    }

    const userResult = await pool.query(
      'SELECT email, google_tokens FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        authenticated: false,
        googleConnected: false
      });
    }

    const user = userResult.rows[0];

    res.json({
      authenticated: true,
      email: user.email,
      googleConnected: !!user.google_tokens
    });
  } catch (error) {
    console.error('Error getting auth status:', error);
    res.status(500).json({ error: 'Failed to get authentication status' });
  }
};

/**
 * Logout user
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
};
