/**
 * Middleware to check if user is authenticated
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

/**
 * Middleware to check if Google Drive is connected
 */
const requireGoogleAuth = (req, res, next) => {
  if (!req.session || !req.session.googleTokens) {
    return res.status(401).json({ error: 'Google Drive authentication required' });
  }
  next();
};

/**
 * Middleware to check if Etsy is connected
 */
const requireEtsyAuth = (req, res, next) => {
  if (!req.session || !req.session.etsyTokens) {
    return res.status(401).json({ error: 'Etsy authentication required' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireGoogleAuth,
  requireEtsyAuth
};
