'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function NewFAQPage() {
  return (
    <AdminGuard>
      <NewFAQUI />
    </AdminGuard>
  )
}

function NewFAQUI() {
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    is_published: true
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const categories = [
    { value: 'general', label: '일반' },
    { value: 'technical', label: '기술' },
    { value: 'payment', label: '결제' },
    { value: 'account', label: '계정' },
    { value: 'test', label: '테스트' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('질문과 답변을 모두 입력해주세요.')
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to create FAQ')
      }

      alert('FAQ가 성공적으로 등록되었습니다.')
      router.push('/admin/faqs')
    } catch (error) {
      console.error('Error creating FAQ:', error)
      alert('FAQ 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/faqs"
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  목록으로
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">새 FAQ 작성</h1>
                  <p className="text-gray-600 mt-1">자주 묻는 질문을 추가하세요</p>
                </div>
              </div>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 질문 */}
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                질문 *
              </label>
              <input
                type="text"
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="질문을 입력하세요"
                required
              />
            </div>

            {/* 답변 */}
            <div>
              <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                답변 *
              </label>
              <textarea
                id="answer"
                name="answer"
                value={formData.answer}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="답변을 입력하세요"
                required
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 공개 여부 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                name="is_published"
                checked={formData.is_published}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-900">
                즉시 공개
              </label>
            </div>

            {/* 미리보기 */}
            {formData.question && formData.answer && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">미리보기</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Q. {formData.question}</h4>
                    <div className="text-gray-700 whitespace-pre-wrap">{formData.answer}</div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>카테고리: {categories.find(c => c.value === formData.category)?.label}</span>
                    <span className="flex items-center">
                      {formData.is_published ? (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          공개
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          비공개
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href="/admin/faqs"
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
                {submitting ? '등록 중...' : 'FAQ 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 