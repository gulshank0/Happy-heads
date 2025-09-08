import { Request, Response, NextFunction } from 'express';

export const validateUserRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { avatar, name, email } = req.body;

  if (!avatar || !name || !email) {
    return res.status(400).json({ error: "Avatar, name, and email are required" });
  }

  // Additional validation logic can be added here

  next();
};