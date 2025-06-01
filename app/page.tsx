import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'OPIc 영어 말하기 연습',
  description: 'OPIc 시험 전에, 내 약점 진단하세요. 84000원 시험비 아끼는 가장 현명한 방법!',
}

export default function Home() {
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
      <section className="container mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white p-8 md:p-12 mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-center">
            OPIc 모의테스트
          </h2>
          <p className="text-xl md:text-2xl mb-6 opacity-90 text-center font-medium">
            오픽 시험 전에, 내 약점 진단하세요.
          </p>
          <p className="text-lg md:text-xl mb-8 font-semibold text-center">
            84000원 시험비 아끼는 가장 현명한 방법!
          </p>
          
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 text-green-300 flex-shrink-0 text-xl">✓</span>
              <span className="text-base md:text-lg font-medium">완벽한 오픽 모의테스트 제공</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 text-green-300 flex-shrink-0 text-xl">✓</span>
              <span className="text-base md:text-lg font-medium">선택주제 / 롤플레이 / 돌발문제 중 약한 유형만 골라서 집중 연습 가능</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 text-green-300 flex-shrink-0 text-xl">✓</span>
              <span className="text-base md:text-lg font-medium">결과 피드백 제공 → 나의 취약 포인트 한눈에!</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-6 h-6 text-green-300 flex-shrink-0 text-xl">✓</span>
              <span className="text-base md:text-lg font-medium">오픽 점수를 올리고 싶은 취준생·직장인 필수 사전 점검 툴</span>
            </div>
          </div>

          <div className="mt-8 h-1 bg-white bg-opacity-30 rounded-full max-w-md mx-auto"></div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 mb-12">이용 방법</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-left">
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">01</span>
                <h4 className="text-xl font-bold text-gray-800 mt-2 mb-4">목표 레벨 선택</h4>
                <p className="text-gray-600 font-medium">목표로 하는 OPIc 수준은 레벨을 선택하여 적절한 연습 문제를 받아보세요.</p>
              </div>
            </div>
            
            <div className="text-left">
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">02</span>
                <h4 className="text-xl font-bold text-gray-800 mt-2 mb-4">말하기 연습</h4>
                <p className="text-gray-600 font-medium">실제 시험처럼 질문을 듣고 녹음 타이머로 답변을 녹음해 보세요.</p>
              </div>
            </div>
            
            <div className="text-left">
              <div className="mb-6">
                <span className="text-4xl font-bold text-blue-600">03</span>
                <h4 className="text-xl font-bold text-gray-800 mt-2 mb-4">피드백 받기</h4>
                <p className="text-gray-600 font-medium">말한 답변을 텍스트로 점검하고 더 높은 점수를 위한 AI 생성 개선방향을 받아보세요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Level Selection Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-12">목표 OPIc 레벨 선택</h3>
            
            {/* First Row - IM2 and IH */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="text-left hover:shadow-lg transition-shadow bg-white rounded-xl border p-6">
                <div className="mb-6">
                  <h4 className="text-2xl font-bold mb-4">IM2</h4>
                  <p className="text-base text-gray-600 font-medium">
                    일상적인 주제에 대해 다양한 의사소통을 합리적인 정확도로 할 수 있습니다.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Link href="/question-type?level=IM2">
                    <button className="w-32 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                      IM2 선택
                    </button>
                  </Link>
                </div>
              </div>

              <div className="text-left hover:shadow-lg transition-shadow bg-white rounded-xl border p-6">
                <div className="mb-6">
                  <h4 className="text-2xl font-bold mb-4">IH</h4>
                  <p className="text-base text-gray-600 font-medium">
                    대부분의 비공식적 대화와 일부 공식적인 대화에 효과적으로 처리할 수 있습니다.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Link href="/question-type?level=IH">
                    <button className="w-32 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                      IH 선택
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Second Row - AL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-left hover:shadow-lg transition-shadow bg-white rounded-xl border p-6">
                <div className="mb-6">
                  <h4 className="text-2xl font-bold mb-4">AL</h4>
                  <p className="text-base text-gray-600 font-medium">
                    대부분의 비공식적 대화와 많은 공식적인 대화에 참여할 수 있습니다.
                  </p>
                </div>
                <div className="flex justify-center">
                  <Link href="/question-type?level=AL">
                    <button className="w-32 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors">
                      AL 선택
                    </button>
                  </Link>
                </div>
              </div>
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