'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Notice } from '@/app/data/types'
import AdminGuard from '@/components/AdminGuard'
import { ArrowLeft, Save, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function EditNoticePage() {
  return (
    <AdminGuard>
      <EditNoticeUI />
    </AdminGuard>
  )
}

function EditNoticeUI() {
  const { data: session, status } = useSession()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    is_published: true,
    published_at: ''
  })
  const router = useRouter()
  const params = useParams()
  const noticeId = params.id as string

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotice()
    }
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
      setFormData({
        title: data.notice.title,
        content: data.notice.content,
        priority: data.notice.priority,
        is_published: data.notice.is_published,
        published_at: data.notice.published_at ? data.notice.published_at.slice(0, 16) : ''
      })
    } catch (error) {
      console.error('Error fetching notice:', error)
      setError('공지사항을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/notices/${noticeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: formData.content,
          published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update notice')
      }

      alert('공지사항이 성공적으로 수정되었습니다.')
      router.push('/admin/notices')
    } catch (error) {
      console.error('Error updating notice:', error)
      alert('공지사항 수정 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (name === 'is_published') {
      setFormData(prev => ({ ...prev, is_published: value === 'true' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음'
      case 'normal':
        return '보통'
      case 'low':
        return '낮음'
      default:
        return priority
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600'
      case 'normal':
        return 'text-blue-600'
      case 'low':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">공지사항을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !notice) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류</h2>
            <p className="text-gray-600 mb-6">{error || '공지사항을 찾을 수 없습니다.'}</p>
            <Link 
              href="/admin/notices"
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">공지사항 수정</h1>
              <p className="text-gray-600 mt-1 ml-4">공지사항을 수정하세요</p>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="공지사항 제목을 입력하세요"
                required
              />
            </div>

            {/* 내용 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="공지사항 내용을 입력하세요"
                required
              />
            </div>

            {/* 우선순위 */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                우선순위
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">낮음</option>
                <option value="normal">보통</option>
                <option value="high">높음</option>
              </select>
            </div>

            {/* 공개여부 */}
            <div>
              <label htmlFor="is_published" className="block text-sm font-medium text-gray-700 mb-2">
                공개여부
              </label>
              <select
                id="is_published"
                name="is_published"
                value={formData.is_published ? 'true' : 'false'}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">공개</option>
                <option value="false">미공개</option>
              </select>
            </div>

            {/* 예약일 */}
            <div>
              <label htmlFor="published_at" className="block text-sm font-medium text-gray-700 mb-2">
                예약일 (선택, 미입력 시 즉시 게시)
              </label>
              <input
                type="datetime-local"
                id="published_at"
                name="published_at"
                value={formData.published_at}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 미리보기 */}
            {formData.title && formData.content && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">미리보기</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 ${getPriorityColor(formData.priority)}`}>
                        {getPriorityLabel(formData.priority)}
                      </span>
                      {formData.is_published ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Eye className="w-3 h-3 mr-1" />
                          공개
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <EyeOff className="w-3 h-3 mr-1" />
                          비공개
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{formData.title}</h4>
                    <div className="text-gray-700 whitespace-pre-wrap">{formData.content}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/admin/notices"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {submitting ? '수정 중...' : '공지사항 수정'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 