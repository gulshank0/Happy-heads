import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './database'; // Import the default export

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Use the imported prisma instance directly
    let user = await prisma.user.findFirst({
      where: { googleId: profile.id }
    });

    if (user) {
      // Prepare update data - preserve custom avatar if it exists
      const updateData: any = {
        name: profile.displayName || user.name,
        email: profile.emails?.[0]?.value || user.email,
        updatedAt: new Date()
      };

      // Only update avatar from Google if user doesn't have a custom uploaded avatar
      const googleAvatarUrl = profile.photos?.[0]?.value;
      const hasCustomAvatar = user.avatar && user.avatar.includes('/uploads/avatars/');
      
      if (!hasCustomAvatar && googleAvatarUrl) {
        updateData.avatar = googleAvatarUrl;
      }
      
      // Update user with preserved custom avatar
      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      });
      return done(null, user);
    }

    // If user doesn't exist, create a new user with Google avatar
    user = await prisma.user.create({
      data: {
        googleId: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        avatar: profile.photos?.[0]?.value || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return done(null, user);
  } catch (error) {
    console.error('Passport Google Strategy Error:', error);
    return done(error, false);
  }
}));

  console.log('✅ Google OAuth configured');
} else {
  console.log('⚠️ Google OAuth not configured - GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing');
}

// Serialize user for the session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});

export default passport;