'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Notice } from '@/app/data/types'
import AdminGuard from '@/components/AdminGuard'
import { Plus, Edit, Trash2, Eye, Calendar, User, AlertTriangle, FileText, Search, Filter, BarChart3, EyeOff, TrendingUp, ArrowLeft, Home } from 'lucide-react'
import dayjs from 'dayjs'
import Link from 'next/link'

export default function AdminNoticesPage() {
  return (
    <AdminGuard>
      <AdminNoticesUI />
    </AdminGuard>
  )
}

function AdminNoticesUI() {
  const { data: session, status } = useSession()
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotices()
    }
  }, [status, currentPage])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      const response = await fetch(`/api/notices?${params}`)
      
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

  const handleDelete = async (noticeId: string) => {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete notice')
      }

      // 목록 새로고침
      fetchNotices()
    } catch (error) {
      console.error('Error deleting notice:', error)
      alert('삭제 중 오류가 발생했습니다.')
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

  const getStatusBadge = (isPublished: boolean) => {
    return isPublished ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        공개
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        비공개
      </span>
    )
  }

  const stats = {
    total: notices.length,
    published: notices.filter(n => n.is_published).length,
    draft: notices.filter(n => !n.is_published).length,
    urgent: notices.filter(n => n.priority === 2).length,
    totalViews: notices.reduce((sum, n) => sum + (n.view_count || 0), 0)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 네비게이션 */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              어드민 홈
            </Link>
          </div>
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항 관리</h1>
              <p className="text-gray-600">공지사항을 작성하고 관리하세요</p>
            </div>
            <Link
              href="/admin/notices/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              공지사항 작성하기
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">전체 공지</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <Eye className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">공개</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </div>
          <div className="hidden lg:block bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <EyeOff className="w-8 h-8 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">비공개</p>
                <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">긴급</p>
                <p className="text-2xl font-bold text-gray-900">{stats.urgent}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">총 조회수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">등록된 공지사항이 없습니다.</p>
              <Link
                href="/admin/notices/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                첫 공지사항 작성하기
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">종류</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notices.map((notice) => (
                      <tr key={notice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPriorityBadge(notice.priority)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link 
                            href={`/notices/${notice.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {notice.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {notice.published_at ? dayjs(notice.published_at).format('YYYY-MM-DD HH:mm') : dayjs(notice.created_at).format('YYYY-MM-DD HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(notice.is_published)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {notice.view_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Link 
                              href={`/admin/notices/${notice.id}/edit`} 
                              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              수정
                            </Link>
                            <button 
                              onClick={() => handleDelete(notice.id)} 
                              className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      이전
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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