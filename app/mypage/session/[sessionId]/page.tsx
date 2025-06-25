'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'
import Breadcrumb from '@/app/components/Breadcrumb'
import FullScreenLoader from '@/app/components/FullScreenLoader'
import JSZip from 'jszip'

interface SessionData {
  id: string
  member_id: string
  type: string
  theme: string
  level: string
  started_at: string
  first_answer: string
  first_feedback: string
}

interface AnswerData {
  id: string
  session_id: string
  q_id: number
  q_seq: number
  answer_text: string
  answer_url: string | null
  feedback: string | null
  created_at: string
}

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, status } = useSession()
  const sessionId = params.sessionId as string
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [answers, setAnswers] = useState<AnswerData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const fetchSessionData = async () => {
      if (status === 'loading') return
      
      if (status !== 'authenticated' || !session?.user?.id) {
        setError('로그인이 필요합니다.')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError('')

        // 세션 데이터 가져오기
        const { data: sessionResult, error: sessionError } = await supabase
          .from('test_session')
          .select('*')
          .eq('id', sessionId)
          .eq('member_id', session.user.id)
          .single()

        if (sessionError || !sessionResult) {
          setError('세션을 찾을 수 없습니다.')
          setIsLoading(false)
          return
        }

        setSessionData(sessionResult)

        // 답변 데이터 가져오기
        const { data: answersResult, error: answersError } = await supabase
          .from('test_answers')
          .select('*')
          .eq('session_id', sessionId)
          .order('q_seq', { ascending: true })

        if (answersError) {
          console.error('Error fetching answers:', answersError)
          setAnswers([])
        } else {
          setAnswers(answersResult || [])
        }

      } catch (err) {
        console.error('Error fetching session data:', err)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessionData()
  }, [sessionId, status, session])

  const playAudio = async (audioUrl: string | null) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (!audioUrl) {
      alert('재생할 오디오 파일이 없습니다.');
      return;
    }

    try {
      // 1. 백엔드 API에 서명된 URL 요청
      const response = await fetch('/api/get-signed-audio-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: audioUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '오디오 URL을 가져오지 못했습니다.');
      }

      const { signedUrl } = await response.json();
      
      console.log('Playing audio from signed URL:', signedUrl);

      const audio = new Audio(signedUrl);
      
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e)
        console.error('Audio error details:', audio.error)
        alert('오디오 파일을 재생할 수 없습니다. 파일이 존재하지 않거나 접근 권한이 없을 수 있습니다.')
        setIsPlaying(false)
        setCurrentAudio(null);
      })
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      });
      audio.addEventListener('play', () => setIsPlaying(true))
      audio.addEventListener('pause', () => setIsPlaying(false))
      
      audio.play().catch((error) => {
        console.error('Audio play error:', error)
        alert('오디오 재생에 실패했습니다.')
        setIsPlaying(false)
        setCurrentAudio(null);
      })
      
      setCurrentAudio(audio)
    } catch (error) {
      console.error('Failed to get signed URL:', error);
      alert(error instanceof Error ? error.message : '오디오 재생 중 오류가 발생했습니다.');
      setIsPlaying(false);
    }
  }

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setIsPlaying(false)
      setCurrentAudio(null);
    }
  }

  const parseFeedback = (feedbackString: string | null) => {
    if (!feedbackString) return null
    
    try {
      return JSON.parse(feedbackString)
    } catch {
      // JSON 파싱 실패 시 문자열 그대로 반환
      return { overallComment: feedbackString }
    }
  }

  if (status === 'loading' || isLoading) {
    return <FullScreenLoader />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold"
          >
            ← 목록
          </button>
        </div>
      </div>
    )
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">세션을 찾을 수 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold"
          >
            ← 목록
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* 헤더 */}
        <div className="mb-6">
          <Breadcrumb items={[
            { href: '/', label: '홈' }, 
            { href: '/mypage', label: '마이페이지' }, 
            { label: '내 답변 다시보기' }
          ]} />
          <div className="mt-4 flex flex-row justify-between items-start gap-4">
            {/* 왼쪽: 타이틀(크게) */}
            <div className="text-3xl font-bold text-gray-800 flex-1">
              {
                sessionData.type === '롤플레이' && sessionData.theme ? `롤플레이_${sessionData.theme.slice(-2)}` :
                sessionData.type === '모의고사' && sessionData.theme ? `모의고사 ${sessionData.theme.slice(-3)}회` :
                `${sessionData.type} (${sessionData.theme})`
              }
            </div>
            {/* 오른쪽: 날짜(윗줄) + 버튼(아랫줄) 2줄, 오른쪽 정렬 */}
            <div className="flex flex-col items-end gap-1 min-w-[120px]">
              <div className="text-lg font-normal text-gray-600">
                {new Date(sessionData.started_at).getFullYear()}.{String(new Date(sessionData.started_at).getMonth() + 1).padStart(2, '0')}.{String(new Date(sessionData.started_at).getDate()).padStart(2, '0')}
              </div>
              <div className="flex gap-2 mt-1">
                {/* 전체 음성파일 다운로드 */}
                <button
                  className="flex items-center justify-center min-w-[32px] min-h-[32px] rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white text-blue-600 transition-colors shadow"
                  aria-label="전체 음성파일 다운로드"
                  onClick={async () => {
                    if (!answers.length) return alert('다운로드할 답변이 없습니다.');
                    const zip = new JSZip();
                    let hasAudio = false;
                    for (let i = 0; i < answers.length; i++) {
                      const answer = answers[i];
                      if (!answer.answer_url) continue;
                      // signedUrl 요청
                      const response = await fetch('/api/get-signed-audio-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath: answer.answer_url }),
                      });
                      if (!response.ok) continue;
                      const { signedUrl } = await response.json();
                      const audioRes = await fetch(signedUrl);
                      if (!audioRes.ok) continue;
                      const blob = await audioRes.blob();
                      zip.file(`answer_${i + 1}.webm`, blob);
                      hasAudio = true;
                    }
                    if (!hasAudio) return alert('다운로드할 음성파일이 없습니다.');
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(zipBlob);
                    a.download = `answers_audio.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  {/* 폴더+다운로드 아이콘 */}
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="7" width="18" height="11" rx="2" fill="#e0e7ef" stroke="#2563eb" strokeWidth="1.5"/>
                    <path d="M12 10v5m0 0l-2-2m2 2l2-2" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 7l2.5-3h13L21 7" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
                  </svg>
                </button>
                {/* 전체 텍스트 다운로드 */}
                <button
                  className="flex items-center justify-center min-w-[32px] min-h-[32px] rounded-full bg-gray-100 text-purple-600 hover:bg-purple-50 transition-colors shadow"
                  aria-label="전체 답변 텍스트 다운로드"
                  onClick={() => {
                    if (!answers.length) return alert('다운로드할 답변이 없습니다.');
                    const text = answers.map((a, i) => `문제 ${i + 1}\n${a.answer_text}\n`).join('\n');
                    const blob = new Blob([text], { type: 'text/plain' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'answers.txt';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  {/* 여러 문서(전체 텍스트) 아이콘 - 보라 계열(아웃라인) */}
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="4" y="7" width="14" height="10" rx="2" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5"/>
                    <rect x="7" y="4" width="14" height="10" rx="2" fill="#fff" stroke="#7c3aed" strokeWidth="1.5"/>
                    <path d="M10 9h8M10 12h8M10 15h4" stroke="#7c3aed" strokeWidth="1.2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 답변 목록 */}
        <div className="space-y-6">
          {answers.map((answer, index) => {
            const feedback = parseFeedback(answer.feedback)
            
            return (
              <div key={answer.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    문제 {index + 1}
                  </h3>
                  <div className="flex items-center gap-2">
                    {answer.answer_url && (
                      <>
                        {isPlaying ? (
                          <button
                            onClick={stopAudio}
                            className="flex items-center justify-center min-h-[28px] min-w-[28px] px-0 py-0 bg-red-500 text-white rounded-full text-base hover:bg-red-600 transition-colors"
                            aria-label="정지"
                          >
                            <Pause size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => playAudio(answer.answer_url!)}
                            className="flex items-center justify-center min-h-[28px] min-w-[28px] px-0 py-0 bg-green-500 text-white rounded-full text-base hover:bg-green-600 transition-colors"
                            aria-label="재생"
                          >
                            <Play size={18} />
                          </button>
                        )}
                        {/* 음성 다운로드 버튼 */}
                        <button
                          onClick={async () => {
                            const response = await fetch('/api/get-signed-audio-url', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ filePath: answer.answer_url }),
                            });
                            if (!response.ok) {
                              alert('다운로드 URL을 가져오지 못했습니다.');
                              return;
                            }
                            const { signedUrl } = await response.json();
                            const a = document.createElement('a');
                            a.href = signedUrl;
                            a.download = `answer_${index + 1}.webm`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="flex items-center justify-center min-h-[28px] min-w-[28px] px-0 py-0 bg-blue-500 text-white rounded-full text-base hover:bg-blue-600 transition-colors"
                          aria-label="다운로드"
                        >
                          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h8" /></svg>
                        </button>
                      </>
                    )}
                    {/* 답변 텍스트 복사 버튼 */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(answer.answer_text)
                        .then(() => alert('답변이 복사되었습니다!'))
                        .catch(() => alert('복사에 실패했습니다.'))
                      }}
                      className="flex items-center justify-center min-h-[28px] min-w-[28px] px-0 py-0 bg-purple-600 text-white rounded-full text-base hover:bg-purple-700 transition-colors"
                      aria-label="복사"
                    >
                      {/* 더 깔끔한 문서(폴드, 얇은 라인) 아이콘 */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="5" y="4" width="10" height="16" rx="2" stroke="#fff" strokeWidth="1.7" fill="none"/>
                        <polyline points="13,4 15,4 15,6" stroke="#fff" strokeWidth="1.7" fill="none"/>
                        <line x1="7" y1="9" x2="13" y2="9" stroke="#fff" strokeWidth="1.2"/>
                        <line x1="7" y1="12" x2="13" y2="12" stroke="#fff" strokeWidth="1.2"/>
                        <line x1="7" y1="15" x2="11" y2="15" stroke="#fff" strokeWidth="1.2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 답변 내용 */}
                <div className="mb-0">
                  <div className="bg-gray-50 rounded-lg p-1 w-full">
                    <p className="text-gray-800 text-sm leading-normal max-h-[11.5em] overflow-y-auto break-words" style={{ display: 'block', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
                      {answer.answer_text}
                    </p>
                  </div>
                </div>

                {/* 피드백 */}
                {feedback &&
                  feedback.overallComment &&
                  feedback.overallComment !== '피드백 준비 중...' &&
                  (feedback.overallComment.trim() !== '' || (feedback.grammarFeedback && feedback.grammarFeedback.length > 0) || (feedback.pronunciationFeedback && feedback.pronunciationFeedback.length > 0)) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">피드백:</h4>
                    {feedback.overallComment && (
                      <div className="mb-4">
                        <h5 className="font-medium text-blue-600 mb-2">전체 평가:</h5>
                        <p className="text-gray-700 leading-relaxed max-h-[11.5em] overflow-y-auto break-words" style={{ display: 'block', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
                          {feedback.overallComment}
                        </p>
                      </div>
                    )}
                    {feedback.grammarFeedback && feedback.grammarFeedback.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-600 mb-2">문법 피드백:</h5>
                        <ul className="list-disc list-inside space-y-1 max-h-[11.5em] overflow-y-auto" style={{ WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
                          {feedback.grammarFeedback.map((item: string, idx: number) => (
                            <li key={idx} className="text-gray-700 text-sm break-words">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.pronunciationFeedback && feedback.pronunciationFeedback.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-purple-600 mb-2">발음 피드백:</h5>
                        <ul className="list-disc list-inside space-y-1 max-h-[11.5em] overflow-y-auto" style={{ WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
                          {feedback.pronunciationFeedback.map((item: string, idx: number) => (
                            <li key={idx} className="text-gray-700 text-sm break-words">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 답변이 없는 경우 */}
        {answers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <p className="text-gray-600">이 세션에는 저장된 답변이 없습니다.</p>
          </div>
        )}

        {/* 마이페이지로 돌아가기 버튼 */}
        <div className="flex justify-center mt-10 mb-6">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold shadow transition-colors"
          >
            ← 목록
          </button>
        </div>
      </div>
    </div>
  )
} 