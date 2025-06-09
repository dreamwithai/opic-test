'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// Speech Recognition type declaration

export default function STTTestPage() {
  // STT 관련 상태
  const [recognition, setRecognition] = useState<any>(null)
  const [isSTTActive, setIsSTTActive] = useState(false)
  const [sttText, setSttText] = useState('')
  const [sttError, setSttError] = useState('')
  const [finalTranscripts, setFinalTranscripts] = useState<string[]>([])
  const [interimTranscript, setInterimTranscript] = useState('')
  
  // 디바이스 정보
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [browserInfo, setBrowserInfo] = useState<any>({})
  const [microphonePermission, setMicrophonePermission] = useState<string>('unknown')
  
  // 테스트 설정
  const [selectedLanguage, setSelectedLanguage] = useState('en-US')
  const [continuous, setContinuous] = useState(true)
  const [interimResults, setInterimResults] = useState(true)
  
  // 오디오 레벨 시각화
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  
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

    collectDeviceInfo()
    checkMicrophonePermission()
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
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = selectedLanguage

    recognition.onstart = () => {
      setIsSTTActive(true)
      setSttError('')
      addLog('STT 시작됨')
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const confidence = event.results[i][0].confidence
        
        addLog(`결과 수신: "${transcript}" (신뢰도: ${confidence?.toFixed(2) || 'N/A'}, 최종: ${event.results[i].isFinal})`)
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimText += transcript
        }
      }

      if (finalTranscript) {
        setFinalTranscripts(prev => [...prev, finalTranscript])
      }
      
      setInterimTranscript(interimText)
      setSttText(finalTranscripts.join(' ') + ' ' + interimText)
    }

    recognition.onerror = (event) => {
      const errorMsg = `STT 오류: ${event.error} - ${event.message || ''}`
      setSttError(errorMsg)
      setIsSTTActive(false)
      addLog(errorMsg)
    }

    recognition.onend = () => {
      setIsSTTActive(false)
      addLog('STT 종료됨')
    }

    return recognition
  }

  const startSTT = async () => {
    try {
      addLog('STT 시작 시도 중...')
      
      // 마이크 권한 먼저 요청
      await requestMicrophoneAccess()
      
      // 기존 recognition이 있으면 정리
      if (recognition) {
        recognition.stop()
        setRecognition(null)
      }
      
      const newRecognition = initializeSpeechRecognition()
      if (newRecognition) {
        setRecognition(newRecognition)
        addLog('SpeechRecognition 객체 생성 완료')
        
        // 모바일에서는 사용자 제스처가 필요할 수 있으므로 즉시 시작
        setTimeout(() => {
          try {
            newRecognition.start()
            addLog('recognition.start() 호출됨')
          } catch (err) {
            addLog('recognition.start() 오류: ' + err)
            setSttError('STT 시작 오류: ' + err)
          }
        }, 100)
      }
    } catch (error) {
      addLog('STT 시작 실패: ' + error)
      setSttError('STT 시작 실패: ' + error)
    }
  }

  const stopSTT = () => {
    if (recognition && isSTTActive) {
      recognition.stop()
    }
    
    // 오디오 컨텍스트 정리
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop())
      micStreamRef.current = null
    }
  }

  const resetSTT = () => {
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
      // HTTPS 환경 체크
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        const httpsError = 'HTTPS 환경이 필요합니다. 모바일에서는 보안상 HTTPS에서만 마이크 접근이 가능합니다.'
        addLog(httpsError)
        throw new Error(httpsError)
      }
      
      // navigator.mediaDevices 지원 확인
      if (!navigator.mediaDevices) {
        const noMediaDevicesError = 'navigator.mediaDevices가 지원되지 않습니다. 브라우저가 너무 오래되었거나 HTTPS 환경이 아닐 수 있습니다.'
        addLog(noMediaDevicesError)
        throw new Error(noMediaDevicesError)
      }
      
      // getUserMedia 지원 확인
      if (!navigator.mediaDevices.getUserMedia) {
        const noGetUserMediaError = 'getUserMedia가 지원되지 않습니다.'
        addLog(noGetUserMediaError)
        throw new Error(noGetUserMediaError)
      }
      
      addLog('마이크 접근 시도 중...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      micStreamRef.current = stream
      
      // 오디오 컨텍스트 생성 (모바일에서 suspend 상태일 수 있음)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 모바일에서 AudioContext가 suspended 상태인 경우 resume
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
        addLog('AudioContext resumed')
      }
      
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      
      // 오디오 레벨 모니터링
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average)
        }
        
        if (isSTTActive) {
          requestAnimationFrame(updateAudioLevel)
        }
      }
      
      updateAudioLevel()
      addLog('마이크 접근 허용됨')
      
    } catch (error: any) {
      const errorMsg = `마이크 접근 실패: ${error.name || 'Unknown'} - ${error.message || error}`
      addLog(errorMsg)
      
      // 구체적인 에러 타입별 안내
      if (error.name === 'NotAllowedError') {
        addLog('사용자가 마이크 권한을 거부했습니다.')
      } else if (error.name === 'NotFoundError') {
        addLog('마이크를 찾을 수 없습니다.')
      } else if (error.name === 'NotSupportedError') {
        addLog('이 브라우저에서는 마이크 접근이 지원되지 않습니다.')
      } else if (error.name === 'NotReadableError') {
        addLog('마이크가 다른 애플리케이션에서 사용 중입니다.')
      } else if (error.name === 'SecurityError') {
        addLog('보안 오류: HTTPS 환경이 필요할 수 있습니다.')
      }
      
      throw error
    }
  }

  const clearLogs = () => {
    setTestLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                ← Admin
              </Link>
              <h1 className="text-xl font-bold text-gray-800">STT 기능 테스트</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSTTActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isSTTActive ? 'STT 활성' : 'STT 비활성'}
              </span>
            </div>
          </div>
        </div>
      </header>

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

            {/* 오디오 레벨 표시 */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">오디오 레벨</h3>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">현재 레벨: {Math.round(audioLevel)}</p>
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
                  {finalTranscripts.map((text, index) => (
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