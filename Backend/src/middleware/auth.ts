import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database'; // Use the correct import

// Extend Express Request type to include user with id
declare global {
  namespace Express {
    interface User {
      id: string;
      [key: string]: any;
    }
  }
}

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: 'Not authenticated' });
};

// Add the missing requireAuth middleware
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: 'Authentication required' });
};

export class UserController {
  static async createUser(req: Request, res: Response) {
    const { name, email, age, phone, bio, gender, googleId } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      const user = await prisma.user.create({
        data: { name, email, age, phone, bio, gender, googleId }
      });

      console.log("User data saved:", user);
      return res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      console.error("Error saving user data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getUserData(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany();
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}