import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.jwtToken as string;

  let token: string | undefined;

  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (queryToken) {
    token = queryToken;
  }

  if (token) {
    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user as { id: string; username: string };
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

export const optionalAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const queryToken = req.query.jwtToken as string;

  let token: string | undefined;

  if (authHeader) {
    token = authHeader.split(' ')[1];
  } else if (queryToken) {
    token = queryToken;
  }

  if (token) {
    jwt.verify(token, config.jwtSecret, (err, user) => {
      if (!err) {
        req.user = user as { id: string; username: string };
      }
    });
  }
  next();
};