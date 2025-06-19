import jwt from 'jsonwebtoken';

// JWT 시크릿 키 (실제 운영에서는 환경변수로 관리)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 토큰 만료 시간 (24시간)
const TOKEN_EXPIRY = '24h';

export interface UserData {
  userId: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * 사용자 데이터를 JWT 토큰으로 암호화
 */
export function createUserToken(userData: UserData): string {
  return jwt.sign(userData, JWT_SECRET, { 
    expiresIn: TOKEN_EXPIRY 
  });
}

/**
 * JWT 토큰을 복호화하여 사용자 데이터 반환
 */
export function verifyUserToken(token: string): UserData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserData;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * 토큰이 유효한지 확인
 */
export function isTokenValid(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
} 