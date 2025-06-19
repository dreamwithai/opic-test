"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '../components/useUserStore';

export default function LiveklassClient() {
  const { setMember } = useUserStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Origin 검증 (liveklass.com 또는 localhost)
      const allowedOrigins = [
        'https://liveklass.com',
        'https://www.liveklass.com',
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://127.0.0.1:3000',
        'http://localhost:3001',
        'https://localhost:3001',
      ];
      if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) return;
      if (event.data && event.data.type === 'auth' && event.data.token) {
        try {
          const parts = event.data.token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const receivedUserId = payload.userId;
            if (receivedUserId) {
              setLoading(true);
              handleJWTLogin(receivedUserId);
            }
          }
        } catch (e) {
          setError('JWT 토큰 파싱 오류');
        }
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleJWTLogin = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('name', userId)
        .single();
      if (error || !data) {
        setError('회원 정보가 없습니다.');
        setLoading(false);
        return;
      }
      setMember(data);
      localStorage.setItem('member', JSON.stringify(data));
      if (data.type === 'admin') {
        localStorage.setItem('isAdmin', 'true');
      } else {
        localStorage.setItem('isAdmin', 'false');
      }
      window.location.replace('/');
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div style={{textAlign:'center',marginTop:100,fontSize:22}}>
      {loading ? '자동 로그인 중...' : error ? error : 'Liveklass 인증 대기 중...'}
    </div>
  );
} 