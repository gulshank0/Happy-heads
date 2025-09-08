import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserController {
  static async createUser(req: Request, res: Response) {
    const { avatar, name, email, age, phone, bio } = req.body;

    if (!avatar || !name || !email) {
      return res.status(400).json({ error: "Avatar, name, and email are required" });
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }

      const user = await prisma.user.create({
        data: { avatar, name, email, googleId: ''}
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