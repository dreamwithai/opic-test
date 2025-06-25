'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Inquiry, InquiryResponse } from '@/app/data/types'
import Breadcrumb from '../../components/Breadcrumb'
import FullScreenLoader from '../../components/FullScreenLoader'
import { ArrowLeft, MessageSquare, Calendar, User, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react'
import dayjs from 'dayjs'
import Link from 'next/link'

export default function InquiryDetailPage() {
  const { data: session, status } = useSession()
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [responses, setResponses] = useState<InquiryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseContent, setResponseContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const inquiryId = params.id as string

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    fetchInquiry()
    fetchResponses()
  }, [status, inquiryId])

  const fetchInquiry = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/inquiries/${inquiryId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('문의사항을 찾을 수 없습니다.')
        } else {
          throw new Error('Failed to fetch inquiry')
        }
        return
      }

      const data = await response.json()
      setInquiry(data.inquiry)
    } catch (error) {
      console.error('Error fetching inquiry:', error)
      setError('문의사항을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchResponses = async () => {
    try {
      const response = await fetch(`/api/inquiries/${inquiryId}/responses`)
      
      if (response.ok) {
        const data = await response.json()
        setResponses(data.responses)
      }
    } catch (error) {
      console.error('Error fetching responses:', error)
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!responseContent.trim()) {
      alert('답변 내용을 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/inquiries/${inquiryId}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: responseContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit response')
      }

      setResponseContent('')
      setShowResponseForm(false)
      fetchResponses() // 답변 목록 새로고침
      alert('답변이 등록되었습니다.')
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('답변 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            대기중
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            처리중
          </span>
        )
      case 'answered':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            답변완료
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            완료
          </span>
        )
      default:
        return null
    }
  }

  const getCategoryLabel = (category: string) => {
    const categories = {
      general: '일반',
      technical: '기술',
      payment: '결제',
      bug: '버그신고',
      suggestion: '건의사항',
      other: '기타'
    }
    return categories[category as keyof typeof categories] || category
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

  if (error || !inquiry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Breadcrumb 
            items={[
              { label: '홈', href: '/' },
              { label: '1:1 문의하기', href: '/inquiries' },
              { label: '상세', href: '#' }
            ]} 
          />
          
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <MessageSquare className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">오류</h2>
            <p className="text-gray-600 mb-6">{error || '문의사항을 찾을 수 없습니다.'}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              ← 목록
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isAdmin = session?.user?.type === 'admin'
  const isOwner = session?.user?.id === inquiry.member_id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: '홈', href: '/' },
            { label: '1:1 문의하기', href: '/inquiries' }
          ]} 
        />
        <div className="bg-white rounded-lg shadow-sm border px-6 py-6">
          <div className="mb-6 pt-0 pb-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {getStatusBadge(inquiry.status)}
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getCategoryLabel(inquiry.category)}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {dayjs(inquiry.created_at).format('YYYY.MM.DD HH:mm')}
              </span>
            </div>
            <h1 className="text-base font-bold text-gray-900 mb-1 whitespace-pre-line break-words">{inquiry.title}</h1>
            <div className="text-xs text-gray-500 mb-4">{inquiry.member_name}</div>
          </div>

          <div className="prose max-w-none mb-8 text-sm">
            <div 
              className="text-gray-800 leading-relaxed whitespace-pre-wrap p-4 bg-gray-50 rounded-lg"
              dangerouslySetInnerHTML={{ __html: inquiry.content.replace(/\n/g, '<br>') }}
            />
          </div>

          {isAdmin && showResponseForm && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">답변 작성</h3>
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div>
                  <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                    답변 내용 *
                  </label>
                  <textarea
                    id="response"
                    value={responseContent}
                    onChange={(e) => setResponseContent(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="답변 내용을 입력하세요"
                    required
                  />
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowResponseForm(false)}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '등록 중...' : '답변 등록'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {responses.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">답변 ({responses.length})</h3>
              <div className="space-y-4">
                {responses.map((response) => (
                  <div key={response.id} className={`p-4 rounded-lg ${
                    response.is_admin ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50 border-l-4 border-gray-400'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          response.is_admin 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {response.is_admin ? '관리자' : '사용자'}
                        </span>
                        <span className="text-sm text-gray-600">{response.author_name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {dayjs(response.created_at).format('YYYY.MM.DD HH:mm')}
                      </span>
                    </div>
                    <div 
                      className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm"
                      dangerouslySetInnerHTML={{ __html: response.content.replace(/\n/g, '<br>') }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 mt-8">
            {isAdmin && !showResponseForm && (
              <button
                onClick={() => setShowResponseForm(true)}
                className="px-5 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                답변하기
              </button>
            )}
            <button
              onClick={() => router.back()}
              className="px-5 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              ← 목록
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 