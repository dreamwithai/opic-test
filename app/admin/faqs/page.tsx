'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FAQ } from '@/app/data/types'
import AdminGuard from '@/components/AdminGuard'
import { Plus, Edit, Trash2, Eye, Calendar, User, HelpCircle, FileText, Search, Filter, BarChart3, EyeOff, TrendingUp, ArrowLeft, Home } from 'lucide-react'
import dayjs from 'dayjs'
import Link from 'next/link'

export default function AdminFAQsPage() {
  return (
    <AdminGuard>
      <AdminFAQsUI />
    </AdminGuard>
  )
}

function AdminFAQsUI() {
  const { data: session, status } = useSession()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const router = useRouter()

  const categories = [
    { value: '', label: '전체' },
    { value: 'general', label: '일반' },
    { value: 'technical', label: '기술' },
    { value: 'payment', label: '결제' },
    { value: 'account', label: '계정' },
    { value: 'other', label: '기타' }
  ]

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFAQs()
    }
  }, [status, currentPage, searchTerm, categoryFilter, statusFilter])

  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      if (categoryFilter) {
        params.append('category', categoryFilter)
      }
      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/faqs?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs')
      }

      const data = await response.json()
      setFaqs(data.faqs)
      setTotalPages(data.pagination.totalPages)
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (faqId: string) => {
    if (!confirm('정말로 이 FAQ를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/faqs/${faqId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete FAQ')
      }

      // 목록 새로고침
      fetchFAQs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const getCategoryBadge = (category: string) => {
    const colors = {
      general: "bg-gray-100 text-gray-800",
      technical: "bg-blue-100 text-blue-800",
      payment: "bg-green-100 text-green-800",
      account: "bg-purple-100 text-purple-800",
      other: "bg-orange-100 text-orange-800"
    };
    const found = categories.find(c => c.value === category)
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[category as keyof typeof colors] || colors.other}`}>
        {found ? found.label : category}
      </span>
    );
  };

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

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = !searchTerm || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !categoryFilter || faq.category === categoryFilter
    const matchesStatus = !statusFilter || 
      (statusFilter === 'published' && faq.is_published) ||
      (statusFilter === 'draft' && !faq.is_published)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const stats = {
    total: faqs.length,
    published: faqs.filter(f => f.is_published).length,
    draft: faqs.filter(f => !f.is_published).length,
    totalViews: faqs.reduce((sum, f) => sum + (f.view_count || 0), 0),
    categories: categories.length - 1 // '전체' 제외
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ 관리</h1>
              <p className="text-gray-600">자주 묻는 질문을 관리하세요</p>
            </div>
            <Link
              href="/admin/faqs/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              FAQ 작성하기
            </Link>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <HelpCircle className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">전체 FAQ</p>
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
          <div className="bg-white rounded-lg shadow-sm border p-4">
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
              <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">총 조회수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="질문 또는 답변으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                <option value="published">공개</option>
                <option value="draft">비공개</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('')
                  setStatusFilter('')
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          </div>
        </div>

        {/* FAQ 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="p-8 text-center">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {searchTerm || categoryFilter || statusFilter 
                  ? "검색 조건에 맞는 FAQ가 없습니다." 
                  : "등록된 FAQ가 없습니다."}
              </p>
              {(searchTerm || categoryFilter || statusFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setCategoryFilter('')
                    setStatusFilter('')
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  필터 초기화
                </button>
              )}
              {!searchTerm && !categoryFilter && !statusFilter && (
                <Link
                  href="/admin/faqs/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 FAQ 작성하기
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">질문</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">답변</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">조회수</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFAQs.map((faq) => (
                      <tr key={faq.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getCategoryBadge(faq.category)}
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-sm font-medium text-gray-900" style={{display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'pre-line'}}>
                            {faq.question}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="text-gray-700 text-sm" style={{display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'pre-line'}}>
                            {faq.answer.replace(/\n/g, ' ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                          {dayjs(faq.created_at).format('YYYY-MM-DD')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(faq.is_published)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {faq.view_count?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Link 
                              href={`/admin/faqs/${faq.id}/edit`} 
                              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              수정
                            </Link>
                            <button 
                              onClick={() => handleDelete(faq.id)} 
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