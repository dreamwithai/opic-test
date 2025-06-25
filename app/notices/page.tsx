'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Notice } from '@/app/data/types'
import Breadcrumb from '../components/Breadcrumb'
import FullScreenLoader from '../components/FullScreenLoader'
import { AlertTriangle, FileText, Eye, Calendar, User } from 'lucide-react'
import dayjs from 'dayjs'

export default function NoticesPage() {
  const { data: session, status } = useSession()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    fetchNotices()
  }, [status, currentPage])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notices?page=${currentPage}&limit=10`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch notices')
      }

      const data = await response.json()
      setNotices(data.notices)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching notices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            긴급
          </span>
        )
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            중요
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FileText className="w-3 h-3 mr-1" />
            일반
          </span>
        )
    }
  }

  if (status === 'loading') {
    return <FullScreenLoader />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: '홈', href: '/' },
            { label: '공지사항', href: '/notices' }
          ]} 
        />

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">공지사항</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">중요한 소식과 업데이트를 확인하세요</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">등록된 공지사항이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {notices.map((notice) => (
                  <div key={notice.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <Link href={`/notices/${notice.id}`} className="block">
                      {/* 1행: 중요도, 작성자|작성일 */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex-shrink-0">
                          {getPriorityBadge(notice.priority)}
                        </div>
                        <div className="text-xs text-gray-400 ml-2 whitespace-nowrap flex-shrink-0">
                          {notice.author_name} | {dayjs(notice.created_at).format('YYYY.MM.DD HH:mm')}
                        </div>
                      </div>
                      {/* 2행: 타이틀 */}
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {notice.title}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      이전
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
} 