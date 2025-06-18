'use client'

import Link from 'next/link'
import { Settings } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAdmin = localStorage.getItem('isAdmin')
      if (isAdmin !== 'true') {
        alert('관리자만 접근 가능합니다.')
        router.replace('/login')
      }
    }
  }, [])

  // 회원등록, 오디오파일 업로드, 설정만 노출
  const adminFeatures = [
    {
      title: '회원등록',
      description: '관리자/일반회원 등록 및 관리',
      href: '/admin/auth-test',
      icon: undefined,
      color: 'text-blue-600',
    },
    {
      title: '오디오파일 업로드',
      description: '오픽 음성 파일을 업로드합니다',
      href: '/admin/upload',
      icon: undefined,
      color: 'text-green-600',
    },
    {
      title: '설정',
      description: '시스템 설정을 관리합니다',
      href: '/admin/settings',
      icon: Settings,
      color: 'text-gray-600',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => {
            const IconComponent = feature.icon
            return (
              <Link key={feature.href} href={feature.href}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    {IconComponent && <IconComponent className={`w-8 h-8 ${feature.color}`} />}
                    <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                    시작하기
                  </button>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">빠른 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">33</div>
              <p className="text-gray-600">총 문제 수</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">11</div>
              <p className="text-gray-600">테마 수</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">1</div>
              <p className="text-gray-600">문제 유형</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <p className="text-gray-600">데이터 완성도</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 