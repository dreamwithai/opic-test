'use client'

import Link from 'next/link'
import { FileText, Upload, BarChart3, Settings, Database, Mic } from 'lucide-react'

export default function AdminPage() {
  const adminFeatures = [
    {
      title: 'CSV → JSON 변환기',
      description: 'CSV 파일을 OPIc JSON 형태로 변환합니다',
      href: '/admin/csv-converter',
      icon: Upload,
      color: 'text-blue-600',
    },
    {
      title: '문제 관리',
      description: '기존 문제를 편집하고 관리합니다',
      href: '/admin/questions',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: '통계',
      description: '문제별, 테마별 통계를 확인합니다',
      href: '/admin/statistics',
      icon: BarChart3,
      color: 'text-purple-600',
    },
    {
      title: '데이터 백업',
      description: 'JSON 파일을 백업하고 복원합니다',
      href: '/admin/backup',
      icon: Database,
      color: 'text-orange-600',
    },
    {
      title: 'STT 기능 테스트',
      description: '모바일 STT 기능을 종합적으로 테스트합니다',
      href: '/admin/stt-test',
      icon: Mic,
      color: 'text-red-600',
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OPIc Admin</h1>
              <p className="text-gray-600 mt-1">문제 데이터 관리 시스템</p>
            </div>
            <Link href="/">
              <button className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                메인으로 돌아가기
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => {
            const IconComponent = feature.icon
            return (
              <Link key={feature.href} href={feature.href}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer h-full p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <IconComponent className={`w-8 h-8 ${feature.color}`} />
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