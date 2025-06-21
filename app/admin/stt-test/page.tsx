'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'

// Speech Recognition type declaration

export default function STTTestPage() {
  return (
    <AdminGuard>
      <STTTestUI />
    </AdminGuard>
  )
}

function STTTestUI() {
  // STT 관련 상태
  const [recognition, setRecognition] = useState<any>(null)
  const [isSTTActive, setIsSTTActive] = useState(false)
  const [sttText, setSttText] = useState('')
  const [sttError, setSttError] = useState('')
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([])
  const [interimTranscript, setInterimTranscript] = useState('')
  const userStopped = useRef(false) // 사용자가 직접 중지했는지 여부
  
  // 디바이스 정보
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [browserInfo, setBrowserInfo] = useState<any>({})
  const [microphonePermission, setMicrophonePermission] = useState<string>('unknown')
  
  // 테스트 설정
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [continuous, setContinuous] = useState(true)
  const [interimResults, setInterimResults] = useState(true)
  
  // 단순화된 상태
  
  // 테스트 로그
  const [testLogs, setTestLogs] = useState<string[]>([])

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'ko-KR', name: '한국어' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'zh-CN', name: '中文' },
  ]

  useEffect(() => {
    // 디바이스 및 브라우저 정보 수집
    const collectDeviceInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        languages: navigator.languages,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screenWidth: screen.width,
        screenHeight: screen.height,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        touchSupport: 'ontouchstart' in window,
        speechRecognitionSupport: !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
        webkitSpeechRecognition: !!(window as any).webkitSpeechRecognition,
        mediaDevicesSupport: !!navigator.mediaDevices,
        getUserMediaSupport: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      }
      setDeviceInfo(info)
      
      // 브라우저 정보 파싱
      const userAgent = navigator.userAgent
      const browserInfo = {
        isChrome: /Chrome/.test(userAgent),
        isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
        isFirefox: /Firefox/.test(userAgent),
        isEdge: /Edge/.test(userAgent),
        isOpera: /Opera/.test(userAgent),
        isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
        isIOS: /iPhone|iPad|iPod/.test(userAgent),
        isAndroid: /Android/.test(userAgent)
      }
      setBrowserInfo(browserInfo)
    }

    // 마이크 권한 확인
    const checkMicrophonePermission = async () => {
      try {
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
          setMicrophonePermission(result.state)
          
          result.onchange = () => {
            setMicrophonePermission(result.state)
          }
        }
      } catch (err) {
        addLog('권한 확인 실패: ' + err)
      }
    }

    // 첫 번째 클릭 시 마이크 권한 요청 (모바일에서 중요!)
    const handleFirstClick = () => {
      requestMicrophoneAccess().catch(() => {}) // 에러는 무시
      document.removeEventListener('click', handleFirstClick)
    }

    collectDeviceInfo()
    checkMicrophonePermission()
    
    // 첫 번째 클릭 시 마이크 권한 요청 등록
    document.addEventListener('click', handleFirstClick, { once: true })

    return () => {
      document.removeEventListener('click', handleFirstClick)
    }
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestLogs(prev => [`[${timestamp}] ${message}`, ...prev])
  }

  const initializeSpeechRecognition = () => {
    if (typeof window === 'undefined') {
      addLog('서버 사이드에서는 STT를 사용할 수 없습니다.')
      return null
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttError('이 브라우저는 음성 인식을 지원하지 않습니다.')
      addLog('STT 지원되지 않음')
      return null
    }

    const recognition = new SpeechRecognition()
    
    // 모바일 최적화 설정 적용
    const settings = getMobileOptimizedSettings()
    recognition.continuous = settings.continuous
    recognition.interimResults = settings.interimResults
    recognition.maxAlternatives = settings.maxAlternatives
    recognition.lang = selectedLanguage

    // 모바일 환경 로그
    if (browserInfo.isMobile) {
      addLog(`📱 모바일 최적화 설정 적용: continuous=${settings.continuous}, interimResults=${settings.interimResults}`)
    }

    recognition.onstart = () => {
      setIsSTTActive(true)
      setSttError('')
      addLog('🎤 STT 시작됨')
    }

    recognition.onspeechstart = () => {
      addLog('🗣️ 음성이 감지되었습니다.')
    }

    recognition.onspeechend = () => {
      addLog('🔇 음성 감지가 종료되었습니다.')
    }

    recognition.onaudiostart = () => {
      addLog('🎵 오디오 캡처가 시작되었습니다.')
    }

    recognition.onaudioend = () => {
      addLog('🔇 오디오 캡처가 종료되었습니다.')
    }

    recognition.onresult = (event: any) => {
      const finalTexts: string[] = []
      let interimText = ''

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTexts.push(transcript.trim())
        } else {
          interimText = transcript.trim()
        }
      }
      
      // Filter out empty strings that might have been pushed
      const nonEmptyFinalTexts = finalTexts.filter(text => text)

      setFinalTranscripts(nonEmptyFinalTexts)
      setInterimTranscript(interimText)
      
      // Update the complete text view
      setSttText([...nonEmptyFinalTexts, interimText].filter(text => text).join(' '))
    }

    recognition.onerror = (event: any) => {
      let errorMessage = ''
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.'
          break
        case 'audio-capture':
          errorMessage = '오디오 캡처에 실패했습니다. 마이크를 확인해주세요.'
          break
        case 'not-allowed':
          errorMessage = '마이크 권한이 거부되었습니다. 브라우저 설정을 확인해주세요.'
          break
        case 'network':
          errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
          break
        case 'service-not-allowed':
          errorMessage = '음성 인식 서비스가 허용되지 않았습니다.'
          break
        case 'language-not-supported':
          errorMessage = '선택한 언어가 지원되지 않습니다.'
          break
        default:
          errorMessage = `알 수 없는 오류: ${event.error}`
      }
      
      setSttError(errorMessage)
      setIsSTTActive(false)
      addLog(`❌ 오류 발생: ${errorMessage}`)
    }

    recognition.onend = () => {
      addLog(`⏹️ STT onend event. User stopped: ${userStopped.current}`)
      
      if (userStopped.current) {
        setIsSTTActive(false)
      } else {
        // 비정상 종료 시 자동 재시작
        addLog('🔄 STT가 비정상적으로 종료되어 재시작합니다...')
        try {
          recognition.start()
        } catch (e) {
          addLog(`❌ 재시작 실패: ${e}`)
          setIsSTTActive(false)
        }
      }
    }

    return recognition
  }

  const startSTT = async () => {
    userStopped.current = false // 시작 시 플래그 리셋
    if (!recognition) {
      const newRecognition = initializeSpeechRecognition()
      if (newRecognition) {
        setRecognition(newRecognition)
      }
      return
    }

    if (isSTTActive) {
      addLog('⚠️ 이미 STT가 실행 중입니다.')
      return
    }

    try {
      // 모바일에서 마이크 권한 재확인
      if (browserInfo.isMobile) {
        addLog('📱 모바일 환경 - 마이크 권한 재확인 중...')
        await requestMicrophoneAccess()
      }

      addLog('🎤 STT 시작 시도 중...')
      recognition.start()
    } catch (error) {
      addLog('❌ STT 시작 실패: ' + error)
      setSttError('STT 시작 실패: ' + error)
    }
  }

  const stopSTT = () => {
    if (recognition && isSTTActive) {
      userStopped.current = true // 사용자가 직접 중지했음을 표시
      recognition.stop()
    }
  }

  const resetSTT = () => {
    userStopped.current = true // 리셋도 수동 중지로 간주
    stopSTT()
    setSttText('')
    setFinalTranscripts([])
    setInterimTranscript('')
    setSttError('')
    setRecognition(null)
    addLog('STT 리셋됨')
  }

  const requestMicrophoneAccess = async () => {
    try {
      addLog('📱 마이크 권한 요청 중...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      addLog('✅ 마이크 권한이 허용되었습니다.')
      // 스트림을 즉시 정리
      stream.getTracks().forEach(track => track.stop())
    } catch (error: any) {
      addLog(`❌ 마이크 권한 요청 실패: ${error.message}`)
      throw error
    }
  }

  const clearLogs = () => {
    setTestLogs([])
  }

  // 모바일 최적화된 STT 설정
  const getMobileOptimizedSettings = () => {
    // 모바일에서도 연속 인식을 활성화하여 긴 문장 지원
    return {
      continuous: true,
      interimResults: true,
      maxAlternatives: 1
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 디바이스 정보 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">디바이스 정보</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">플랫폼:</span>
                <span className="text-gray-600">{deviceInfo.platform}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">화면 크기:</span>
                <span className="text-gray-600">{deviceInfo.screenWidth}×{deviceInfo.screenHeight}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">브라우저 크기:</span>
                <span className="text-gray-600">{deviceInfo.innerWidth}×{deviceInfo.innerHeight}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">터치 지원:</span>
                <span className={deviceInfo.touchSupport ? 'text-green-600' : 'text-red-600'}>
                  {deviceInfo.touchSupport ? '지원' : '미지원'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">STT 지원:</span>
                <span className={deviceInfo.speechRecognitionSupport ? 'text-green-600' : 'text-red-600'}>
                  {deviceInfo.speechRecognitionSupport ? '지원' : '미지원'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">마이크 권한:</span>
                <span className={
                  microphonePermission === 'granted' ? 'text-green-600' : 
                  microphonePermission === 'denied' ? 'text-red-600' : 'text-yellow-600'
                }>
                  {microphonePermission}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium mb-2">브라우저 정보</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(browserInfo).map(([key, value]) => (
                  value ? (
                    <span key={key} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {key.replace('is', '')}
                    </span>
                  ) : null
                ))}
              </div>
            </div>
          </div>

          {/* STT 설정 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">STT 설정</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">언어 선택</label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={isSTTActive}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">연속 인식</label>
                <input
                  type="checkbox"
                  checked={continuous}
                  onChange={(e) => setContinuous(e.target.checked)}
                  disabled={isSTTActive}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">중간 결과 표시</label>
                <input
                  type="checkbox"
                  checked={interimResults}
                  onChange={(e) => setInterimResults(e.target.checked)}
                  disabled={isSTTActive}
                  className="rounded"
                />
              </div>
            </div>


          </div>

          {/* STT 컨트롤 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">STT 컨트롤</h2>
            
            <div className="flex gap-3 mb-4">
              <button
                onClick={startSTT}
                disabled={isSTTActive || !deviceInfo.speechRecognitionSupport}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                시작
              </button>
              
              <button
                onClick={stopSTT}
                disabled={!isSTTActive}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                중지
              </button>
              
              <button
                onClick={resetSTT}
                disabled={isSTTActive}
                className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                리셋
              </button>
            </div>

            {/* 에러 표시 */}
            {sttError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <span>⚠️</span>
                  {sttError}
                </p>
              </div>
            )}

            {/* STT 결과 */}
            <div className="border border-gray-200 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto bg-gray-50">
              {sttText ? (
                <div className="space-y-2">
                  {finalTranscripts.filter(text => text).map((text, index) => (
                    <div key={index} className="bg-white p-2 rounded border-l-4 border-green-500">
                      <span className="text-gray-800">{text}</span>
                    </div>
                  ))}
                  {interimTranscript && (
                    <div className="bg-yellow-50 p-2 rounded border-l-4 border-yellow-500">
                      <span className="text-gray-600 italic">{interimTranscript}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">
                  🎤 STT를 시작하면 인식된 텍스트가 여기에 표시됩니다.
                </p>
              )}
            </div>
          </div>

          {/* 테스트 로그 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">테스트 로그</h2>
              <button
                onClick={clearLogs}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                로그 지우기
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 max-h-[300px] overflow-y-auto bg-gray-50">
              {testLogs.length > 0 ? (
                <div className="space-y-1">
                  {testLogs.map((log, index) => (
                    <div key={index} className="text-xs font-mono text-gray-600 border-b border-gray-100 pb-1">
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">
                  테스트 로그가 여기에 표시됩니다.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* User Agent 정보 */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">User Agent</h2>
          <p className="text-xs font-mono text-gray-600 break-all">
            {deviceInfo.userAgent}
          </p>
        </div>

        {/* 사용 가이드 */}
        <div className="mt-6 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">테스트 가이드</h2>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• <strong>권한 확인:</strong> 마이크 권한이 granted인지 확인하세요.</p>
            <p>• <strong>브라우저 호환성:</strong> Chrome/Safari에서 가장 잘 동작합니다.</p>
            <p>• <strong>모바일 테스트:</strong> iOS Safari는 사용자 제스처 후에만 STT가 동작할 수 있습니다.</p>
            <p>• <strong>네트워크:</strong> STT는 인터넷 연결이 필요합니다.</p>
            <p>• <strong>오디오 레벨:</strong> 마이크가 소리를 잘 인식하고 있는지 확인하세요.</p>
            <p>• <strong>언어 설정:</strong> 다양한 언어로 테스트해보세요.</p>
          </div>
        </div>
      </div>
    </div>
  )
}