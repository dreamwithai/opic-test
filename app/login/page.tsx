'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

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

    // 로그인 정보 localStorage에 저장
    localStorage.setItem('member', JSON.stringify(data));
    if (data.type === 'admin') {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin');
    } else {
      localStorage.setItem('isAdmin', 'false');
      router.push('/'); // 일반회원은 홈으로 이동
    }
  };

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