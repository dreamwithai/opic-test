'use client';

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, border: '1px solid #eee', borderRadius: 8, textAlign: 'center' }}>
      <h2 style={{ marginBottom: 24 }}>소셜 로그인</h2>
      <div style={{ marginBottom: 16 }}>
        <p>소셜 계정으로 간편하게 로그인하세요.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{
            padding: '12px 24px',
            background: '#4285F4',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Google 계정으로 로그인
        </button>
        <button
          onClick={() => signIn('kakao', { callbackUrl: '/' })}
          style={{
            padding: '12px 24px',
            background: '#FEE500',
            color: '#000000',
            border: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          카카오 계정으로 로그인
        </button>
        <button
          onClick={() => signIn('naver', { callbackUrl: '/' })}
          style={{
            padding: '12px 24px',
            background: '#03C75A',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          네이버 계정으로 로그인
        </button>
      </div>
    </div>
  )
} 