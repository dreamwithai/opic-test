'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'
import Breadcrumb from '@/app/components/Breadcrumb'
import FullScreenLoader from '@/app/components/FullScreenLoader'
import LoadingSpinner from '@/app/components/LoadingSpinner'

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

  const playAudio = (audioUrl: string | null) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    if (!audioUrl) {
      alert('재생할 오디오 파일이 없습니다.');
      return;
    }

    // audioUrl은 이제 'permanent/...' 형태의 올바른 상대 경로
    const { data: urlData } = supabase.storage.from('recordings').getPublicUrl(audioUrl);
    
    // getPublicUrl이 반환하는 URL에서 '/render/raw' 경로 제거
    const fullAudioUrl = urlData.publicUrl.replace('/render/raw', '');

    console.log('Playing audio from relative path:', audioUrl);
    console.log('Final public URL:', fullAudioUrl);

    const audio = new Audio(fullAudioUrl);
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      console.error('Audio error details:', audio.error)
      alert('오디오 파일을 재생할 수 없습니다.')
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
            onClick={() => router.push('/mypage')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            마이페이지로 돌아가기
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
            onClick={() => router.push('/mypage')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            마이페이지로 돌아가기
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
            { label: '결과 상세보기' }
          ]} />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">결과 상세보기</h1>
              <p className="text-gray-600 mt-2">
                {sessionData.type} ({sessionData.theme}) - {new Date(sessionData.started_at).toLocaleDateString()}
              </p>
            </div>
            <Link
              href="/mypage"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              마이페이지로 돌아가기
            </Link>
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
                    문제 {index + 1} (Q{answer.q_id}-{answer.q_seq})
                  </h3>
                  {answer.answer_url && (
                    <div className="flex items-center gap-2">
                      {isPlaying ? (
                        <button
                          onClick={stopAudio}
                          className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                        >
                          <Pause size={16} />
                          정지
                        </button>
                      ) : (
                        <button
                          onClick={() => playAudio(answer.answer_url!)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          <Play size={16} />
                          재생
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 답변 내용 */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">내 답변:</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 leading-relaxed">{answer.answer_text}</p>
                  </div>
                </div>

                {/* 피드백 */}
                {feedback && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-700 mb-3">피드백:</h4>
                    
                    {feedback.overallComment && (
                      <div className="mb-4">
                        <h5 className="font-medium text-blue-600 mb-2">전체 평가:</h5>
                        <p className="text-gray-700 leading-relaxed">{feedback.overallComment}</p>
                      </div>
                    )}

                    {feedback.grammarFeedback && feedback.grammarFeedback.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-green-600 mb-2">문법 피드백:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {feedback.grammarFeedback.map((item: string, idx: number) => (
                            <li key={idx} className="text-gray-700 text-sm">{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedback.pronunciationFeedback && feedback.pronunciationFeedback.length > 0 && (
                      <div className="mb-4">
                        <h5 className="font-medium text-purple-600 mb-2">발음 피드백:</h5>
                        <ul className="list-disc list-inside space-y-1">
                          {feedback.pronunciationFeedback.map((item: string, idx: number) => (
                            <li key={idx} className="text-gray-700 text-sm">{item}</li>
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
      </div>
    </div>
  )
} 