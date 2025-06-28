'use client';

import { signIn } from 'next-auth/react'
import ImageWithFallback from '../components/ImageWithFallback'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <div className="mx-auto mb-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-600">강지완's 4시간 오픽</span>
          <span className="text-sm text-gray-500 mt-1">AI 오픽 모의고사 서비스</span>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">로그인</h1>
        <p className="text-center text-gray-500 mb-6">SNS 계정으로 간편하게 시작하세요</p>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-md py-2 mb-3 hover:bg-gray-100"
        >
          <img src="/google-logo.svg" alt="구글" className="w-5 h-5 mr-2" />
          구글로 시작
        </button>
        <button
          onClick={() => signIn('kakao', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center bg-yellow-400 rounded-md py-2 mb-3 hover:bg-yellow-300"
        >
          <img src="/kakao-logo.svg" alt="카카오" className="w-5 h-5 mr-2" />
          카카오로 시작
        </button>
        <button
          onClick={() => signIn('naver', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center bg-green-500 text-white rounded-md py-2 hover:bg-green-600"
        >
          <img src="/naver-logo.svg" alt="네이버" className="w-5 h-5 mr-2" />
          네이버로 시작
        </button>
      </div>
    </div>
  )
} 