import express from 'express';
import passport from 'passport';

const router = express.Router();

// Start Google OAuth flow
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/?success=false` }),
  (req, res) => {
    // Successful authentication, redirect to frontend with success flag
    res.redirect(`${process.env.FRONTEND_URL}/?success=true`);
  }
);

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to clear session' });
      }
      
      // Clear session cookie
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Get current authenticated user
router.get('/me', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      user: req.user,
      authenticated: true
    });
  } else {
    res.status(401).json({ 
      error: 'Not authenticated',
      authenticated: false
    });
  }
});

export default router;