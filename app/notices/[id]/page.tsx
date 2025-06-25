'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Notice } from '@/app/data/types'
import Breadcrumb from '../../components/Breadcrumb'
import FullScreenLoader from '../../components/FullScreenLoader'
import { ArrowLeft, AlertTriangle, FileText, Eye, Calendar, User, Edit, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import Link from 'next/link'

export default function NoticeDetailPage() {
  const { data: session, status } = useSession()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const noticeId = params.id as string

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    fetchNotice()
  }, [status, noticeId])

  const fetchNotice = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/notices/${noticeId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('공지사항을 찾을 수 없습니다.')
        } else {
          throw new Error('Failed to fetch notice')
        }
        return
      }

      const data = await response.json()
      setNotice(data.notice)
    } catch (error) {
      console.error('Error fetching notice:', error)
      setError('공지사항을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
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

      router.push('/notices')
    } catch (error) {
      console.error('Error deleting notice:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 2:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-4 h-4 mr-1" />
            긴급
          </span>
        )
      case 1:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-4 h-4 mr-1" />
            중요
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <FileText className="w-4 h-4 mr-1" />
            일반
          </span>
        )
    }
  }

  if (status === 'loading') {
    return <FullScreenLoader />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumb 
            items={[
              { label: '홈', href: '/' },
              { label: '공지사항', href: '/notices' },
              { label: '상세', href: '#' }
            ]} 
          />
          
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류</h2>
            <p className="text-gray-600 mb-6">{error || '공지사항을 찾을 수 없습니다.'}</p>
            <Link 
              href="/notices"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isAdmin = session?.user?.type === 'admin'

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
          {/* 헤더(관리자 버튼 완전 제거) */}

          {/* 공지사항 내용 */}
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-4">
                {getPriorityBadge(notice.priority)}
                <h1 className="text-lg font-bold text-gray-900">{notice.title}</h1>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                   {notice.author_name}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {dayjs(notice.created_at).format('YYYY.MM.DD HH:mm')}
                </div>
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  조회 {notice.view_count}
                </div>
              </div>
            </div>

            {/* 본문 */}
            <div className="prose max-w-none">
              <div 
                className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: notice.content.replace(/\n/g, '<br>') }}
              />
            </div>
            {/* 닫기 버튼 */}
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => router.push('/notices')}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 