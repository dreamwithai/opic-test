'use client'

import { Settings, Mic, Smartphone } from 'lucide-react'
import AdminGuard from '@/components/AdminGuard'
import Link from 'next/link'

export default function AdminPage() {
  const adminFeatures = [
    {
      title: '회원조회',
      description: '일자별로 등록한 회원을 조회합니다',
      href: '/admin/member-list',
      icon: undefined,
    },
    {
      title: '오디오파일 업로드',
      description: '오픽 음성 파일을 업로드합니다',
      href: '/admin/upload',
      icon: undefined,
    },
    {
      title: 'STT 테스트',
      description: '음성 인식 기능을 테스트합니다',
      href: '/admin/stt-test',
      icon: Mic,
    },
    {
      title: '모바일 STT 설정',
      description: '모바일 기기의 STT 동작 방식을 설정합니다.',
      href: '/admin/stt-settings',
      icon: Smartphone,
    },
    {
      title: '설정',
      description: '시스템 설정을 관리합니다',
      href: '/admin/settings',
      icon: Settings,
    },
  ]

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 font-sans">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminFeatures.map((feature) => {
              const IconComponent = feature.icon
              return (
                <Link key={feature.href} href={feature.href}>
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        {IconComponent && <IconComponent className="w-8 h-8 text-gray-600" />}
                        <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                      </div>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                    <button className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                      이동하기
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}
