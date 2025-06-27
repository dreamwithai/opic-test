'use client'

import { useState, useEffect } from 'react'
import { Settings, Mic, Smartphone, FileText, MessageSquare, BarChart3, Users, TrendingUp, Clock, AlertTriangle, Plus, Search, ArrowRight } from 'lucide-react'
import AdminGuard from '@/components/AdminGuard'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import dayjs from 'dayjs'

interface DashboardStats {
  totalMembers: number
  todayMembers: number
  pendingInquiries: number
  publishedNotices: number
  recentActivity: any[]
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    todayMembers: 0,
    pendingInquiries: 0,
    publishedNotices: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // 회원 통계
      const today = dayjs().startOf('day').toISOString()
      const { count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
      
      const { count: todayMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)

      // 대기중인 문의사항
      const { count: pendingInquiries } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // 공개된 공지사항
      const { count: publishedNotices } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)

      setStats({
        totalMembers: totalMembers || 0,
        todayMembers: todayMembers || 0,
        pendingInquiries: pendingInquiries || 0,
        publishedNotices: publishedNotices || 0,
        recentActivity: []
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const adminFeatures = [
    {
      title: '회원조회',
      description: '일자별로 등록한 회원을 조회합니다',
      href: '/admin/member-list',
      icon: Users,
      color: 'bg-blue-500',
      quickAction: true
    },
    {
      title: '시험 응시 데이터',
      description: '시험 응시 데이터를 조회하고 다운로드합니다',
      href: '/admin/test-results',
      icon: BarChart3,
      color: 'bg-green-500',
      quickAction: true
    },
    {
      title: '공지사항',
      description: '공지사항을 작성하고 관리합니다',
      href: '/admin/notices',
      icon: FileText,
      color: 'bg-purple-500',
      quickAction: true
    },
    {
      title: '1:1 문의하기',
      description: '사용자 1:1 문의사항을 확인하고 답변할 수 있습니다',
      href: '/admin/inquiries',
      icon: MessageSquare,
      color: 'bg-orange-500',
      quickAction: true
    },
    {
      title: '오디오파일 업로드',
      description: '오픽 음성 파일을 업로드합니다',
      href: '/admin/upload',
      icon: undefined,
      color: 'bg-gray-500',
      quickAction: false
    },
    {
      title: 'STT 테스트',
      description: '음성 인식 기능을 테스트합니다',
      href: '/admin/stt-test',
      icon: Mic,
      color: 'bg-red-500',
      quickAction: false
    },
    {
      title: '모바일 STT 설정',
      description: '모바일 기기의 STT 동작 방식을 설정합니다.',
      href: '/admin/stt-settings',
      icon: Smartphone,
      color: 'bg-indigo-500',
      quickAction: false
    },
    {
      title: '설정',
      description: '시스템 설정을 관리합니다',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-600',
      quickAction: false
    },
  ]

  const quickActions = adminFeatures.filter(f => f.quickAction)
  const allFeatures = adminFeatures.filter(f => 
    !searchTerm || 
    f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const StatCard = ({ title, value, icon: Icon, color, href }: any) => (
    <Link href={href || '#'}>
      <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? '...' : value}</p>
          </div>
          <div className={`p-3 rounded-full ${color} text-white`}>
            {Icon && <Icon className="w-6 h-6" />}
          </div>
        </div>
      </div>
    </Link>
  )

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 font-sans">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
            <p className="text-gray-600">시스템 현황을 한눈에 확인하고 관리하세요</p>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <StatCard
              title="전체 회원"
              value={stats.totalMembers.toLocaleString()}
              icon={Users}
              color="bg-blue-500"
              href="/admin/member-list"
            />
            <StatCard
              title="오늘 가입"
              value={stats.todayMembers}
              icon={TrendingUp}
              color="bg-green-500"
              href="/admin/member-list"
            />
            <StatCard
              title="대기 문의"
              value={stats.pendingInquiries}
              icon={Clock}
              color="bg-orange-500"
              href="/admin/inquiries"
            />
            <StatCard
              title="공개 공지"
              value={stats.publishedNotices}
              icon={FileText}
              color="bg-purple-500"
              href="/admin/notices"
            />
          </div>

          {/* 검색 및 전체 기능 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">메뉴 검색</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="기능 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {allFeatures.map((feature) => {
                const isQuickAction = feature.quickAction
                return (
                  <Link key={feature.href} href={feature.href}>
                    <div className={`rounded-lg p-4 lg:p-6 transition-all cursor-pointer border h-full ${
                      isQuickAction 
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:from-blue-100 hover:to-indigo-100' 
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}>
                      <div className="flex items-start justify-between mb-3 lg:mb-4">
                        <h3 className={`text-base lg:text-lg font-semibold flex-1 ${
                          isQuickAction ? 'text-blue-900' : 'text-gray-900'
                        }`}>{feature.title}</h3>
                        <ArrowRight className={`w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 ${
                          isQuickAction ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                      </div>
                      <p className={`text-sm line-clamp-2 ${
                        isQuickAction ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {feature.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
            
            {allFeatures.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}
