'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getAudioUrl } from '@/lib/supabase'

// Speech Recognition type declaration
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

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

// Question type interface
interface Question {
  category: string
  theme?: string
  Theme?: string
  q_theme: string
  q_id: number
  q_seq: number
  listen: string
  type?: string
  Type?: string
  question?: string
  Question?: string
  question_kr: string
}

// Default fallback questions
const defaultQuestions: Question[] = [
  {
    category: "S",
    Theme: "House",
    q_theme: "House",
    q_id: 1,
    q_seq: 1,
    listen: "House_001_001.mp3",
    Type: "(Description) ",
    Question: "I would like you to talk about where you live. Describe your house to me. What does it look like? Where is it located?",
    question_kr: "(묘사>집) 당신이 사는 곳에 대해 이야기해 주세요. 당신의 집을 설명해 주세요. 어떻게 생겼나요? 어디 위치해 있나요?"
  }
]

export default function TestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('선택주제')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('IM2')
  const [listenCount, setListenCount] = useState(0)
  const [showQuestionDetails, setShowQuestionDetails] = useState(false)
  const [showAnswerPreview, setShowAnswerPreview] = useState(false)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState('')
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingError, setRecordingError] = useState('')
  const [waveformAnimation, setWaveformAnimation] = useState(0)
  
  // Timer modal states
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState(90) // 기본 1.5분
  const [isTimerMode, setIsTimerMode] = useState(false) // 타이머 모드 여부
  const [remainingTime, setRemainingTime] = useState(0) // 타이머 모드일 때 사용

  // STT states
  const [sttText, setSttText] = useState('') // 음성 인식 결과
  const [isSTTActive, setIsSTTActive] = useState(false) // STT 활성화 상태
  const [sttError, setSttError] = useState('') // STT 에러 메시지
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null) // 음성 인식 객체

  // Load questions from API
  const loadQuestions = async (category: string) => {
    setLoading(true)
    
    try {
      // URL에 refresh=true가 있으면 세션 스토리지 클리어
      const refreshParam = searchParams.get('refresh')
      const sessionKey = `questions_${category}_${selectedType}`
      
      if (refreshParam === 'true') {
        sessionStorage.removeItem(sessionKey)
      }
      
      // 세션 스토리지에서 기존 문제 확인 (피드백에서 돌아온 경우)
      const storedQuestions = sessionStorage.getItem(sessionKey)
      
      if (storedQuestions && refreshParam !== 'true') {
        try {
          const parsedQuestions = JSON.parse(storedQuestions)
          setQuestions(parsedQuestions)
          setLoading(false)
          return
        } catch (error) {
          // 파싱 실패 시 새로운 문제 로딩
        }
      }

      let questionType = ''
      switch (category) {
        case 'S':
          questionType = '선택주제'
          break
        case 'C':
          questionType = '돌발주제'
          break
        case 'RP':
          questionType = '롤플레이'
          break
        case 'MOCK':
          questionType = '모의고사'
          break
        default:
          questionType = '선택주제'
      }
      
      const response = await fetch(`/api/questions?type=${encodeURIComponent(questionType)}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load ${questionType} data`)
      }
      
      const data = await response.json()
      
      let extractedQuestions: Question[] = []
      
      if (data.themes && typeof data.themes === 'object') {
        Object.values(data.themes).forEach((themeQuestions: any) => {
          if (Array.isArray(themeQuestions)) {
            extractedQuestions = extractedQuestions.concat(themeQuestions)
          }
        })
      } else if (Array.isArray(data)) {
        extractedQuestions = data
      }

      if (extractedQuestions.length > 0) {
        let selectedQuestions: Question[] = []
        
        // 모든 카테고리에서 동일한 로직: 랜덤 q_id 선택 후 해당 q_id의 모든 문제를 q_seq 순서대로 가져오기
        const uniqueQIds = Array.from(new Set(extractedQuestions.map(q => q.q_id)))
        
        if (uniqueQIds.length > 0) {
          const randomIndex = Math.floor(Math.random() * uniqueQIds.length)
          const randomQId = uniqueQIds[randomIndex]
          
          selectedQuestions = extractedQuestions
            .filter(q => q.q_id === randomQId)
            .sort((a, b) => a.q_seq - b.q_seq)
        } else {
          selectedQuestions = defaultQuestions
        }
        
        // 세션 스토리지에 선택된 문제들 저장
        try {
          sessionStorage.setItem(sessionKey, JSON.stringify(selectedQuestions))
        } catch (error) {
          // 세션 스토리지 저장 실패 시 무시
        }
        
        setQuestions(selectedQuestions)
      } else {
        setQuestions(defaultQuestions)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      setQuestions(defaultQuestions)
    } finally {
      setLoading(false)
    }
  }

  // Handle audio playback
  const handleListen = async () => {
    if (listenCount >= 2) return

    const audioFileName = questions[currentQuestionIndex]?.listen
    if (!audioFileName) {
      setAudioError('오디오 파일 정보가 없습니다.')
      return
    }
    
    setAudioLoading(true)
    setAudioError('')
    
    try {
      // 오디오 파일 경로 (Supabase Storage에서 가져오기)
      const audioPath = getAudioUrl(audioFileName, selectedCategory)
      
      // 새 Audio 객체 생성
      const audio = new Audio(audioPath)
      
      // 오디오 로드 완료 대기
      await new Promise((resolve, reject) => {
        audio.addEventListener('loadeddata', resolve)
        audio.addEventListener('error', reject)
        audio.load()
      })
      
      // 오디오 재생
      await audio.play()
      
      // 재생 횟수 증가
      setListenCount(prev => prev + 1)
      
      // 재생 완료 또는 에러 시 로딩 상태 해제
      audio.addEventListener('ended', () => {
        setAudioLoading(false)
      })
      
      audio.addEventListener('error', () => {
        setAudioLoading(false)
        setAudioError('오디오 재생 중 오류가 발생했습니다.')
      })
      
    } catch (error) {
      setAudioLoading(false)
      setAudioError('오디오 파일을 찾을 수 없습니다. 관리자에게 문의하세요.')
      console.error('Audio playback error:', error)
    }
  }

  // Utility functions
  const getQuestionText = (question: Question) => {
    return question.Question || question.question || ''
  }

  const getTheme = (question: Question) => {
    return question.Theme || question.theme || question.q_theme || ''
  }

  const handleBack = () => {
    router.back()
  }

  // Recording functions
  const startRecording = async () => {
    try {
      setRecordingError('')
      setSttError('')
      
      // 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // MediaRecorder 생성
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setRecordedBlob(blob)
        stream.getTracks().forEach(track => track.stop()) // 마이크 스트림 정리
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      
      // STT 시작
      startSTT()
      
    } catch (error) {
      setRecordingError('마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.')
      console.error('Recording start error:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
    
    // STT 중지
    stopSTT()
  }

  const resetRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
    }
    setIsRecording(false)
    setRecordedBlob(null)
    setRecordingTime(0)
    if (isTimerMode) {
      setRemainingTime(selectedTime) // 타이머 모드에서만 리셋
    }
    setRecordingError('')
    
    // STT 리셋
    resetSTT()
  }

  const playRecording = () => {
    if (recordedBlob) {
      const audioUrl = URL.createObjectURL(recordedBlob)
      const audio = new Audio(audioUrl)
      audio.play()
    }
  }

  // STT functions
  const initializeSpeechRecognition = () => {
    if (typeof window === 'undefined') return null

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttError('이 브라우저는 음성 인식을 지원하지 않습니다.')
      return null
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US' // 영어로 설정

    recognition.onstart = () => {
      setIsSTTActive(true)
      setSttError('')
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // 최종 결과와 임시 결과를 결합하여 표시
      setSttText(prev => {
        const existingFinal = prev.split('...')[0] // 기존 최종 텍스트
        return existingFinal + finalTranscript + (interimTranscript ? '...' + interimTranscript : '')
      })
    }

    recognition.onerror = (event) => {
      setSttError(`음성 인식 오류: ${event.error}`)
      setIsSTTActive(false)
    }

    recognition.onend = () => {
      setIsSTTActive(false)
    }

    return recognition
  }

  const startSTT = () => {
    if (!recognition) {
      const newRecognition = initializeSpeechRecognition()
      if (newRecognition) {
        setRecognition(newRecognition)
        newRecognition.start()
      }
    } else {
      recognition.start()
    }
  }

  const stopSTT = () => {
    if (recognition && isSTTActive) {
      recognition.stop()
    }
  }

  const resetSTT = () => {
    setSttText('')
    setSttError('')
    if (recognition && isSTTActive) {
      recognition.stop()
    }
  }

  // Initialize from URL params
  useEffect(() => {
    const type = searchParams.get('type') || '선택주제'
    const category = searchParams.get('category') || 'S'
    const level = searchParams.get('level') || 'IM2'
    const questionParam = searchParams.get('question')
    
    setSelectedType(type)
    setSelectedCategory(category)
    setSelectedLevel(level)
    
    // URL에서 문제 번호가 전달된 경우 (피드백 페이지에서 온 경우)
    if (questionParam) {
      const questionIndex = parseInt(questionParam) - 1 // 1-based를 0-based로 변환
      if (questionIndex >= 0) {
        setCurrentQuestionIndex(questionIndex)
        setListenCount(0) // 새 문제이므로 듣기 횟수 초기화
      }
    }
  }, [searchParams])

  // Load questions when category is set
  useEffect(() => {
    if (selectedCategory) {
      loadQuestions(selectedCategory)
    }
  }, [selectedCategory])

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
        
        // 타이머 모드일 때만 카운트다운 실행
        if (isTimerMode) {
          setRemainingTime(prev => {
            const newTime = prev - 1
            
            // 시간이 0에 도달하면 녹음 자동 중지
            if (newTime <= 0) {
              stopRecording()
              return 0
            }
            
            return newTime
          })
        }
        
        setWaveformAnimation(prev => prev + 1) // 웨이브폼 애니메이션 업데이트
      }, 1000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRecording, isTimerMode])

  // 타이머 모드 설정 시 remainingTime 초기화
  useEffect(() => {
    if (isTimerMode && !isRecording) {
      setRemainingTime(selectedTime)
    }
  }, [selectedTime, isTimerMode, isRecording])

  // Format recording time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Format selected time for display
  const formatSelectedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`
    if (seconds === 60) return '1분'
    if (seconds === 90) return '1.5분'
    return `${Math.floor(seconds / 60)}분`
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">문제를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length

  // No questions available
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">문제를 찾을 수 없습니다.</p>
          <Link href="/question-type">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
              문제 유형 선택으로 돌아가기
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
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
            <span className="mx-2">›</span>
            <span>{selectedType}</span>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-3xl font-bold text-gray-800">문제풀이</h2>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">{selectedLevel}</span>
          </div>
          <p className="text-gray-600 font-medium mb-8">문제를 듣고 답변을 녹음하세요</p>

          {/* Question info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600 font-semibold">📋 선택된 문제 정보</span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                {selectedCategory === 'S' ? (
                  <div>
                    <div>
                      <span className="font-medium">선택주제:</span> {getTheme(questions[0])} 
                      <span className="text-gray-500 ml-2">(총 {totalQuestions}개 문제)</span>
                    </div>
                    {currentQuestion && (
                      <div className="text-xs text-gray-600 mt-1">
                        현재: Q{currentQuestion.q_id}-{currentQuestion.q_seq} | 
                        유형: {currentQuestion.type || currentQuestion.Type} | 
                        파일: {currentQuestion.listen}
                      </div>
                    )}
                  </div>
                ) : selectedCategory === 'C' ? (
                  <div>
                    <div>
                      <span className="font-medium">돌발주제:</span> {getTheme(questions[0])} 
                      <span className="text-gray-500 ml-2">(총 {totalQuestions}개 문제)</span>
                    </div>
                    {currentQuestion && (
                      <div className="text-xs text-gray-600 mt-1">
                        현재: Q{currentQuestion.q_id}-{currentQuestion.q_seq} | 
                        유형: {currentQuestion.type || currentQuestion.Type} | 
                        파일: {currentQuestion.listen}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div>
                      <span className="font-medium">{selectedType}:</span> 총 {totalQuestions}개 문제
                    </div>
                    {currentQuestion && (
                      <div className="text-xs text-gray-600 mt-1">
                        현재: Q{currentQuestion.q_id}-{currentQuestion.q_seq} | 
                        테마: {getTheme(currentQuestion)} | 
                        파일: {currentQuestion.listen}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question listening section */}
          <div className="mb-8">
            <div className="bg-black text-white p-4 rounded-t-xl">
              <h3 className="text-lg font-bold">문제 듣기</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-8">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                  {currentQuestionIndex + 1}/{totalQuestions}
                  <span className="text-2xl">→</span>
                </div>
                <p className="text-gray-600 text-sm mb-6">
                  선택한 유형의 질문을 듣고 답변을 준비하세요.
                </p>
                
                <button 
                  onClick={handleListen}
                  disabled={listenCount >= 2 || audioLoading}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors mb-4 ${
                    listenCount >= 2 
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : audioLoading
                      ? 'bg-yellow-500 text-white cursor-wait'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {audioLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">🔄</span>
                      재생 중...
                    </span>
                  ) : listenCount >= 2 ? (
                    '듣기 완료'
                  ) : (
                    '문제 듣기'
                  )}
                </button>
                
                <p className="text-sm text-red-500 mb-2">
                  * 문제는 최대 2회만 들으실 수 있습니다. ({listenCount}/2)
                </p>
                
                {audioError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <span>⚠️</span>
                      {audioError}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Question details dropdown */}
            <div className="mt-4 mb-4">
              <button 
                onClick={() => setShowQuestionDetails(!showQuestionDetails)}
                className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="font-medium text-gray-700">문제 보기</span>
                <span className="transform transition-transform duration-200" style={{ transform: showQuestionDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {showQuestionDetails && (
                <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white">
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-800 font-medium text-sm">
                          {getQuestionText(currentQuestion)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-800 font-medium text-sm">
                          {currentQuestion.question_kr}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recording section */}
          <div className="mb-8">
            <div className="bg-black text-white p-4 rounded-t-xl">
              <h3 className="text-lg font-bold">답변 녹음</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-6">
              <div className="text-center">
                {/* Recording time display */}
                <div className="mb-4">
                  <div className="text-5xl font-bold text-gray-800 mb-3">
                    {isTimerMode ? formatTime(remainingTime) : formatTime(recordingTime)}
                  </div>
                  
                  {/* Audio waveform visualization */}
                  <div className="flex items-end justify-center gap-1.5 h-24 mb-8">
                    {Array.from({ length: 25 }, (_, i) => {
                      const baseHeight = 15 + (i % 4) * 6
                      const animatedHeight = isRecording 
                        ? baseHeight + Math.sin((waveformAnimation + i) * 0.5) * 35 + Math.random() * 20
                        : baseHeight + Math.sin(i * 0.3) * 15
                      
                      return (
                        <div 
                          key={i}
                          className={`bg-gradient-to-t from-blue-500 to-blue-300 rounded-sm transition-all duration-300 ${
                            isRecording ? 'shadow-sm' : 'opacity-70'
                          }`}
                          style={{ 
                            width: '6px',
                            height: `${Math.max(10, animatedHeight)}px`
                          }}
                        ></div>
                      )
                    })}
                  </div>
                </div>

                {/* Error message */}
                {recordingError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600 flex items-center justify-center gap-2">
                      <span>⚠️</span>
                      {recordingError}
                    </p>
                  </div>
                )}

                {/* Recording controls */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <button 
                    onClick={() => setShowTimerModal(true)}
                    className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors bg-white"
                  >
                    <span className="text-xl mb-1">⏱️</span>
                    <span className="text-sm font-medium text-center leading-tight">타이머</span>
                    <span className="text-xs text-gray-500">
                      {isTimerMode ? formatSelectedTime(selectedTime) : '카운트업'}
                    </span>
                  </button>
                  
                  <button 
                    onClick={startRecording}
                    disabled={isRecording}
                    className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                      isRecording 
                        ? 'bg-gray-300 cursor-not-allowed border border-gray-300' 
                        : 'bg-red-500 hover:bg-red-600 text-white border border-red-500'
                    }`}
                  >
                    <span className="text-xl mb-1">🎤</span>
                    <span className="text-sm font-medium text-center leading-tight">녹음<br />시작</span>
                  </button>
                  
                  <button 
                    onClick={stopRecording}
                    disabled={!isRecording}
                    className={`flex flex-col items-center p-3 border rounded-lg transition-colors ${
                      !isRecording 
                        ? 'border-gray-300 bg-gray-300 cursor-not-allowed text-gray-500' 
                        : 'border-gray-400 bg-gray-400 hover:bg-gray-500 text-white'
                    }`}
                  >
                    <span className="text-xl mb-1">⏸️</span>
                    <span className="text-sm font-medium text-center leading-tight">녹음<br />정지</span>
                  </button>
                  
                  <button 
                    onClick={resetRecording}
                    className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors bg-white"
                  >
                    <span className="text-xl mb-1">🔄</span>
                    <span className="text-sm font-medium text-center leading-tight">다시<br />녹음</span>
                  </button>
                </div>

                {/* Status message */}
                <p className="text-gray-600 text-sm">
                  {isRecording 
                    ? '녹음이 진행 중입니다. 답변을 말씀해 주세요.'
                    : recordedBlob 
                    ? '녹음이 완료되었습니다.'
                    : "녹음을 시작하려면 '녹음 시작' 버튼을 클릭하세요."
                  }
                </p>

                {/* Playback button */}
                {recordedBlob && !isRecording && (
                  <button
                    onClick={playRecording}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors mt-3 text-sm"
                  >
                    녹음 재생하기
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Answer Preview Section */}
          <div className="mt-4 mb-8">
            <button 
              onClick={() => setShowAnswerPreview(!showAnswerPreview)}
              className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-700">답변 미리보기</span>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isSTTActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  <span className="text-xs text-gray-600">
                    {isSTTActive ? 'STT 활성' : sttText ? '텍스트 인식됨' : 'STT 지원'}
                  </span>
                </div>
              </div>
              <span className="transform transition-transform duration-200" style={{ transform: showAnswerPreview ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>
            {showAnswerPreview && (
              <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white">
                {/* STT Error */}
                {sttError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <span>⚠️</span>
                      {sttError}
                    </p>
                  </div>
                )}

                {/* STT Text Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
                  {sttText ? (
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {sttText}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-xs">
                      🎤 아직 인식된 텍스트가 없습니다. 녹음을 시작해주세요.
                    </p>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mt-4">
                  * 녹음 시작 시 자동으로 음성 인식이 시작되며, 실시간으로 텍스트가 표시됩니다.
                </p>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-center">
            {currentQuestionIndex < questions.length - 1 ? (
              // 마지막 문제가 아닌 경우: 다음문제 버튼
              <button 
                onClick={() => {
                  // 녹음 중인지 확인
                  if (isRecording) {
                    alert('녹음이 진행 중입니다. 녹음을 정지한 후 다음 문제로 넘어가주세요.')
                    return
                  }
                  
                  // STT 텍스트와 녹음 데이터를 로컬 스토리지에 저장
                  const answerData = {
                    questionIndex: currentQuestionIndex,
                    qId: currentQuestion?.q_id,
                    qSeq: currentQuestion?.q_seq,
                    theme: getTheme(currentQuestion),
                    answer: sttText || "음성 인식된 답변이 없습니다. 녹음을 다시 시도해주세요.",
                    recordedBlob: recordedBlob
                  }
                  
                  // 기존 답변들 가져오기
                  const existingAnswers = JSON.parse(localStorage.getItem('testAnswers') || '[]')
                  existingAnswers[currentQuestionIndex] = answerData
                  localStorage.setItem('testAnswers', JSON.stringify(existingAnswers))
                  
                  // 다음 문제로 이동
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                  setRecordedBlob(null)
                  setSttText('')
                  setRecordingTime(0)
                  setListenCount(0)
                  
                  // 페이지 상단으로 스크롤
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isRecording 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={isRecording}
              >
                {isRecording ? '녹음 중...' : '다음문제'}
              </button>
            ) : (
              // 마지막 문제인 경우: 답변제출 및 피드백받기 버튼
              <button 
                onClick={() => {
                  // 녹음 중인지 확인
                  if (isRecording) {
                    alert('녹음이 진행 중입니다. 녹음을 정지한 후 답변을 제출해주세요.')
                    return
                  }
                  
                  const currentTheme = getTheme(currentQuestion)
                  const userAnswer = sttText || "음성 인식된 답변이 없습니다. 녹음을 다시 시도해주세요."
                  
                  // 마지막 답변도 저장
                  const answerData = {
                    questionIndex: currentQuestionIndex,
                    qId: currentQuestion?.q_id,
                    qSeq: currentQuestion?.q_seq,
                    theme: currentTheme,
                    answer: userAnswer,
                    recordedBlob: recordedBlob
                  }
                  
                  const existingAnswers = JSON.parse(localStorage.getItem('testAnswers') || '[]')
                  existingAnswers[currentQuestionIndex] = answerData
                  localStorage.setItem('testAnswers', JSON.stringify(existingAnswers))
                  
                  const feedbackUrl = `/feedback?question=${currentQuestionIndex + 1}&type=${encodeURIComponent(selectedType)}&category=${encodeURIComponent(selectedCategory)}&level=${encodeURIComponent(selectedLevel)}&theme=${encodeURIComponent(currentTheme)}&qid=${currentQuestion?.q_id}&qseq=${currentQuestion?.q_seq}&totalQuestions=${totalQuestions}&answer=${encodeURIComponent(userAnswer)}`
                  router.push(feedbackUrl)
                }}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  isRecording 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                disabled={isRecording}
              >
                {isRecording ? '녹음 중...' : '답변제출 및 피드백받기'}
              </button>
            )}
          </div>

          {/* Timer Modal */}
          {showTimerModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-80 max-w-md mx-4">
                <h3 className="text-lg font-bold text-center mb-6">답변 시간 설정</h3>
                
                {/* Time selection buttons */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: '45s', value: 45 },
                    { label: '1m', value: 60 },
                    { label: '1.5m', value: 90 }
                  ].map((time) => (
                    <button
                      key={time.value}
                      onClick={() => {
                        setSelectedTime(time.value)
                        setIsTimerMode(true)
                        setRemainingTime(time.value)
                      }}
                      className={`py-3 px-4 border rounded-lg font-medium transition-colors ${
                        selectedTime === time.value && isTimerMode
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: '2m', value: 120 },
                    { label: '3m', value: 180 },
                    { label: '5m', value: 300 }
                  ].map((time) => (
                    <button
                      key={time.value}
                      onClick={() => {
                        setSelectedTime(time.value)
                        setIsTimerMode(true)
                        setRemainingTime(time.value)
                      }}
                      className={`py-3 px-4 border rounded-lg font-medium transition-colors ${
                        selectedTime === time.value && isTimerMode
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>

                {/* Timer mode reset button */}
                <div className="mb-6">
                  <button 
                    onClick={() => {
                      setIsTimerMode(false)
                      setRemainingTime(0)
                    }}
                    className={`w-full py-2 px-4 border rounded-lg transition-colors text-sm ${
                      !isTimerMode
                        ? 'bg-green-500 text-white border-green-500'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    기본 모드 (카운트업)
                  </button>
                </div>

                {/* Info message */}
                <p className="text-blue-600 text-sm text-center mb-6">
                  ! 녹음 시작 버튼을 클릭하세요.
                </p>

                {/* Close button */}
                <button
                  onClick={() => setShowTimerModal(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 