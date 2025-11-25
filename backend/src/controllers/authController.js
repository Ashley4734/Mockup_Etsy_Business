const pool = require('../config/database');
const GoogleDriveService = require('../services/googleDrive');
const EtsyService = require('../services/etsy');
const crypto = require('crypto');

// Temporary storage for OAuth state and code verifiers
// In production, consider using Redis
const oauthStateStore = new Map();

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
 * Initiate Etsy OAuth flow
 */
exports.initiateEtsyAuth = (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Please authenticate with Google first' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const { url, codeVerifier } = EtsyService.getAuthUrl(state);

    // Store state and code verifier
    oauthStateStore.set(state, {
      codeVerifier,
      userId: req.session.userId,
      timestamp: Date.now()
    });

    // Clean up old state entries (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of oauthStateStore.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        oauthStateStore.delete(key);
      }
    }

    res.redirect(url);
  } catch (error) {
    console.error('Error initiating Etsy auth:', error);
    res.status(500).json({ error: 'Failed to initiate Etsy authentication' });
  }
};

/**
 * Handle Etsy OAuth callback
 */
exports.handleEtsyCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=no_code`);
    }

    // Verify state
    const storedData = oauthStateStore.get(state);
    if (!storedData) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=invalid_state`);
    }

    oauthStateStore.delete(state);

    // Exchange code for tokens
    const tokens = await EtsyService.getTokensFromCode(code, storedData.codeVerifier);

    // Get user's shop info
    const etsyService = new EtsyService(tokens);
    const shops = await etsyService.getUserShops();
    const shopId = shops.length > 0 ? shops[0].shop_id : null;

    // Update user record
    await pool.query(
      'UPDATE users SET etsy_tokens = $1, etsy_shop_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [JSON.stringify(tokens), shopId, storedData.userId]
    );

    // Update session
    req.session.etsyTokens = tokens;
    req.session.etsyShopId = shopId;

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?etsy_auth=success`);
  } catch (error) {
    console.error('Error handling Etsy callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=etsy_auth_failed`);
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
        googleConnected: false,
        etsyConnected: false
      });
    }

    const userResult = await pool.query(
      'SELECT email, google_tokens, etsy_tokens, etsy_shop_id FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        authenticated: false,
        googleConnected: false,
        etsyConnected: false
      });
    }

    const user = userResult.rows[0];

    res.json({
      authenticated: true,
      email: user.email,
      googleConnected: !!user.google_tokens,
      etsyConnected: !!user.etsy_tokens,
      etsyShopId: user.etsy_shop_id
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
