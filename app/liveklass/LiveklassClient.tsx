"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '../components/useUserStore';
import { verifyUserTokenBrowser } from '@/lib/jwtVerifyBrowser';

export default function LiveklassClient() {
  const { setMember } = useUserStore();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Height 전송 함수
  const sendHeight = () => {
    if (containerRef.current && window.parent !== window) {
      const height = containerRef.current.scrollHeight;
      window.parent.postMessage({
        type: 'setHeight',
        height: height
      }, '*');
    }
  };

  // 초기 height 전송 및 resize 이벤트 리스너
  useEffect(() => {
    // 초기 height 전송
    setTimeout(sendHeight, 100);

    // resize 이벤트 리스너
    const handleResize = () => {
      sendHeight();
    };

    window.addEventListener('resize', handleResize);
    
    // MutationObserver로 DOM 변경 감지
    const observer = new MutationObserver(sendHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  // 상태 변경 시 height 재계산
  useEffect(() => {
    sendHeight();
  }, [loading, error]);

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
      
      // Height 요청 처리
      if (event.data?.type === 'requestHeight') {
        sendHeight();
        return;
      }

      if (event.data && event.data.type === 'auth' && event.data.token) {
        console.log('Received auth token:', event.data.token);
        verifyUserTokenBrowser(event.data.token).then(decoded => {
          console.log('JWT verification result:', decoded);
          if (decoded && decoded.userId) {
            setLoading(true);
            handleJWTLogin(decoded.userId);
          } else {
            setError('JWT 검증 실패');
          }
        });
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
      
      // 로그인 성공 메시지 전송
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'loginSuccess'
        }, '*');
      }
      
      setLoading(false); // 로그인 성공 시 로딩 해제
      // window.location.replace('/'); // 일단 주석 처리
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} style={{textAlign:'center',marginTop:100,fontSize:22,minHeight:200}}>
      {loading ? '자동 로그인 중...' : error ? error : 'Liveklass 인증 대기 중...'}
    </div>
  );
} 