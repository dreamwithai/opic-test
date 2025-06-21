'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mic, CheckCircle2, XCircle, ShieldCheck, PlayCircle, StopCircle, ArrowRight, Loader2, Monitor } from 'lucide-react'
import Link from 'next/link'

// Speech Recognition type declarations
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onstart: () => void
  onend: () => void
  start(): void
  stop(): void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var SpeechRecognition: { prototype: SpeechRecognition; new(): SpeechRecognition }
declare var webkitSpeechRecognition: { prototype: SpeechRecognition; new(): SpeechRecognition }

export default function STTCheckPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'prompt' | 'granted' | 'denied'>('checking')
  const [activeTest, setActiveTest] = useState<'A' | 'B' | null>(null)
  const [results, setResults] = useState({
    A: { text: '', error: '' },
    B: { text: '', error: '' },
  })
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef<string>('')
  const [rememberChoice, setRememberChoice] = useState(true)

  // Get level and question type from URL
  const level = searchParams.get('level') || 'IM'
  const questionType = searchParams.get('type') || '선택주제'

  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.permissions) {
        setPermissionStatus('prompt'); // Fallback for older browsers
        return;
      }
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setPermissionStatus(result.state)
        result.onchange = () => setPermissionStatus(result.state)
      } catch {
        setPermissionStatus('prompt');
      }
    }
    checkPermission()

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {};
        recognitionRef.current.stop()
      }
    }
  }, [])

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the track immediately after getting permission
      setPermissionStatus('granted')
    } catch (err) {
      console.error(err)
      setPermissionStatus('denied')
    }
  }

  const initializeSpeechRecognition = (type: 'A' | 'B') => {
    const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionImpl) {
      const errorMsg = '이 브라우저는 음성 인식을 지원하지 않습니다.'
      if (type === 'A') setResults(r => ({ ...r, A: { ...r.A, error: errorMsg } }))
      else setResults(r => ({ ...r, B: { ...r.B, error: errorMsg } }))
      return null
    }

    const recognition = new SpeechRecognitionImpl()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => setActiveTest(type);

    recognition.onerror = (event) => {
      const errorMsg = `음성인식 오류: ${event.error}`
      if (type === 'A') setResults(r => ({ ...r, A: { text: '', error: errorMsg } }))
      else setResults(r => ({ ...r, B: { text: '', error: errorMsg } }))
    }
    
    recognition.onend = () => setActiveTest(null);

    if (type === 'A') {
      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' '
        }
        setResults(r => ({ ...r, A: { text: transcript.trim(), error: '' } }))
      }
    } else { // Type B with improved logic
      finalTranscriptRef.current = '' // Reset for new test
      recognition.onresult = (event) => {
        let interimTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPart = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcriptPart + ' '
          } else {
            interimTranscript += transcriptPart
          }
        }
        setResults(r => ({ ...r, B: { text: (finalTranscriptRef.current + interimTranscript).trim(), error: '' } }))
      }
    }
    return recognition
  }

  const startTest = (type: 'A' | 'B') => {
    stopTest() // Stop any previous test
    const newRecognition = initializeSpeechRecognition(type)
    if (newRecognition) {
      recognitionRef.current = newRecognition
      newRecognition.start()
    }
  }

  const stopTest = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setActiveTest(null)
    }
  }

  const selectTypeAndProceed = (selectedSTTType: 'A' | 'B') => {
    if (rememberChoice) {
      localStorage.setItem('savedSTTPreference', selectedSTTType)
    }
    sessionStorage.setItem('selectedSTTType', selectedSTTType)

    // Map questionType to category, needed for the /test page
    let category = '';
    switch (questionType) {
      case '선택주제': category = 'S'; break;
      case '롤플레이': category = 'RP'; break;
      case '돌발주제': category = 'C'; break;
      case '모의고사': category = 'MOCK'; break;
      default: category = 'S';
    }

    const destination = `/test?type=${encodeURIComponent(questionType)}&category=${category}&level=${level}&refresh=true`;
    router.push(destination);
  }

  const TestCard = ({ type, title, description }: { type: 'A' | 'B', title: string, description: string }) => {
    const result = type === 'A' ? results.A : results.B
    const isActive = activeTest === type

    return (
      <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4 flex-grow">{description}</p>
        <div className="min-h-[120px] bg-gray-100 rounded-lg p-3 my-4 text-gray-700 overflow-y-auto">
          {isActive && <span className="text-blue-600 animate-pulse">마이크에 대고 말씀해주세요...</span>}
          {result.text && !isActive && <p>{result.text}</p>}
          {result.error && <p className="text-red-500">{result.error}</p>}
          {!result.text && !result.error && !isActive && <p className="text-gray-400">테스트 시작 버튼을 눌러주세요.</p>}
        </div>
        <button
          onClick={() => (isActive ? stopTest() : startTest(type))}
          className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isActive ? <StopCircle className="mr-2" size={20} /> : <PlayCircle className="mr-2" size={20} />}
          {isActive ? '테스트 중지' : '테스트 시작'}
        </button>
      </div>
    )
  }

  const SelectionSection = () => (
    <div className="bg-white rounded-xl shadow-md p-6 mt-8">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <CheckCircle2 className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">3단계: 최종 선택</h2>
          <p className="text-gray-600">테스트 후 더 잘 인식된 타입을 선택하시거나, 바로 원하는 타입으로 테스트를 시작하세요.</p>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={() => selectTypeAndProceed('A')}
          className="w-full py-3 px-6 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          A 타입으로 테스트 시작 <ArrowRight className="ml-2" size={20} />
        </button>
        <button
          onClick={() => selectTypeAndProceed('B')}
          className="w-full py-3 px-6 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
        >
          B 타입으로 테스트 시작 <ArrowRight className="ml-2" size={20} />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <input
          type="checkbox"
          id="remember-choice"
          checked={rememberChoice}
          onChange={(e) => setRememberChoice(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="remember-choice" className="ml-2 block text-sm text-gray-700 font-medium">
          다음부터 이 설정으로 자동 시작 (이 페이지 건너뛰기)
        </label>
      </div>

      <div className="text-center mt-6 border-t pt-5">
        <p className="text-sm text-gray-500">
          두 타입 모두 인식이 잘 안되시나요?
          <Link href="/pc-guide" className="ml-2 inline-flex items-center text-blue-600 hover:underline font-semibold">
            <Monitor className="mr-1" size={16} />
            PC에서 더 안정적으로 이용해보세요.
          </Link>
        </p>
      </div>
    </div>
  )

  const PermissionCard = () => (
    <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
                <Mic className="text-blue-600" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">1단계: 마이크 권한 확인</h2>
                <p className="text-gray-600">음성인식 테스트를 위해 마이크 접근 권한이 필요합니다.</p>
            </div>
        </div>

        <div className="mt-4 p-4 rounded-lg flex items-center justify-between bg-gray-100">
            <span className="font-semibold text-gray-700">현재 상태:</span>
            {permissionStatus === 'checking' && <div className="flex items-center text-gray-600"><Loader2 className="animate-spin mr-2" size={16}/>확인 중...</div>}
            {permissionStatus === 'granted' && <div className="flex items-center text-green-600 font-bold"><CheckCircle2 className="mr-2" size={16}/>권한이 허용되었습니다.</div>}
            {permissionStatus === 'denied' && <div className="flex items-center text-red-600 font-bold"><XCircle className="mr-2" size={16}/>권한이 거부되었습니다.</div>}
            {permissionStatus === 'prompt' && <div className="flex items-center text-yellow-600 font-bold"><ShieldCheck className="mr-2" size={16}/>권한을 요청해야 합니다.</div>}
        </div>

        {(permissionStatus === 'prompt' || permissionStatus === 'denied') && (
            <div className="mt-4">
                <button onClick={requestPermission} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    마이크 권한 요청하기
                </button>
                {permissionStatus === 'denied' && <p className="text-xs text-red-500 mt-2 text-center">권한이 거부되었습니다. 브라우저 설정에서 마이크 접근을 직접 허용해주세요.</p>}
            </div>
        )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50 font-sans p-4 sm:p-6 md:p-8" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">모바일 STT 성능 점검</h1>
        <p className="text-gray-600 mb-8">사용하시는 기기에서 가장 잘 작동하는 음성 인식 타입을 선택해주세요.</p>

        <PermissionCard />

        {permissionStatus === 'granted' && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <Mic className="text-blue-600" size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">2단계: 타입별 테스트 진행</h2>
                    <p className="text-gray-600">두 가지 음성인식 타입을 테스트 해보세요.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <TestCard type="A" title="Type A: 표준 모드" description="가장 일반적이고 안정적인 방식입니다. 대부분의 기기에서 잘 작동합니다." />
                <TestCard type="B" title="Type B: 고급 모드" description="일부 모바일 환경에서 발생할 수 있는 중복 입력을 방지하는 방식입니다." />
              </div>
            </div>
            
            <SelectionSection />
          </div>
        )}
      </div>
    </main>
  )
} 