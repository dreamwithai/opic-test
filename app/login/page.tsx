'use client';

import { signIn } from 'next-auth/react'
import ImageWithFallback from '../components/ImageWithFallback'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 pt-40">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">소셜 로그인</h2>
          <p className="mt-2 text-sm text-gray-600">
            소셜 계정으로 간편하게 시작하세요.
          </p>
        </div>
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ImageWithFallback src="/google-logo.svg" alt="Google" width={20} height={20} className="mr-3" fallbackSrc="/google-logo.svg" />
            Google 계정으로 시작하기
          </button>
          <button
            onClick={() => signIn('kakao', { callbackUrl: '/' })}
            style={{ backgroundColor: '#FEE500' }}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-black rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
          >
            <ImageWithFallback src="/kakao-logo.svg" alt="Kakao" width={20} height={20} className="mr-3" fallbackSrc="/kakao-logo.svg" />
            카카오 계정으로 시작하기
          </button>
          <button
            onClick={() => signIn('naver', { callbackUrl: '/' })}
            style={{ backgroundColor: '#03C75A' }}
            className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ImageWithFallback src="/naver-logo.svg" alt="Naver" width={20} height={20} className="mr-3" fallbackSrc="/naver-logo.svg" />
            네이버 계정으로 시작하기
          </button>
        </div>
      </div>
    </div>
  )
} 