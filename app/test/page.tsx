'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

// Web Speech API 타입 정의
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
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

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
    SpeechGrammarList: new () => SpeechGrammarList
    webkitSpeechGrammarList: new () => SpeechGrammarList
  }
}

interface SpeechGrammarList {
  length: number
  item(index: number): SpeechGrammar
  [index: number]: SpeechGrammar
  addFromURI(src: string, weight?: number): void
  addFromString(string: string, weight?: number): void
}

interface SpeechGrammar {
  src: string
  weight: number
}

// 타입 정의
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

// 기본 샘플 데이터 (fallback용)
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
  
  // 모든 state 선언을 최상단에 배치
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('IM2')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [listenCount, setListenCount] = useState(0)
  const [showQuestionDetails, setShowQuestionDetails] = useState(false)
  const [showAnswerPreview, setShowAnswerPreview] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [isCountdownMode, setIsCountdownMode] = useState(false)
  const [countdownTime, setCountdownTime] = useState(0)
  const [selectedTimeOption, setSelectedTimeOption] = useState<number | null>(null)
  const [questionsLoaded, setQuestionsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  
  // 실제 녹음 관련 상태 추가
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null)
  const [isRecordingReady, setIsRecordingReady] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  
  // STT (Speech-to-Text) 관련 상태 추가
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null)
  const [recognizedText, setRecognizedText] = useState<string>('')
  const [interimText, setInterimText] = useState<string>('')
  const [isSTTSupported, setIsSTTSupported] = useState(false)
  const [sttError, setSTTError] = useState<string | null>(null)

  // 디버그 로그 상태 추가 (모바일 디버깅용)
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [showDebugLogs, setShowDebugLogs] = useState(false)

  // 모든 함수들을 useEffect보다 먼저 정의
  const loadQuestions = async (category: string) => {
    // 이미 로딩 중이거나 로딩 완료된 경우 중복 실행 방지
    if (isLoading || questionsLoaded) {
      return
    }
    
    setIsLoading(true)
    setLoading(true)
    try {
      let fileName = ''
      switch (category) {
        case 'S':
          fileName = 'topic.json'
          break
        case 'RP':
          fileName = 'roleplay.json'
          break
        case 'C':
          fileName = 'combination.json'
          break
        case 'MOCK':
          fileName = 'mock_test.json'
          break
        default:
          fileName = 'topic.json'
      }

      const response = await fetch(`/data/${fileName}`)
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`)
      }
      
      const data = await response.json()
      
      // JSON 구조에 따라 질문 추출
      let extractedQuestions: Question[] = []
      
      if (data.themes && typeof data.themes === 'object') {
        // combination.json, topic.json 등의 구조
        Object.values(data.themes).forEach((themeQuestions: any) => {
          if (Array.isArray(themeQuestions)) {
            extractedQuestions = extractedQuestions.concat(themeQuestions)
          }
        })
      } else if (Array.isArray(data)) {
        // 배열 형태의 JSON
        extractedQuestions = data
      } else if (data.questions && Array.isArray(data.questions)) {
        // questions 배열이 있는 구조
        extractedQuestions = data.questions
      }

      if (extractedQuestions.length > 0) {
        // 카테고리별 문제 선택 로직
        let selectedQuestions: Question[] = []
        
        if (category === 'S') {
          // 선택주제: 랜덤하게 q_id 1개 선택 후, 해당 q_id의 모든 문제를 q_seq 순서로
          const uniqueQIds = Array.from(new Set(extractedQuestions.map(q => q.q_id)))
          
          if (uniqueQIds.length === 0) {
            console.warn('No valid q_ids found for category S')
            selectedQuestions = defaultQuestions
          } else {
            // 더 안전한 랜덤 선택
            const randomIndex = Math.floor(Math.random() * uniqueQIds.length)
            const randomQId = uniqueQIds[randomIndex]
            
            // 선택된 q_id의 모든 문제들을 q_seq 순서로 정렬
            const questionsForSelectedId = extractedQuestions
              .filter(q => q.q_id === randomQId)
              .sort((a, b) => a.q_seq - b.q_seq)
            
            selectedQuestions = questionsForSelectedId
          }
        } else if (category === 'C') {
          // 돌발주제: 랜덤하게 3개 문제 선택 (각기 다른 테마에서)
          const groupedByTheme: { [key: string]: Question[] } = {}
          extractedQuestions.forEach(q => {
            const theme = q.theme || q.Theme || q.q_theme
            if (theme && !groupedByTheme[theme]) {
              groupedByTheme[theme] = []
            }
            if (theme) {
              groupedByTheme[theme].push(q)
            }
          })
          
          const themes = Object.keys(groupedByTheme).filter(theme => groupedByTheme[theme].length > 0)
          
          if (themes.length === 0) {
            console.warn('No valid themes found for category C')
            selectedQuestions = defaultQuestions
          } else {
            // Fisher-Yates 셔플을 사용한 더 안전한 랜덤 선택
            const shuffledThemes = [...themes]
            for (let i = shuffledThemes.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[shuffledThemes[i], shuffledThemes[j]] = [shuffledThemes[j], shuffledThemes[i]]
            }
            
            const selectedThemes = shuffledThemes.slice(0, Math.min(3, themes.length))
            
            selectedThemes.forEach(theme => {
              const themeQuestions = groupedByTheme[theme]
              if (themeQuestions && themeQuestions.length > 0) {
                const randomIndex = Math.floor(Math.random() * themeQuestions.length)
                const randomQuestion = themeQuestions[randomIndex]
                selectedQuestions.push(randomQuestion)
              }
            })
          }
        } else {
          // 다른 카테고리들: 랜덤하게 3개 선택
          if (extractedQuestions.length === 0) {
            selectedQuestions = defaultQuestions
          } else {
            const shuffled = [...extractedQuestions]
            // Fisher-Yates 셔플
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }
            selectedQuestions = shuffled.slice(0, Math.min(3, shuffled.length))
          }
        }
        
        if (selectedQuestions.length > 0) {
          setQuestions(selectedQuestions)
          
          // 세션 스토리지에 문제들 저장 (타임스탬프 포함으로 캐시 만료 체크)
          const sessionKey = `questions_${category}`
          const sessionData = {
            questions: selectedQuestions,
            timestamp: Date.now(),
            selectedInfo: category === 'S' 
              ? { type: 'topic', qId: selectedQuestions[0]?.q_id, theme: selectedQuestions[0]?.q_theme }
              : { type: 'combination', themes: selectedQuestions.map(q => q.q_theme || q.theme || q.Theme) }
          }
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionData))
        } else {
          console.warn(`No questions selected from ${fileName}`)
          setQuestions(defaultQuestions)
        }
      } else {
        console.warn(`No questions found in ${fileName}`)
        setQuestions(defaultQuestions)
      }
    } catch (error) {
      console.error('Error loading questions:', error)
      
      // 파일이 없는 경우의 fallback 처리
      if (error instanceof Error && error.message.includes('Failed to load')) {
        let fallbackMessage = ''
        switch (category) {
          case 'RP':
            fallbackMessage = '롤플레이 문제는 아직 준비 중입니다.'
            break
          case 'MOCK':
            fallbackMessage = '모의고사 문제는 아직 준비 중입니다.'
            break
          default:
            fallbackMessage = '문제를 불러올 수 없습니다.'
        }
        
        // 임시로 기본 문제를 보여주되, 메시지를 표시
        const tempQuestion: Question = {
          category: category,
          theme: "임시",
          q_theme: "임시",
          q_id: 0,
          q_seq: 1,
          listen: "temp.mp3",
          type: "(알림)",
          question: fallbackMessage,
          question_kr: fallbackMessage
        }
        setQuestions([tempQuestion])
      } else {
        setQuestions(defaultQuestions)
      }
    } finally {
      setLoading(false)
      setQuestionsLoaded(true)
      setIsLoading(false)
    }
  }

  // 마이크 초기화 함수
  const initializeMicrophone = async () => {
    try {
      setRecordingError(null)
      
      // STT 정확도 향상을 위한 고품질 오디오 설정
      const audioConstraints = {
        audio: {
          echoCancellation: true,        // 에코 제거
          noiseSuppression: true,        // 노이즈 억제
          autoGainControl: true,         // 자동 음량 조절
          sampleRate: 44100,             // 고품질 샘플레이트
          sampleSize: 16,                // 16비트 샘플
          channelCount: 1,               // 모노 채널 (음성 인식에 최적)
          // 추가 음성 인식 최적화 설정
          googEchoCancellation: true,
          googAutoGainControl: true,
          googNoiseSuppression: true,
          googHighpassFilter: true,
          googTypingNoiseDetection: true,
          googAudioMirroring: false
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints)
      setAudioStream(stream)
      
      // MediaRecorder 설정 (최고 품질)
      let mimeType = 'audio/webm;codecs=opus'
      
      // 브라우저별 최적 코덱 선택
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')) {
        mimeType = 'audio/mp4;codecs=mp4a.40.2'
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus'
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        audioBitsPerSecond: 128000 // 고품질 비트레이트
      })
      
      const chunks: Blob[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setRecordedAudioUrl(url)
        setRecordedChunks([...chunks])
        chunks.length = 0 // 배열 초기화
      }
      
      setMediaRecorder(recorder)
      setIsRecordingReady(true)
      
    } catch (error) {
      console.error('마이크 접근 실패:', error)
      setRecordingError('마이크 접근 권한이 필요합니다. 브라우저에서 마이크 권한을 허용해주세요.')
      setIsRecordingReady(false)
    }
  }

  // 실제 녹음 시작 함수
  const startActualRecording = async () => {
    if (!mediaRecorder || !isRecordingReady) {
      await initializeMicrophone()
      return
    }
    
    try {
      // 이전 녹음 데이터 초기화
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
        setRecordedAudioUrl(null)
      }
      setRecordedChunks([])
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingError(null)
      
      // STT 시작
      startSpeechRecognition()
      
      if (!isCountdownMode) {
        setRecordingTime(0)
      }
    } catch (error) {
      console.error('녹음 시작 실패:', error)
      setRecordingError('녹음 시작에 실패했습니다.')
    }
  }

  // 실제 녹음 정지 함수  
  const stopActualRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecording(false)
    }
    
    // STT 중지
    stopSpeechRecognition()
  }

  // 녹음된 오디오 재생 함수
  const playRecordedAudio = () => {
    if (recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl)
      audio.play().catch(error => {
        console.error('재생 실패:', error)
        alert('녹음된 오디오 재생에 실패했습니다.')
      })
    }
  }

  // STT 초기화 함수
  const initializeSpeechRecognition = () => {
    try {
      // 브라우저 호환성 확인
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (!SpeechRecognition) {
        setIsSTTSupported(false)
        setSTTError('이 브라우저는 음성 인식을 지원하지 않습니다.')
        addDebugLog('🔍 SpeechRecognition: Not Available - 브라우저가 지원하지 않음')
        return null
      }

      // 모바일 환경 감지 추가
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      addDebugLog(`📱 Device Detection: ${isMobile ? 'Mobile' : 'Desktop'}`)
      addDebugLog(`🌐 User Agent: ${navigator.userAgent}`)
      addDebugLog(`🔒 Protocol: ${location.protocol}`)
      addDebugLog(`🏠 Hostname: ${location.hostname}`)

      const recognition = new SpeechRecognition()
      
      // STT 정확도 향상을 위한 고급 설정 (모바일 최적화)
      if (isMobile) {
        // 모바일에서는 더 안정적인 설정 사용
        recognition.continuous = false
        recognition.interimResults = false
        addDebugLog('📱 Mobile Mode: continuous=false, interimResults=false')
      } else {
        recognition.continuous = true
        recognition.interimResults = true
        addDebugLog('💻 Desktop Mode: continuous=true, interimResults=true')
      }
      recognition.lang = 'en-US' // 영어 설정 (OPIc는 영어 시험)
      
      // 추가 정확도 향상 설정 (타입 안전성을 위해 any로 캐스팅)
      const enhancedRecognition = recognition as any
      
      // 여러 대안 결과 요청 (더 정확한 결과 선택 가능)
      if ('maxAlternatives' in enhancedRecognition) {
        enhancedRecognition.maxAlternatives = 3
      }
      
      // OPIc 특화 문법 힌트 (가능한 경우)
      if ('grammars' in enhancedRecognition && window.SpeechGrammarList) {
        const grammarList = new window.SpeechGrammarList()
        
        // OPIc 일반적인 표현들
        const opic_phrases = `
          #JSGF V1.0;
          grammar opic;
          public <opic> = 
            (I think | I believe | In my opinion | From my perspective |
             My hobby is | I like to | I enjoy | I prefer |
             Let me tell you about | Speaking of | Regarding |
             First of all | Secondly | Finally | In conclusion |
             For example | For instance | Such as | Like |
             Actually | Basically | Generally | Obviously |
             That reminds me | Come to think of it | By the way);
        `
        
        try {
          grammarList.addFromString(opic_phrases, 1)
          enhancedRecognition.grammars = grammarList
          addDebugLog('📝 Grammar hints applied successfully')
        } catch (e) {
          // 문법 힌트 적용 실패는 정상적일 수 있음 (무시)
          addDebugLog('📝 Grammar hints not supported, continuing without them')
        }
      }

      // 음성 인식 결과 처리 (다중 대안 지원)
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''
        let bestConfidence = 0

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          
          // 가장 신뢰도가 높은 대안 선택
          let bestAlternative = result[0]
          for (let j = 0; j < result.length; j++) {
            if (result[j].confidence > bestAlternative.confidence) {
              bestAlternative = result[j]
            }
          }
          
          const transcript = bestAlternative.transcript
          const confidence = bestAlternative.confidence
          bestConfidence = Math.max(bestConfidence, confidence)
          
          if (result.isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        // 최종 텍스트 업데이트 (신뢰도 기반 필터링)
        if (finalTranscript && bestConfidence > 0.3) { // 30% 이상 신뢰도만 채택
          addDebugLog(`🎤 STT Result: ${finalTranscript} (confidence: ${bestConfidence.toFixed(2)})`)
          setRecognizedText(prev => prev + finalTranscript)
        }
        
        // 임시 텍스트 업데이트 (실시간 표시용) - 모바일이 아닐 때만
        if (!isMobile) {
          setInterimText(interimTranscript)
        }
      }

      // 에러 처리
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        addDebugLog(`🚨 STT 오류: ${event.error} ${event.message}`)
        
        // 상세한 에러 메시지
        let errorMessage = `음성 인식 오류: ${event.error}`
        switch (event.error) {
          case 'no-speech':
            errorMessage = '음성이 감지되지 않았습니다. 마이크에 대고 말씀해 주세요.'
            break
          case 'audio-capture':
            errorMessage = '마이크에 접근할 수 없습니다. 마이크 권한을 확인해주세요.'
            break
          case 'not-allowed':
            errorMessage = isMobile 
              ? '마이크 사용이 차단되었습니다. 브라우저 주소창 옆 설정에서 마이크 권한을 허용해주세요.'
              : '마이크 사용이 차단되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.'
            break
          case 'network':
            errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
            break
          case 'bad-grammar':
            errorMessage = '음성 인식 문법 오류입니다.'
            break
          case 'service-not-allowed':
            errorMessage = '음성 인식 서비스가 차단되었습니다. 브라우저 설정을 확인해주세요.'
            break
          case 'language-not-supported':
            errorMessage = '지원되지 않는 언어입니다.'
            break
        }
        
        setSTTError(errorMessage)
      }

      // STT 시작/종료 이벤트
      recognition.onstart = () => {
        addDebugLog('🎤 STT Started successfully')
        setSTTError(null)
      }

      recognition.onend = () => {
        addDebugLog('🎤 STT Ended')
        // 모바일이 아니고 녹음이 계속 진행 중이면 STT도 다시 시작
        if (!isMobile && isRecording) {
          try {
            recognition.start()
          } catch (error) {
            // STT 재시작 실패는 무시 (정상적일 수 있음)
            addDebugLog(`🔄 STT restart failed: ${error}`)
          }
        }
      }

      setSpeechRecognition(recognition)
      setIsSTTSupported(true)
      addDebugLog(`✅ SpeechRecognition initialized successfully ${isMobile ? '(Mobile Mode)' : '(Desktop Mode)'}`)
      return recognition
      
    } catch (error) {
      addDebugLog(`❌ STT 초기화 실패: ${error}`)
      setIsSTTSupported(false)
      setSTTError('음성 인식 초기화에 실패했습니다.')
      return null
    }
  }

  // STT 시작 함수
  const startSpeechRecognition = () => {
    if (speechRecognition && isSTTSupported) {
      try {
        // 모바일에서 명시적 마이크 권한 요청
        const requestMicrophonePermission = async () => {
          try {
            addDebugLog('🎤 Requesting microphone permission...')
            await navigator.mediaDevices.getUserMedia({ audio: true })
            addDebugLog('✅ Microphone permission granted')
            return true
          } catch (error) {
            addDebugLog(`❌ Microphone permission denied: ${error}`)
            setSTTError('마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.')
            return false
          }
        }

        // 마이크 권한 확인 후 STT 시작
        const startSTT = async () => {
          const hasPermission = await requestMicrophonePermission()
          if (!hasPermission) return

          setRecognizedText('') // 기존 텍스트 초기화
          setInterimText('') // 임시 텍스트도 초기화
          addDebugLog('🚀 Starting Speech Recognition...')
          speechRecognition.start()
        }

        startSTT()
      } catch (error) {
        addDebugLog(`❌ STT 시작 실패: ${error}`)
        setSTTError('음성 인식 시작에 실패했습니다.')
      }
    } else {
      addDebugLog('❌ STT not supported or not initialized')
      setSTTError('음성 인식이 지원되지 않거나 초기화되지 않았습니다.')
    }
  }

  // STT 중지 함수
  const stopSpeechRecognition = () => {
    if (speechRecognition) {
      try {
        speechRecognition.stop()
        setInterimText('') // 임시 텍스트 초기화
      } catch (error) {
        // STT 중지 실패는 무시 (정상적일 수 있음)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleListen = () => {
    if (listenCount >= 2) {
      return
    }

    const audioFileName = questions[currentQuestionIndex]?.listen
    if (!audioFileName) {
      addDebugLog('No audio file specified for this question')
      return
    }

    // 현재 문제의 카테고리 확인
    const questionCategory = questions[currentQuestionIndex]?.category || selectedCategory
    
    // 카테고리별 오디오 파일 경로 생성
    const audioPath = `/audio/${questionCategory}/${audioFileName}`

    // 기존 오디오가 재생 중이면 정지
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
    }

    // 새 오디오 요소 생성
    const audio = new Audio(audioPath)
    setAudioElement(audio)
    setIsPlaying(true)

    // 오디오 이벤트 리스너
    audio.addEventListener('play', () => {
      setListenCount(prev => prev + 1)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setAudioElement(null)
    })

    audio.addEventListener('error', (e) => {
      addDebugLog(`Audio playback error: ${e}`)
      setIsPlaying(false)
      setAudioElement(null)
    })

    // 오디오 재생 시작
    audio.play().catch(error => {
      addDebugLog(`Failed to play audio: ${error}`)
      setIsPlaying(false)
      setAudioElement(null)
    })
  }

  const handleStartRecording = () => {
    startActualRecording()
  }

  const handleStopRecording = () => {
    stopActualRecording()
  }

  const handleResetRecording = () => {
    stopActualRecording()
    
    // 이전 녹음 데이터 정리
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl)
      setRecordedAudioUrl(null)
    }
    setRecordedChunks([])
    
    // STT 텍스트 초기화
    setRecognizedText('')
    setInterimText('')
    setSTTError(null)
    
    if (isCountdownMode) {
      setCountdownTime(selectedTimeOption || 0)
    } else {
      setRecordingTime(0)
    }
  }

  const handleTimerClick = () => {
    setShowTimerModal(true)
  }

  const handleTimeSelection = (seconds: number) => {
    setSelectedTimeOption(seconds)
    setCountdownTime(seconds)
    setIsCountdownMode(true)
    setRecordingTime(0)
    setShowTimerModal(false)
  }

  const handleSubmitAnswer = () => {
    // 현재 문제의 테마 정보와 STT 텍스트를 포함하여 피드백 페이지로 이동
    const currentTheme = getTheme(currentQuestion)
    const userAnswer = recognizedText || "음성 인식된 답변이 없습니다. 녹음을 다시 시도해주세요."
    const feedbackUrl = `/feedback?question=${currentQuestionIndex + 1}&type=${encodeURIComponent(selectedType)}&category=${encodeURIComponent(selectedCategory)}&level=${encodeURIComponent(selectedLevel)}&theme=${encodeURIComponent(currentTheme)}&qid=${currentQuestion?.q_id}&qseq=${currentQuestion?.q_seq}&answer=${encodeURIComponent(userAnswer)}`
    router.push(feedbackUrl)
  }

  // 새로운 함수: 다음 문제로 이동
  const handleNextQuestion = () => {
    const nextQuestionIndex = currentQuestionIndex + 1
    if (nextQuestionIndex < totalQuestions) {
      const nextQuestionNumber = nextQuestionIndex + 1
      router.push(`/test?type=${encodeURIComponent(selectedType)}&category=${selectedCategory}&question=${nextQuestionNumber}&level=${encodeURIComponent(selectedLevel)}`)
    }
  }

  const handleBack = () => {
    router.back()
  }

  // 질문 텍스트 추출 (다양한 JSON 구조 지원)
  const getQuestionText = (question: Question) => {
    return question.Question || question.question || ''
  }

  const getQuestionType = (question: Question) => {
    return question.Type || question.type || ''
  }

  const getTheme = (question: Question) => {
    return question.Theme || question.theme || question.q_theme || ''
  }

  // 디버그 로그 추가 함수
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    setDebugLogs(prev => [...prev.slice(-4), logMessage]) // 최근 5개만 유지
    console.log(logMessage)
  }

  // 모든 useEffect를 함수 선언 이후에 배치
  // Query parameters에서 타입과 카테고리 읽기
  useEffect(() => {
    const type = searchParams.get('type') || '선택주제'
    const category = searchParams.get('category') || 'S'
    const level = searchParams.get('level') || 'IM2'
    setSelectedType(type)
    setSelectedCategory(category)
    setSelectedLevel(level)
  }, [searchParams])
  
  // 최초 문제 로딩 (한 번만)
  useEffect(() => {
    if (!questionsLoaded && !isLoading && selectedCategory) {
      // 세션 스토리지에서 기존 문제들 확인
      const sessionKey = `questions_${selectedCategory}`
      const storedData = sessionStorage.getItem(sessionKey)
      
      // URL에서 새로고침 파라미터 확인
      const forceRefresh = searchParams.get('refresh') === 'true'
      
      if (storedData && !forceRefresh) {
        try {
          const sessionData = JSON.parse(storedData)
          
          // 새로운 형식 (타임스탬프 포함) 체크
          if (sessionData.questions && sessionData.timestamp) {
            // 타임스탬프 체크 (10분 후 자동 만료)
            const isExpired = Date.now() - sessionData.timestamp > 10 * 60 * 1000
            
            if (!isExpired) {
              // 저장된 문제들이 있고 만료되지 않았으면 복원
              setQuestions(sessionData.questions)
              setQuestionsLoaded(true)
              setLoading(false)
              return
            } else {
              sessionStorage.removeItem(sessionKey)
            }
          } else if (Array.isArray(sessionData)) {
            // 기존 형식 (배열만) - 바로 새로 로딩
            sessionStorage.removeItem(sessionKey)
          }
        } catch (error) {
          addDebugLog(`세션 데이터 파싱 실패: ${error}`)
          sessionStorage.removeItem(sessionKey)
        }
      }
      
      // 저장된 문제가 없거나 만료되었거나 강제 새로고침인 경우 새로 로딩
      loadQuestions(selectedCategory)
    }
  }, [selectedCategory, questionsLoaded, isLoading, searchParams])

  useEffect(() => {
    const questionIndex = searchParams.get('question')
    if (questionIndex) {
      const index = parseInt(questionIndex) - 1
      setCurrentQuestionIndex(index)
      // 새 문제로 넘어갈 때 상태 초기화
      setListenCount(0)
      setRecordingTime(0)
      setIsRecording(false)
      setShowQuestionDetails(false)
      setShowAnswerPreview(false)
      setIsCountdownMode(false)
      setCountdownTime(0)
      setSelectedTimeOption(null)
    }
  }, [searchParams])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        if (isCountdownMode) {
          setCountdownTime(prev => {
            if (prev <= 1) {
              // 카운트다운이 0이 되면 자동으로 녹음 정지
              stopActualRecording()
              return 0
            }
            return prev - 1
          })
        } else {
          setRecordingTime(prev => prev + 1)
        }
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isCountdownMode])

  // 오디오 정리를 위한 useEffect
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 오디오 정지
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
    }
  }, [audioElement])

  // 문제가 바뀔 때 오디오 정지 및 상태 초기화
  useEffect(() => {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
      setAudioElement(null)
    }
    setIsPlaying(false)
  }, [currentQuestionIndex])

  // 컴포넌트 마운트 시 마이크 초기화
  useEffect(() => {
    const initializeAll = async () => {
      await initializeMicrophone()
      // 마이크 초기화 후 약간의 지연을 두고 STT 초기화
      setTimeout(() => {
        initializeSpeechRecognition()
      }, 500)
    }
    
    initializeAll()
    
    return () => {
      // 컴포넌트 언마운트 시 리소스 정리
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop())
      }
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl)
      }
      if (speechRecognition) {
        speechRecognition.stop()
      }
    }
  }, []) // 빈 의존성 배열로 한 번만 실행

  // 문제가 바뀔 때 녹음 상태 초기화
  useEffect(() => {
    // 녹음 중이면 정지
    if (isRecording) {
      stopActualRecording()
    }
    
    // 이전 녹음 데이터 정리
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl)
      setRecordedAudioUrl(null)
    }
    setRecordedChunks([])
    setRecordingTime(0)
    setIsCountdownMode(false)
    setCountdownTime(0)
    setSelectedTimeOption(null)
    
    // STT 상태 초기화
    setRecognizedText('')
    setInterimText('')
    setSTTError(null)
  }, [currentQuestionIndex])

  // 변수들 선언
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const displayTime = isCountdownMode ? countdownTime : recordingTime
  const timeOptions = [
    { label: '45s', value: 45 },
    { label: '1m', value: 60 },
    { label: '1.5m', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
    { label: '5m', value: 300 }
  ]

  // 조건부 렌더링은 모든 hooks 이후에
  // 로딩 상태
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

  // 문제가 없는 경우
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
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
          >
            <span className="mr-2">←</span>
            <span className="font-medium">뒤로가기</span>
          </button>

          {/* 디버그 로그 토글 버튼 (모바일용) */}
          <div className="mb-4">
            <button
              onClick={() => setShowDebugLogs(!showDebugLogs)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              🔍 디버그 로그 {showDebugLogs ? '숨기기' : '보기'}
            </button>
          </div>

          {/* 디버그 로그 표시 */}
          {showDebugLogs && (
            <div className="mb-6 p-4 bg-black text-green-400 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
              <h4 className="text-white font-bold mb-2">🔍 실시간 디버그 로그:</h4>
              {debugLogs.length === 0 ? (
                <p className="text-gray-400">로그가 없습니다.</p>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
              <button
                onClick={() => setDebugLogs([])}
                className="mt-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
              >
                로그 지우기
              </button>
            </div>
          )}

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

          {/* 현재 선택된 문제 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600 font-semibold">📋 선택된 문제 정보</span>
            </div>
            <div className="text-sm text-gray-700">
              {selectedCategory === 'S' ? (
                <div>
                  <span className="font-medium">선택주제:</span> {getTheme(questions[0])} 
                  <span className="text-gray-500 ml-2">(총 {totalQuestions}개 문제)</span>
                </div>
              ) : selectedCategory === 'C' ? (
                <div>
                  <span className="font-medium">돌발주제:</span> {questions.map(q => getTheme(q)).join(', ')}
                  <span className="text-gray-500 ml-2">(총 {totalQuestions}개 문제)</span>
                </div>
              ) : (
                <div>
                  <span className="font-medium">{selectedType}:</span> 총 {totalQuestions}개 문제
                </div>
              )}
            </div>
          </div>

          {/* 문제 듣기 섹션 */}
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
                <p className="text-gray-600 font-medium mb-6">
                  선택한 유형의 질문을 듣고 답변을 준비하세요.
                </p>
                <button 
                  onClick={handleListen}
                  disabled={listenCount >= 2 || isPlaying}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors mb-4 ${
                    listenCount >= 2 
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : isPlaying
                      ? 'bg-orange-500 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isPlaying ? '재생 중...' : listenCount >= 2 ? '듣기 완료' : '문제 듣기'}
                </button>
                <p className="text-sm text-red-500">
                  * 문제는 최대 2회만 들으실 수 있습니다. ({listenCount}/2)
                </p>
              </div>
            </div>
            
            {/* 문제 보기 드롭다운 */}
            <div className="mt-4">
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
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">
                      카테고리: {currentQuestion.category} | 
                      테마: {getTheme(currentQuestion)} | 
                      유형: {getQuestionType(currentQuestion)}
                    </div>
                    <p className="text-gray-800 font-medium mb-6">
                      {currentQuestion.question_kr}
                    </p>
                  </div>
                  <p className="text-gray-600 text-sm">
                    (한국어 문제를 바탕으로 영어 답변에 대해 말하여 주세요. 모국어 무엇인지 알 수없게 말해보세요.)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 답변 녹음 섹션 */}
          <div className="mb-8">
            <div className="bg-black text-white p-4 rounded-t-xl">
              <h3 className="text-lg font-bold">답변 녹음</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-8">
              {/* 녹음 에러 메시지 */}
              {recordingError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <p className="text-sm">{recordingError}</p>
                  <button 
                    onClick={initializeMicrophone}
                    className="mt-2 text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    다시 시도
                  </button>
                </div>
              )}
              
              {/* 마이크 준비 상태 */}
              {!isRecordingReady && !recordingError && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  <p className="text-sm">마이크를 준비하는 중...</p>
                </div>
              )}
              
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-800 mb-6">
                  {formatTime(displayTime)}
                </div>
                
                {/* 음성 파형 표시 */}
                <div className="flex justify-center items-center h-20 mb-8">
                  <div className="flex items-end space-x-1">
                    {Array.from({ length: 50 }, (_, i) => (
                      <div 
                        key={i}
                        className={`w-1 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-t ${
                          isRecording ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          height: `${Math.random() * 40 + 10}px`,
                          animationDelay: `${i * 50}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* 녹음 상태 표시 */}
                {isRecording && (
                  <div className="mb-4">
                    <div className="inline-flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                      녹음 중...
                    </div>
                  </div>
                )}
                
                {/* 녹음 완료 상태 표시 */}
                {recordedAudioUrl && !isRecording && (
                  <div className="mb-4">
                    <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      녹음 완료
                    </div>
                  </div>
                )}
                
                {/* 녹음 컨트롤 버튼들 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <button 
                    onClick={handleTimerClick}
                    className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    <span className="text-2xl mb-2">⏱️</span>
                    <span className="text-sm font-medium">타이머</span>
                  </button>
                  <button 
                    onClick={handleStartRecording}
                    disabled={isRecording || !isRecordingReady}
                    className={`flex flex-col items-center p-4 rounded-lg ${
                      isRecording || !isRecordingReady
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    <span className="text-2xl mb-2">🎤</span>
                    <span className="text-sm font-medium">녹음 시작</span>
                  </button>
                  <button 
                    onClick={handleStopRecording}
                    disabled={!isRecording}
                    className={`flex flex-col items-center p-4 rounded-lg ${
                      !isRecording 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <span className="text-2xl mb-2">⏸️</span>
                    <span className="text-sm font-medium">녹음 정지</span>
                  </button>
                  <button 
                    onClick={handleResetRecording}
                    className="flex flex-col items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    <span className="text-2xl mb-2">🔄</span>
                    <span className="text-sm font-medium">다시 녹음</span>
                  </button>
                </div>

                {/* 시간 설정 모달 */}
                {showTimerModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                      {/* 답변 시간 설정 */}
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">답변 시간 설정</h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {timeOptions.slice(0, 3).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleTimeSelection(option.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {timeOptions.slice(3).map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleTimeSelection(option.value)}
                              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-blue-600 text-sm mt-3">! 녹음 시작 버튼을 클릭하세요.</p>
                      </div>

                      {/* 닫기 버튼 */}
                      <button 
                        onClick={() => setShowTimerModal(false)}
                        className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mb-6">
                  녹음을 시작하려면 '녹음 시작' 버튼을 클릭하세요.
                </p>
              </div>
            </div>
            
            {/* 답변 미리보기 드롭다운 */}
            <div className="mt-4">
              <button 
                onClick={() => setShowAnswerPreview(!showAnswerPreview)}
                className="w-full flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="font-medium text-gray-700">답변 미리보기</span>
                <span className="transform transition-transform duration-200" style={{ transform: showAnswerPreview ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {showAnswerPreview && (
                <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 bg-white">
                  {/* STT 에러 메시지 */}
                  {sttError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                      <p className="text-sm">{sttError}</p>
                    </div>
                  )}
                  
                  {/* STT 지원 여부 표시 */}
                  {!isSTTSupported && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                      <p className="text-sm">음성 인식이 지원되지 않는 브라우저입니다. Chrome 브라우저를 사용해주세요.</p>
                    </div>
                  )}
                  
                  {/* 인식된 텍스트 표시 */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">음성 인식 텍스트:</h4>
                      <div className="flex gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${isSTTSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          STT: {isSTTSupported ? '지원됨' : '미지원'}
                        </span>
                        <span className={`px-2 py-1 rounded ${speechRecognition ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          초기화: {speechRecognition ? '완료' : '대기'}
                        </span>
                        <span className={`px-2 py-1 rounded ${isRecording ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                          녹음: {isRecording ? '진행중' : '대기'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border min-h-[100px]">
                      {(recognizedText || interimText) ? (
                        <div className="text-gray-800 whitespace-pre-wrap">
                          <span>{recognizedText}</span>
                          {interimText && (
                            <span className="text-blue-600 italic bg-blue-50 px-1 rounded">
                              {interimText}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          {!isSTTSupported ? (
                            <p>❌ 음성 인식이 지원되지 않습니다.</p>
                          ) : !speechRecognition ? (
                            <p>⏳ STT 초기화 중...</p>
                          ) : isRecording ? (
                            <p>🎤 음성을 인식하는 중... (말씀해 주세요)</p>
                          ) : (
                            <p>🔇 아직 인식된 텍스트가 없습니다. 녹음을 시작해주세요.</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 디버깅 정보 (개발용) */}
                    <div className="mt-2 text-xs text-gray-400">
                      <details>
                        <summary className="cursor-pointer">디버깅 정보</summary>
                        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                          <p>브라우저: {navigator.userAgent.includes('Chrome') ? 'Chrome ✅' : 'Other ⚠️'}</p>
                          <p>STT 지원: {isSTTSupported ? 'Yes ✅' : 'No ❌'}</p>
                          <p>SpeechRecognition: {window.SpeechRecognition ? 'Available ✅' : 'Not Available ❌'}</p>
                          <p>webkitSpeechRecognition: {window.webkitSpeechRecognition ? 'Available ✅' : 'Not Available ❌'}</p>
                          <p>SpeechGrammarList: {window.SpeechGrammarList ? 'Available ✅' : 'Not Available ⚠️'}</p>
                          <p>인식된 텍스트 길이: {recognizedText.length}자</p>
                          <p>임시 텍스트 길이: {interimText.length}자</p>
                          
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="font-medium text-purple-700">🎲 문제 선택 정보:</p>
                            <p>카테고리: {selectedCategory}</p>
                            <p>현재 문제: {currentQuestionIndex + 1}/{totalQuestions}</p>
                            <p>테마: {getTheme(currentQuestion)}</p>
                            <p>문제 ID: {currentQuestion?.q_id}</p>
                            <p>문제 순서: {currentQuestion?.q_seq}</p>
                            <p>세션 키: questions_{selectedCategory}</p>
                            <button
                              onClick={() => {
                                const sessionData = sessionStorage.getItem(`questions_${selectedCategory}`)
                                if (sessionData) {
                                  try {
                                    const parsed = JSON.parse(sessionData)
                                    addDebugLog('📦 현재 세션 데이터:')
                                    alert(`세션 데이터가 콘솔에 출력되었습니다.\n타임스탬프: ${parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : '없음'}`)
                                  } catch (e) {
                                    addDebugLog('세션 데이터 (파싱 실패):')
                                  }
                                } else {
                                  addDebugLog('세션에 저장된 데이터가 없습니다.')
                                }
                              }}
                              className="mt-1 px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                            >
                              세션 데이터 확인
                            </button>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-300">
                            <p className="font-medium text-blue-700">🚀 정확도 향상 기능:</p>
                            <p>• 다중 대안 분석 (최대 3개)</p>
                            <p>• 신뢰도 기반 필터링 (30% 이상)</p>
                            <p>• OPIc 특화 문법 힌트</p>
                            <p>• 고품질 오디오 캡처</p>
                            <p>• 노이즈 억제 + 에코 제거</p>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                  
                  {/* 녹음된 오디오 재생 */}
                  {recordedAudioUrl && (
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">녹음된 오디오:</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <audio 
                          controls 
                          src={recordedAudioUrl}
                          className="w-full"
                          preload="metadata"
                        >
                          브라우저가 오디오 재생을 지원하지 않습니다.
                        </audio>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={playRecordedAudio}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                        >
                          재생하기
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = recordedAudioUrl
                            link.download = `opic-answer-${Date.now()}.webm`
                            link.click()
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                        >
                          오디오 다운로드
                        </button>
                        <button
                          onClick={() => {
                            // 텍스트 파일로 다운로드
                            const textBlob = new Blob([recognizedText], { type: 'text/plain;charset=utf-8' })
                            const textUrl = URL.createObjectURL(textBlob)
                            const link = document.createElement('a')
                            link.href = textUrl
                            link.download = `opic-answer-text-${Date.now()}.txt`
                            link.click()
                            URL.revokeObjectURL(textUrl)
                          }}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
                          disabled={!recognizedText}
                        >
                          텍스트 다운로드
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 녹음이 없는 경우 */}
                  {!recordedAudioUrl && !recognizedText && (
                    <p className="text-gray-600">아직 녹음된 답변이 없습니다. 위에서 녹음을 시작해주세요.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 답변 제출 버튼 */}
          <div className="flex justify-center">
            <button 
              onClick={handleSubmitAnswer}
              className="w-full max-w-md py-4 px-8 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span>✓</span>
              답변제출 및 피드백받기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 