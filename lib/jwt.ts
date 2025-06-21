import jwt from 'jsonwebtoken';

export interface UserData {
  userId: string;
  role: string;
  [key: string]: any;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';

/**
 * JWT 토큰 검증
 */
export function verifyUserToken(token: string): UserData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserData;
    return decoded;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
} 