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

export function MyPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-2">
          모의고사 홈 &gt; IM2 &gt; 선택주제 &gt; 답변피드백 &gt; <span className="font-semibold text-black">마이페이지</span>
        </div>
        {/* Title */}
        <h1 className="text-2xl font-bold mb-1">5. 마이페이지</h1>
        <div className="text-gray-600 mb-6">내 응시내역을 보실수 있습니다.</div>
        {/* Table */}
        <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">No.</th>
                <th className="px-4 py-2">테스트 일자</th>
                <th className="px-4 py-2">테스트 항목</th>
                <th className="px-4 py-2">내 답변</th>
                <th className="px-4 py-2">전문가 피드백</th>
                <th className="px-4 py-2">상세</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i} className="border-b last:border-b-0">
                  <td className="px-4 py-2">{10 - i}</td>
                  <td className="px-4 py-2">2025-06-{10 - i}</td>
                  <td className="px-4 py-2">모의고사 2회</td>
                  <td className="px-4 py-2 truncate max-w-xs">제 취미는 영화 감상입니다. 저는...</td>
                  <td className="px-4 py-2 truncate max-w-xs">귀하의 답변은 기본적인 어휘력...</td>
                  <td className="px-4 py-2"><button className="text-blue-600 underline">상세보기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center mt-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">새 테스트 시작하기</button>
        </div>
      </div>
    </div>
  );
} 