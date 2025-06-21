'use client'

import { useState, useEffect } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function QuestionTypePage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string>('IM2') // 기본값
  const [sttConfig, setSttConfig] = useState<{ mobile_stt_mode: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const level = searchParams.get('level')
    if (level) {
      setSelectedLevel(level)
    }
  }, [searchParams])

  // STT 설정 가져오기
  useEffect(() => {
    async function fetchSttConfig() {
      try {
        const response = await fetch('/api/stt-config')
        if (response.ok) {
          const data = await response.json()
          setSttConfig(data)
        } else {
          // 실패 시 기본값 설정
          setSttConfig({ mobile_stt_mode: 'USER_SELECT' })
        }
      } catch (error) {
        console.error("Failed to fetch STT config:", error)
        // 에러 시 기본값 설정
        setSttConfig({ mobile_stt_mode: 'USER_SELECT' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchSttConfig()
  }, [])

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

    // 모바일 기기인지 확인
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile && sttConfig) {
      // 모바일 사용자의 경우 STT 설정에 따라 라우팅 결정
      const savedPreference = localStorage.getItem('savedSTTPreference')
      const resetTime = localStorage.getItem('sttResetTime')
      
      // 설정 초기화 후에는 저장된 설정이 있어도 STT 체크 페이지로 이동
      if (sttConfig.mobile_stt_mode === 'USER_SELECT' && (!savedPreference || resetTime)) {
        // 사용자 선택 모드이고 저장된 설정이 없거나 초기화된 경우 STT 체크 페이지로
        router.push(`/stt-check?type=${encodeURIComponent(selectedType)}&category=${category}&level=${selectedLevel}`)
        return
      } else if (sttConfig.mobile_stt_mode === 'FORCE_A') {
        // A 타입 강제
        sessionStorage.setItem('selectedSTTType', 'A')
        router.push(`/test?type=${encodeURIComponent(selectedType)}&category=${category}&level=${selectedLevel}&refresh=true`)
        return
      } else if (sttConfig.mobile_stt_mode === 'FORCE_B') {
        // B 타입 강제
        sessionStorage.setItem('selectedSTTType', 'B')
        router.push(`/test?type=${encodeURIComponent(selectedType)}&category=${category}&level=${selectedLevel}&refresh=true`)
        return
      } else if (savedPreference && !resetTime) {
        // 저장된 설정이 있고 초기화되지 않은 경우 해당 설정 사용
        sessionStorage.setItem('selectedSTTType', savedPreference)
        router.push(`/test?type=${encodeURIComponent(selectedType)}&category=${category}&level=${selectedLevel}&refresh=true`)
        return
      }
    }
    
    // PC 사용자이거나 기본 케이스: 바로 테스트 페이지로
    // PC 사용자는 항상 A 타입 사용
    sessionStorage.setItem('selectedSTTType', 'A')
    router.push(`/test?type=${encodeURIComponent(selectedType)}&category=${category}&level=${selectedLevel}&refresh=true`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        <div className={`max-w-6xl mx-auto ${selectedType ? 'pb-20 md:pb-0' : ''}`}>
          {/* Back button */}
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-3 text-sm"
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
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:relative md:border-t-0 md:bg-transparent md:p-0">
              <div className="flex justify-center">
                <button 
                  onClick={handleStartTest}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-lg font-bold text-lg transition-colors w-full md:w-auto"
                >
                  테스트 시작하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 