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
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed`
  }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current authenticated user
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
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