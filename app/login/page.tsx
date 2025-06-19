'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '../components/useUserStore';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isJWTLoggingIn, setIsJWTLoggingIn] = useState(false);
  const router = useRouter();
  const { setMember } = useUserStore();

  // JWT 토큰 자동 로그인 처리
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      console.log("postMessage 수신:", event);
      // Origin 검증 (liveklass.com 또는 localhost)
      const allowedOrigins = [
        'https://liveklass.com',
        'https://www.liveklass.com',
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000'
      ];
      if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) return;
      if (event.data && event.data.type === 'auth' && event.data.token) {
        // JWT 토큰에서 사용자 ID 추출
        try {
          const parts = event.data.token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const receivedUserId = payload.userId;
            if (receivedUserId) {
              setIsJWTLoggingIn(true);
              // 로그인 처리 함수 호출
              console.log("handleJWTLogin 호출 예정:", receivedUserId);
              handleJWTLogin(receivedUserId);
            }
          }
        } catch (e) {
          console.error("JWT 파싱 에러:", e);
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line
  }, []);

  // JWT 로그인 처리 함수
  const handleJWTLogin = async (userId: string) => {
    console.log("handleJWTLogin 진입:", userId);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('name', userId)
      .single();
    console.log("supabase 쿼리 결과:", { data, error });
    if (error || !data) {
      setIsJWTLoggingIn(false);
      console.log("JWT 로그인 실패:", error);
      return;
    }
    setMember(data);
    console.log("setMember 호출:", data);
    localStorage.setItem('member', JSON.stringify(data));
    if (data.type === 'admin') {
      localStorage.setItem('isAdmin', 'true');
    } else {
      localStorage.setItem('isAdmin', 'false');
    }
    console.log("메인으로 이동 직전");
    window.location.replace('/');
  };

  const handleLogin = async () => {
    setError('');
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('name', name)
      .single();
    if (error || !data) {
      setError('회원 정보가 없습니다.');
      return;
    }
    setMember(data);
    localStorage.setItem('member', JSON.stringify(data));
    if (data.type === 'admin') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
    } else {
      localStorage.setItem('isAdmin', 'false');
      router.push('/');
    }
  };

  if (isJWTLoggingIn) {
    return <div style={{textAlign:'center',marginTop:100,fontSize:22}}>로딩중...</div>;
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>로그인</h2>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="이름 또는 이메일 입력"
        style={{ padding: 8, width: '100%', marginBottom: 12 }}
      />
      <button
        onClick={handleLogin}
        style={{
          padding: '10px 20px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 'bold',
          fontSize: 16,
          cursor: 'pointer'
        }}
      >
        로그인
      </button>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </div>
  );
} 