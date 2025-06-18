'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthTestPage() {
  return <AuthTestUI />;
}

function AuthTestUI() {
  const [memberName, setMemberName] = useState('');
  const [memberResult, setMemberResult] = useState('');
  const [loading, setLoading] = useState(false);

  // 일반회원 등록
  const handleRegisterUser = async () => {
    setLoading(true);
    setMemberResult('');
    const { error } = await supabase.from('members').insert([{ name: memberName, type: 'user' }]);
    if (error) {
      setMemberResult('❌ 등록 실패: ' + error.message);
    } else {
      setMemberResult('✅ 일반회원 등록 성공!');
      setMemberName('');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>일반회원 등록</h2>
      <input
        type="text"
        value={memberName}
        onChange={e => setMemberName(e.target.value)}
        placeholder="이름 또는 이메일 입력"
        style={{ padding: 8, width: '70%', marginRight: 8 }}
      />
      <button
        onClick={handleRegisterUser}
        disabled={loading || !memberName}
        style={{
          padding: '10px 20px',
          background: loading || !memberName ? '#90cdf4' : '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 'bold',
          fontSize: 16,
          cursor: loading || !memberName ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}
        onMouseOver={e => {
          if (!(loading || !memberName)) e.currentTarget.style.background = '#1d4ed8';
        }}
        onMouseOut={e => {
          if (!(loading || !memberName)) e.currentTarget.style.background = '#2563eb';
        }}
      >
        일반회원 등록
      </button>
      <div style={{ marginTop: 12, minHeight: 24, color: memberResult.startsWith('✅') ? 'green' : 'red' }}>{memberResult}</div>
    </div>
  );
} 