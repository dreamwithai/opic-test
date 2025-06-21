'use client'

import Link from 'next/link'

export default function PCGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8">PC에서 이용을 권장합니다</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">💻 PC에서 이용하는 이유</h2>
              <ul className="space-y-2 text-blue-700">
                <li>• <strong>안정적인 STT 동작:</strong> PC 브라우저에서 음성 인식이 더 안정적으로 작동합니다</li>
                <li>• <strong>더 나은 음성 품질:</strong> PC 마이크가 일반적으로 더 좋은 음성 품질을 제공합니다</li>
                <li>• <strong>일관된 경험:</strong> 브라우저별, 기기별 차이 없이 일관된 사용 경험을 제공합니다</li>
                <li>• <strong>더 큰 화면:</strong> 문제와 답변을 더 편리하게 확인할 수 있습니다</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-4">✅ 최적의 PC 환경</h2>
              <ul className="space-y-2 text-green-700">
                <li>• <strong>브라우저:</strong> Chrome, Edge, Firefox (최신 버전)</li>
                <li>• <strong>마이크:</strong> 외장 마이크 또는 노트북 내장 마이크</li>
                <li>• <strong>인터넷:</strong> 안정적인 인터넷 연결</li>
                <li>• <strong>권한:</strong> 브라우저에서 마이크 권한 허용</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-4">⚠️ 모바일 사용 시 주의사항</h2>
              <ul className="space-y-2 text-yellow-700">
                <li>• <strong>브라우저 호환성:</strong> 모바일 브라우저마다 STT 동작이 다를 수 있습니다</li>
                <li>• <strong>음성 품질:</strong> 환경음이나 마이크 품질로 인해 인식률이 떨어질 수 있습니다</li>
                <li>• <strong>세션 안정성:</strong> 화면 꺼짐이나 앱 전환 시 STT가 중단될 수 있습니다</li>
                <li>• <strong>권한 문제:</strong> 마이크 권한이 제대로 설정되지 않을 수 있습니다</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-800 mb-4">🎯 모바일에서도 꼭 사용해야 한다면</h2>
              <ul className="space-y-2 text-purple-700">
                <li>• <strong>조용한 환경:</strong> 소음이 적은 곳에서 사용하세요</li>
                <li>• <strong>마이크 가까이:</strong> 마이크를 입에 가깝게 유지하세요</li>
                <li>• <strong>명확한 발음:</strong> 천천히, 명확하게 말씀하세요</li>
                <li>• <strong>권한 확인:</strong> 브라우저 설정에서 마이크 권한을 확인하세요</li>
                <li>• <strong>Chrome 사용:</strong> 가능하면 Chrome 브라우저를 사용하세요</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/test"
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors text-center"
            >
              PC에서 테스트 시작
            </Link>
            
            <Link 
              href="/stt-check"
              className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors text-center"
            >
              모바일에서 계속 사용
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              더 나은 학습 경험을 위해 PC에서 이용하시는 것을 강력히 권장합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 