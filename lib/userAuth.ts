import { verifyUserToken, UserData } from './jwt';

/**
 * localStorage에서 사용자 데이터 가져오기
 */
export function getUserData(): UserData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return null;
    
    const userData = JSON.parse(userDataStr) as UserData;
    return userData;
  } catch (error) {
    console.error('Failed to get user data:', error);
    return null;
  }
}

/**
 * 사용자 ID 가져오기
 */
export function getUserId(): string | null {
  const userData = getUserData();
  return userData?.userId || null;
}

/**
 * 사용자 역할 가져오기
 */
export function getUserRole(): string | null {
  const userData = getUserData();
  return userData?.role || null;
}

/**
 * 로그인 상태 확인
 */
export function isLoggedIn(): boolean {
  return getUserId() !== null;
}

/**
 * 사용자 데이터 삭제 (로그아웃)
 */
export function clearUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('userData');
}

/**
 * JWT 토큰으로 사용자 데이터 설정
 */
export function setUserDataFromToken(token: string): boolean {
  try {
    const userData = verifyUserToken(token);
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to set user data from token:', error);
    return false;
  }
} 