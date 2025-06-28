'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Image as ImageIcon, X } from 'lucide-react'
import AdminGuard from '@/components/AdminGuard'
import ImageUpload from '@/app/components/ImageUpload'

export default function NewNoticePage() {
  return (
    <AdminGuard>
      <NewNoticeUI />
    </AdminGuard>
  )
}

function NewNoticeUI() {
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 0,
    is_published: true,
    published_at: ''
  })
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true)
      
      // 이미지 URL들을 내용에 삽입
      let finalContent = formData.content
      uploadedImages.forEach((imageUrl, index) => {
        const imageTag = `\n\n![이미지${index + 1}](${imageUrl})\n\n`
        finalContent += imageTag
      })

      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: finalContent,
          published_at: formData.published_at ? new Date(formData.published_at).toISOString() : null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create notice')
      }

      const data = await response.json()
      router.push(`/notices/${data.notice.id}`)
    } catch (error) {
      console.error('Error creating notice:', error)
      alert('공지사항 작성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (name === 'is_published') {
      setFormData(prev => ({ ...prev, is_published: value === 'true' }))
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImages(prev => [...prev, imageUrl])
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
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
                  href="/admin/notices"
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  목록으로
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">새 공지사항 작성</h1>
              </div>
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
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
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="공지사항 제목을 입력하세요"
                  required
                />
              </div>

              {/* 중요도 */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  중요도
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>일반</option>
                  <option value={1}>중요</option>
                  <option value={2}>긴급</option>
                </select>
              </div>

              {/* 내용 */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="공지사항 내용을 입력하세요"
                  required
                />
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
                  onChange={handleChange}
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
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 업로드
                </label>
                <ImageUpload onImageUpload={handleImageUpload} />
                
                {/* 업로드된 이미지 목록 */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">업로드된 이미지</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`업로드된 이미지 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      이미지들은 공지사항 내용 하단에 자동으로 추가됩니다.
                    </p>
                  </div>
                )}
              </div>

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
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 