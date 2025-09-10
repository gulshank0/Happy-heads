import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import prisma from './database'; // Import the default export

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Use the imported prisma instance directly
    let user = await prisma.user.findUnique({
      where: { googleId: profile.id }
    });

    if (user) {
      // Update user with latest Google profile info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: profile.displayName || user.name,
          email: profile.emails?.[0]?.value || user.email,
          avatar: profile.photos?.[0]?.value || user.avatar,
          updatedAt: new Date()
        }
      });
      return done(null, user);
    }

    // If user doesn't exist, create a new user
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