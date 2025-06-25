'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Notice } from '@/app/data/types'
import AdminGuard from '@/components/AdminGuard'
import { Plus, Edit, Trash2, Eye, Calendar, User, AlertTriangle, FileText } from 'lucide-react'
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
      const response = await fetch(`/api/notices?page=${currentPage}&limit=20`)
      
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
        <div className="bg-white rounded-lg shadow-sm border">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">공지사항 관리</h1>
              <Link
                href="/admin/notices/new"
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + 공지사항 작성하기
              </Link>
            </div>
            <p className="text-gray-600 mt-1">공지사항을 작성하고 관리하세요</p>
          </div>

          {/* 공지사항 목록 */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">등록된 공지사항이 없습니다.</p>
              <Link
                href="/admin/notices/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                첫 공지사항 작성하기
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종류</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내용</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-xs">
                    {notices.map((notice) => (
                      <tr key={notice.id} className="hover:bg-gray-50">
                        {/* 종류(아이콘+텍스트) */}
                        <td className="px-4 py-2 whitespace-nowrap">
                          {getPriorityBadge(notice.priority)}
                        </td>
                        {/* 제목 */}
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Link 
                            href={`/notices/${notice.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 text-xs"
                          >
                            {notice.title}
                          </Link>
                        </td>
                        {/* 내용 미리보기 (2줄, ...처리) */}
                        <td className="px-4 py-2 max-w-xs align-top">
                          <div className="text-gray-700 text-xs" style={{display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'pre-line'}}>
                            {notice.content.replace(/\n/g, ' ')}
                          </div>
                        </td>
                        {/* 날짜 */}
                        <td className="px-4 py-2 whitespace-nowrap text-right text-xs text-gray-500">
                          {notice.published_at ? dayjs(notice.published_at).format('YYYY-MM-DD HH:mm') : dayjs(notice.created_at).format('YYYY-MM-DD HH:mm')}
                        </td>
                        {/* 상태 */}
                        <td className="px-4 py-2 whitespace-nowrap">
                          {getStatusBadge(notice.is_published)}
                        </td>
                        {/* 조회수 */}
                        <td className="px-4 py-2 whitespace-nowrap text-right">
                          {notice.view_count}
                        </td>
                        {/* 관리 */}
                        <td className="px-4 py-2 whitespace-nowrap text-center">
                          <Link href={`/admin/notices/${notice.id}/edit`} className="text-blue-600 hover:underline mr-2 text-xs">
                            <Edit className="inline w-4 h-4 mr-1 align-text-bottom" />수정
                          </Link>
                          <button onClick={() => handleDelete(notice.id)} className="text-red-600 hover:underline text-xs">
                            <Trash2 className="inline w-4 h-4 mr-1 align-text-bottom" />삭제
                          </button>
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