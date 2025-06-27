'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Inquiry } from '@/app/data/types'
import Breadcrumb from '../components/Breadcrumb'
import FullScreenLoader from '../components/FullScreenLoader'
import { MessageSquare, Plus, Eye, Calendar, User, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'
import Link from 'next/link'

export default function InquiriesPage() {
  const { data: session, status } = useSession()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general'
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const statuses = [
    { value: '', label: '전체' },
    { value: 'pending', label: '대기중' },
    { value: 'in_progress', label: '처리중' },
    { value: 'answered', label: '답변완료' },
    { value: 'closed', label: '완료' }
  ]

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'technical', label: '기술' },
    { value: 'payment', label: '결제' },
    { value: 'bug', label: '버그신고' },
    { value: 'suggestion', label: '건의사항' },
    { value: 'other', label: '기타' }
  ]

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    fetchInquiries()
  }, [status, currentPage])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      })
      if (session?.user?.id) {
        params.append('userId', session.user.id)
      }

      const response = await fetch(`/api/inquiries?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch inquiries')
      }

      const data = await response.json()
      setInquiries(data.inquiries)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create inquiry')
      }

      const data = await response.json()
      setShowForm(false)
      setFormData({
        title: '',
        content: '',
        category: 'general'
      })
      fetchInquiries() // 목록 새로고침
      alert('문의사항이 등록되었습니다.')
    } catch (error) {
      console.error('Error creating inquiry:', error)
      alert('문의사항 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            대기중
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            처리중
          </span>
        )
      case 'answered':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            답변완료
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            완료
          </span>
        )
      default:
        return null
    }
  }

  const getCategoryLabel = (category: string) => {
    const found = categories.find(c => c.value === category)
    return found ? found.label : category
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
            { label: '1:1 문의하기', href: '/inquiries' }
          ]} 
        />

        <div className="bg-white rounded-lg shadow-sm border">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">1:1 문의하기</h1>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="p-2 rounded-full hover:bg-blue-50 text-blue-600"
                title="새 문의하기"
                aria-label="새 문의하기"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">궁금한 점이나 문제가 있으시면 언제든 문의해주세요</p>
          </div>

          {/* 문의 작성 폼 */}
          {showForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="문의 제목을 입력하세요"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    문의 내용 *
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="문의하실 내용을 자세히 작성해주세요."
                    required
                    maxLength={2000}
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '등록 중...' : '등록'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 문의사항 목록 */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">등록된 문의사항이 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="py-4 px-6 border-b">
                    <Link href={`/inquiries/${inquiry.id}`} className="block">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(inquiry.status)}
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getCategoryLabel(inquiry.category)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {dayjs(inquiry.created_at).format('YYYY.MM.DD')}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="block text-sm font-medium text-gray-900 truncate">
                          {inquiry.title}
                        </span>
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