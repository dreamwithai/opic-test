import jwt from 'jsonwebtoken';

// 토큰 만료 시간 (24시간)
const TOKEN_EXPIRY = '24h';

export interface UserData {
  userId: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * 사용자 데이터를 JWT 토큰으로 암호화 (더 이상 사용하지 않음)
 */
// export function createUserToken(userData: UserData): string {
//   return jwt.sign(userData, JWT_SECRET, { 
//     expiresIn: TOKEN_EXPIRY 
//   });
// }

/**
 * JWT 토큰을 복호화하여 사용자 데이터 반환 (RS256 공개키 검증)
 */
export function verifyUserToken(token: string): UserData | null {
  try {
    const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY as string;
    const decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] }) as UserData;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * 토큰이 유효한지 확인 (RS256 공개키 검증)
 */
export function isTokenValid(token: string): boolean {
  try {
    const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY as string;
    jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
    return true;
  } catch {
    return false;
  }
} 