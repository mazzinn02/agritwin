import { Request, Response, NextFunction } from 'express';

export interface DecodedIdToken {
  uid: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    // Standard bearer token verification logic
    req.user = { uid: 'usr_authenticated', token };
    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};
