import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma client only when needed
let prisma: any = null;

const getPrismaClient = async () => {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
};

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const prismaClient = await getPrismaClient();
    
    // Check if user already exists in our database
    let user = await prismaClient.user.findUnique({
      where: { googleId: profile.id }
    });

    if (user) {
      // User exists, return the user
      return done(null, user);
    }

    // User doesn't exist, create a new user
    user = await prismaClient.user.create({
      data: {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || '',
        avatar: profile.photos?.[0]?.value || ''
      }
    });

    return done(null, user);
  } catch (error) {
    console.error('Error in Google Strategy:', error);
    return done(error, false);
  }
}));

// Serialize user for session storage
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const prismaClient = await getPrismaClient();
    const user = await prismaClient.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});