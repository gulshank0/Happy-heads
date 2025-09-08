import { Request, Response } from 'express';
import passport from 'passport';

class AuthController {
  static googleAuth(req: Request, res: Response) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res);
  }

  static googleAuthCallback(req: Request, res: Response) {
    interface AuthenticateCallback {
      (err: any, user?: any, info?: any): void;
    }

    interface PassportAuthenticateOptions {
      failureRedirect: string;
    }

    passport.authenticate('google', { failureRedirect: '/' }, (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ error: 'Authentication failed' });
      }
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      req.logIn(user, (err: any) => {
        if (err) {
          return res.status(500).json({ error: 'Login failed' });
        }
        return res.redirect('/user/data'); // Redirect to user data page after successful login
      });
    })(req, res);
  }

  static logout(req: Request, res: Response) {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.redirect('/'); // Redirect to home page after logout
    });
  }
}

export default AuthController;