import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Accès non autorisé' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Session expirée' });
    req.user = user;
    next();
  });
};

export const optionalAuthenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
};

