'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">OPIc 모의테스트</h1>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-gray-800 font-medium text-sm">홈</a>
              <a href="#" className="text-gray-600 hover:text-gray-800 font-medium text-sm">로그인</a>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                가입하기
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="rounded-2xl text-white p-8 md:p-12 mb-8 max-w-4xl mx-auto" style={{ backgroundColor: '#063ff9' }}>
          <div className="flex flex-col md:flex-row justify-between items-end mb-4">
            <div className="flex items-start w-full md:w-auto">
              <img 
                src="/4hour-opic-title.png" 
                alt="4시간오픽 모의고사" 
                className="max-w-full h-auto"
                style={{ maxHeight: '180px' }}
              />
            </div>
            <div className="mt-4 md:mt-12 w-full md:w-auto">
              <p className="text-base md:text-lg text-left pl-4 md:pl-0">
                오픽시험과 전략적 필수 테스트로<br />
                <span className="text-base md:text-lg">84,000원 아끼세요!</span>
              </p>
            </div>
          </div>
          
          <div className="mb-8 mt-12 pl-4 md:pl-0">
            <h3 className="text-2xl md:text-3xl font-bold mb-6 text-left">
              왜? 4시간오픽 모의고사
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 text-xl">✅</span>
                <span className="text-base md:text-lg font-medium">내가 약한 유형 집중 연습 (선택, 롤플레이, 돌발, 콤플레 선택 연습)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 text-xl">✅</span>
                <span className="text-base md:text-lg font-medium">모든 연습 녹음 저장 → 내 실력 추적 관리</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 text-xl">✅</span>
                <span className="text-base md:text-lg font-medium">오픽 점수를 올리고 싶은 취준생·직장인 필수 시험 점검 툴</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 해당 모의고사는 Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-left">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">해당 모의고사는,</h3>
          
          <div className="space-y-2 text-lg text-gray-700">
            <p>강지완쌤 국룰서베이 기반 테스트입니다.</p>
            <p className="text-base text-gray-600">
              (서베이 항목 : 집, 공연, 콘서트, 카페, 술집, 음악듣기, 조깅, 걷기, 하이킹, 운동안함, 국내여행, 해외여행)
            </p>
            <p>문제풀이와 내 답변저장 및 답변 다시듣기 서비스는 무료로 제공됩니다.</p>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 mb-12">이용방법</h3>
          
          <div className="space-y-2 text-left">
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">1.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">4시간오픽 사이트 가입 후 기초 설문</span>
                <span className="text-gray-600 ml-2">*서비스 이용 필수사항</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">2.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">목표레벨 선택</span>
                <span className="text-gray-600 ml-2">IM2, IH, AL 중 택1, *테스트마다 변경가능</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">3.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">문제융형 선택</span>
                <span className="text-gray-600 ml-2">선택주제, 롤플레이, 돌발주제, 모의고사 1회 중 택1</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">4.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">문제풀이</span>
                <span className="text-gray-600 ml-2">선택주제, 롤플레이, 돌발주제는 콤보 출제롤 콤보문제 연속풀이 가능</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">5.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">답변저장</span>
                <span className="text-gray-600 ml-2">통한 테스트 내역 확인가능</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Survey Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="border border-gray-300 rounded-lg">
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">기초설문/이용동의</h3>
                <p className="text-sm text-gray-600">*서비스 이용 활수설문으로 놓아서 선택하세요</p>
              </div>
              <div className={`transform transition-transform ${isFormOpen ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {isFormOpen && (
              <div className="border-t border-gray-300 p-6 space-y-6">
                {/* 오픽 응시경험 */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">(필수)오픽 응시경험이 있으신가요?</h4>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="experience" className="form-radio" />
                      <span className="text-sm">미응시</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="experience" className="form-radio" />
                      <span className="text-sm">1회</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="experience" className="form-radio" />
                      <span className="text-sm">2회</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="experience" className="form-radio" />
                      <span className="text-sm">3회이상</span>
                    </label>
                  </div>
                </div>

                {/* 현재 등급 */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">(필수)현재 등급을 알려주세요.</h4>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="level" className="form-radio" />
                      <span className="text-sm">없음(미응시)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="level" className="form-radio" />
                      <span className="text-sm">NH이하</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="level" className="form-radio" />
                      <span className="text-sm">IM1</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="level" className="form-radio" />
                      <span className="text-sm">IM2</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="level" className="form-radio" />
                      <span className="text-sm">IM3</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="level" className="form-radio" />
                      <span className="text-sm">IH</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="level" className="form-radio" />
                      <span className="text-sm">AL</span>
                    </label>
                  </div>
                </div>

                {/* 오픽응시 목적 */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">(필수)오픽응시 목적은? (복수 선택 가능)</h4>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="text-sm">취업준비</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="text-sm">이직준비</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="text-sm">승진 및 직장 여가기준 충족</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" className="form-checkbox" />
                      <span className="text-sm">자기계발 및 성장</span>
                    </label>
                  </div>
                </div>

                {/* 예정일 */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">(필수)오픽 응시 예정일은 언제인가요?</h4>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="schedule" className="form-radio" />
                      <span className="text-sm">1주일이내</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="schedule" className="form-radio" />
                      <span className="text-sm">1개월이내</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="schedule" className="form-radio" />
                      <span className="text-sm">3개월이내</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="schedule" className="form-radio" />
                      <span className="text-sm">6개월이내</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="schedule" className="form-radio" />
                      <span className="text-sm">날짜 미정</span>
                    </label>
                  </div>
                </div>

                {/* 이용 동의 안내 */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-800 mb-3">(필수)이용 동의 안내</h4>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4">
                    <p className="mb-2">4시간오픽 모의고사 서비스를 원활히 제공하고, 응답자의 데이터를 안전하게 활용하기 위해 아래 내용을 안내드립니다.</p>
                    <p className="mb-2">사용자의 답변(음성/텍스트) 및 설문 결과는 서비스 품질 개선 및 통계 분석 목적으로 활용될 수 있습니다.</p>
                    <p className="mb-2">서비스 이용을 위해 위 내용을 이해하고 동의해주셔야 모의고사를 이용하실 수 있습니다.</p>
                    <p>이에 동의하십니까?</p>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="agreement" className="form-radio" />
                      <span className="text-sm">동의함 (필수)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="agreement" className="form-radio" />
                      <span className="text-sm">동의하지 않음 (서비스 이용불가)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Level Selection Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-12">목표레벨선택</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/question-type?level=IM2">
                <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 cursor-pointer transition-colors h-full">
                  <div className="mb-4">
                    <h4 className="text-4xl font-bold mb-2">IM2 <span className="text-lg font-medium">선택</span></h4>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    "쉽게 간단한 문장과 원하는 정도를 할 수 있다"
                  </p>
                </div>
              </Link>

              <Link href="/question-type?level=IH">
                <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 cursor-pointer transition-colors h-full">
                  <div className="mb-4">
                    <h4 className="text-4xl font-bold mb-2">IH <span className="text-lg font-medium">선택</span></h4>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    "문단으로 말하고,<br />
                    시제/돌발/일기정보이 가능해야 한다"
                  </p>
                </div>
              </Link>

              <Link href="/question-type?level=AL">
                <div className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 cursor-pointer transition-colors h-full">
                  <div className="mb-4">
                    <h4 className="text-4xl font-bold mb-2">AL <span className="text-lg font-medium">선택</span></h4>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    "실수가 극히 적고, 표현이 다양해야 한다."
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 mb-12">왜 저희와 함께 연습해야 할까요?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-left">
              <div className="flex items-start space-x-3 mb-6">
                <span className="text-blue-600 flex-shrink-0 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">실제 시험 환경</h4>
                  <p className="text-gray-600 font-medium">실제 OPIc 시험 형식과 타이밍을 시뮬레이션하는 환경에서 연습하세요.</p>
                </div>
              </div>
            </div>
            
            <div className="text-left">
              <div className="flex items-start space-x-3 mb-6">
                <span className="text-blue-600 flex-shrink-0 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">AI 기반 피드백</h4>
                  <p className="text-gray-600 font-medium">개선이 필요한 연결을 식별하기 위한 답변에 대한 즉각적인 피드백을 받으세요.</p>
                </div>
              </div>
            </div>
            
            <div className="text-left md:col-span-2">
              <div className="flex items-start space-x-3 mb-6">
                <span className="text-blue-600 flex-shrink-0 text-xl mt-1">✓</span>
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">모든 OPIc 질문 유형</h4>
                  <p className="text-gray-600 font-medium">선택 주제, 역할 플레이 및 예상치 못한 질문으로 연습하세요.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 font-medium">
            © 2024 OPIc 모의테스트. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 