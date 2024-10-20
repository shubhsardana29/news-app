import { Request, Response } from 'express';
import { prisma } from '../app';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { verifyGoogleToken } from '../utils/googleAuth';

function extractUsernameFromEmail(email: string): string {
  return email.split('@')[0];
}

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, name, city, email } = req.body;
    
    // Validate required fields
    if (!username || !password || !name || !email) {
      res.status(400).json({ error: 'Username, password, name, and email are required' });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });
    
    if (existingUser) {
      res.status(400).json({ error: 'Username or email already in use' });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        city,
        email,
      },
    });
    
    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret);
    res.json({ token });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'An error occurred during signup' });
  }
};

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      res.status(400).json({ error: 'Invalid username or password' });
      return;
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Invalid username or password' });
      return;
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret);
    res.json({ token });
  } catch (error) {
    console.error('Error during signin:', error);
    res.status(500).json({ error: 'An error occurred during signin' });
  }
};

export const getUserFromGoogleToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const googleToken = req.query.googleToken;
    
    if (!googleToken || typeof googleToken !== 'string') {
      res.status(400).json({ error: 'Google token is required' });
      return;
    }
    
    const googleUser = await verifyGoogleToken(googleToken);
    
    if (!googleUser.email) {
      res.status(400).json({ error: 'Email is required from Google authentication' });
      return;
    }

    const extractedUsername = extractUsernameFromEmail(googleUser.email);

    
    let user = await prisma.user.findUnique({ where: { googleId: googleUser.googleId } });
    
    if (!user) {
      // Create a new user if they don't exist
      user = await prisma.user.create({
        data: {
          googleId: googleUser.googleId,
          username: extractedUsername, 
          name: googleUser.name || 'Google User', // Provide a default name if not available
          email: googleUser.email,
          profileImageUrl: googleUser.profileImageUrl,
          // Generate a random password for Google users
          password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        },
      });
    }
    else {
      // Update existing user's profile image URL if it has changed
      if (user.profileImageUrl !== googleUser.profileImageUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { profileImageUrl: googleUser.profileImageUrl },
        });
      }
    }
    
    const token = jwt.sign({ userId: user.id, userName: user.username }, config.jwtSecret);
    res.json({
        userId: user.id,
        userName: user.username,
        name: user.name,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        token: token
    });
  } catch (error) {
    console.error('Error in Google token verification:', error);
    res.status(401).json({ error: 'Invalid Google token' });
  }
};