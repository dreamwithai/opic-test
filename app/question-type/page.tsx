'use client'

import { useState, useEffect } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function QuestionTypePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string>('IM2') // 기본값
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const level = searchParams.get('level')
    if (level) {
      setSelectedLevel(level)
    }
  }, [searchParams])

  const handleSelect = (type: string) => {
    setSelectedType(type)
  }

  const handleBack = () => {
    router.back()
  }

  const handleStartTest = () => {
    if (!selectedType) return
    
    // 문제 유형에 따라 적절한 category 매핑
    let category = ''
    switch (selectedType) {
      case '선택주제':
        category = 'S'
        break
      case '롤플레이':
        category = 'RP'
        break
      case '돌발주제':
        category = 'C'
        break
      case '모의고사':
        category = 'MOCK'
        break
      default:
        category = 'S'
    }
    
    // 선택한 유형과 레벨을 query parameter로 전달
    router.push(`/test?type=${encodeURIComponent(selectedType)}&category=${category}&level=${selectedLevel}`)
  }

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <Link href="/">
              <h1 className="text-xl font-bold text-blue-600 cursor-pointer">OPIc 모의테스트</h1>
            </Link>
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-800 font-medium text-sm">홈</Link>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                마이페이지
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <span className="mr-2">←</span>
            <span className="font-medium">뒤로가기</span>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-800">홈</Link>
            <span className="mx-2">›</span>
            <Link href={`/question-type?level=${selectedLevel}`} className="hover:text-gray-800">{selectedLevel}</Link>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">2. 문제유형 선택</h2>
          <p className="text-gray-600 font-medium mb-12">아래 유형 중 1개 문제유형을 선택하세요</p>

          {/* Question Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* 선택주제 */}
            <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">선택주제</h3>
              <p className="text-gray-600 font-medium mb-6">
                배경 설문에서 선택한 친숙한 주제에 대한 질문에 답하세요.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => handleSelect('선택주제')}
                  className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                    selectedType === '선택주제' 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {selectedType === '선택주제' ? '선택됨' : '선택'}
                </button>
              </div>
            </div>

            {/* 롤플레이 */}
            <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">롤플레이</h3>
              <p className="text-gray-600 font-medium mb-6">
                주어진 시나리오에서 특정 역할을 맡아 롤플레이 대화에 참여하세요.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => handleSelect('롤플레이')}
                  className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                    selectedType === '롤플레이' 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {selectedType === '롤플레이' ? '선택됨' : '선택'}
                </button>
              </div>
            </div>

            {/* 돌발주제 */}
            <div className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-gray-800 mb-4">돌발주제</h3>
              <p className="text-gray-600 font-medium mb-6">
                즉석에서 생각하는 능력을 테스트하는 예상치 못한 질문에 답하세요.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => handleSelect('돌발주제')}
                  className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                    selectedType === '돌발주제' 
                      ? 'bg-blue-600 text-white' 
                      : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {selectedType === '돌발주제' ? '선택됨' : '선택'}
                </button>
              </div>
            </div>
          </div>

          {/* 모의고사 1회 테스트 */}
          <div className="bg-gray-50 border rounded-xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">모의고사 1회 테스트</h3>
            <p className="text-gray-600 font-medium mb-6">
              실제 시험과 동일한 구성의 모의고사 1회분 문제를 풀어볼 수 있습니다. 선택 주제, 롤플레이, 돌발 질문 등을 모두 포함합니다.
            </p>
            <div className="flex justify-center">
              <button 
                onClick={() => handleSelect('모의고사')}
                className={`px-8 py-2 rounded-lg font-medium transition-colors ${
                  selectedType === '모의고사' 
                    ? 'bg-blue-600 text-white' 
                    : 'border border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
              >
                {selectedType === '모의고사' ? '선택됨' : '선택'}
              </button>
            </div>
          </div>

          {/* 테스트 시작하기 버튼 */}
          {selectedType && (
            <div className="flex justify-center">
              <button 
                onClick={handleStartTest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-lg font-bold text-lg transition-colors"
              >
                테스트 시작하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 