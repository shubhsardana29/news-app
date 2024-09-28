import { Request, Response } from 'express';
import { prisma } from '../app';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export const signup = async (req: Request, res: Response) => {
  try {
    const { username, password, name, city } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        city,
      },
    });
    const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret);
    res.json({ token });
  } catch (error) {
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
      res.status(500).json({ error: 'An error occurred during signin' });
    }
  };