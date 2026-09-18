import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-2026';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: UserSession): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}
