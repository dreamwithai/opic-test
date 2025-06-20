'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

// 샘플 질문 데이터
const sampleQuestions = [
  {
    category: "S",
    Theme: "Hobbies",
    q_theme: "Hobbies",
    q_id: 1,
    q_seq: 1,
    listen: "Hobbies_001_001.mp3",
    Type: "(Description) ",
    Question: "I would like you to talk about your hobbies. What do you like to do in your free time?",
    question_kr: "(묘사>취미) 당신의 취미에 대해 이야기해 주세요. 여가 시간에 무엇을 하는 것을 좋아하나요?"
  }
]

// 샘플 답변 데이터
const sampleAnswer = "I really enjoy watching movies on weekends. I especially like action and comedy movies. Recently, I watched a sci-fi movie called 'Dune' and it was very interesting. I like going to the theater, but I also enjoy watching Netflix comfortably at home. It's also fun to talk about movies with my friends."

// 피드백 데이터 생성 함수
const generateFeedbackData = (theme: string, qseq: number) => {
  const baseGrammarFeedback = [
    "Good use of 'enjoy + gerund' structure in your response.",
    "Nice choice of vocabulary appropriate to the topic.",
    "Consistent use of tenses throughout your answer."
  ]

  const basePronunciationFeedback = [
    "Try to make consonant sounds more distinct for clearer pronunciation.",
    "Consider working on your intonation to make speech more natural.",
    "Overall pronunciation is clear and understandable."
  ]

  return {
    overallScore: "good",
    overallComment: `Your speaking ability for the ${theme} topic is good. Your sentence structures are clear and you used appropriate vocabulary. To improve further, consider using more varied sentence structures and natural transitions between ideas.`,
    grammarFeedback: baseGrammarFeedback,
    pronunciationFeedback: basePronunciationFeedback
  }
}

// 기본 피드백 데이터 (fallback)
const defaultFeedbackData = {
  overallScore: "good",
  overallComment: "Overall, your speaking ability is good. Your sentence structures are simple but clear. You used appropriate vocabulary related to hobbies and effectively included examples. However, using more varied sentence structures and transition words would make your conversation sound more natural.",
  grammarFeedback: [
    "Good use of 'enjoy + gerund' structure in 'I enjoy watching movies'.",
    "Nice choice using 'I especially like' instead of just 'I like the most'. Consider using 'I prefer' for stronger preference statements.",
    "Consistent use of tenses. You appropriately distinguished between present and past tenses."
  ],
  pronunciationFeedback: [
    "In the word 'theater', try to make the 'th' sound more distinct by placing your tongue slightly between your front teeth.",
    "The final 'x' sound in 'Netflix' is a bit unclear. Practice making the combined 'ks' sound more clearly.",
    "Your intonation is somewhat flat throughout. Try emphasizing key words to create a more natural speech rhythm."
  ]
}

export default function FeedbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  // URL parameters
  const currentQuestion = searchParams.get('question') || '1'
  const selectedType = searchParams.get('type') || '선택주제'
  const selectedCategory = searchParams.get('category') || 'S'
  const selectedLevel = searchParams.get('level') || 'IM2'
  const currentTheme = searchParams.get('theme') || 'Unknown'
  const currentQId = searchParams.get('qid') || '1'
  const currentQSeq = searchParams.get('qseq') || '1'
  const userAnswer = searchParams.get('answer') || '답변을 찾을 수 없습니다.'
  
  // 모든 답변 가져오기
  const [allAnswers, setAllAnswers] = useState<any[]>([])
  
  useEffect(() => {
    const storedAnswers = JSON.parse(localStorage.getItem('testAnswers') || '[]')
    setAllAnswers(storedAnswers)
  }, [])

  const questionInfo = {
    questionIndex: parseInt(currentQuestion),
    theme: currentTheme,
    qid: parseInt(currentQId),
    qseq: parseInt(currentQSeq)
  }

  const [saveResult, setSaveResult] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveResult('');

    try {
      if (status === 'loading') {
        setSaveResult('🤔 로그인 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.');
        setIsSaving(false);
        return;
      }

      if (status !== 'authenticated' || !session) {
        setSaveResult('❌ 로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        setIsSaving(false);
        return;
      }

      // localStorage에서 모든 답변 가져오기
      const storedAnswers = JSON.parse(localStorage.getItem('testAnswers') || '[]');
      if (storedAnswers.length === 0) {
        setSaveResult('❌ 저장할 답변이 없습니다.');
        setIsSaving(false);
        return;
      }

      // 첫 번째 답변/피드백 일부 추출 (미리보기용)
      const firstAnswer = storedAnswers[0]?.answer || '';
      const firstFeedback = storedAnswers[0]?.feedback || '';

      // 1. test_session에 insert
      const { data: sessionData, error: sessionError } = await supabase.from('test_session').insert([
        {
          member_id: session.user.id,
          type: selectedType,
          theme: storedAnswers[0]?.theme || currentTheme,
          level: selectedLevel,
          first_answer: firstAnswer,
          first_feedback: typeof firstFeedback === 'string' ? firstFeedback : JSON.stringify(firstFeedback)
        }
      ]).select('id').single();

      if (sessionError || !sessionData) {
        setSaveResult('❌ 시험 세트 저장 실패: ' + (sessionError?.message || '오류'));
        setIsSaving(false);
        return;
      }
      const sessionId = sessionData.id;

      // 2. test_answers에 insert (session_id로 연결)
      const answersToInsert = storedAnswers
        .filter((answer: any) => answer && answer.answer)
        .map((answer: any) => ({
          session_id: sessionId,
          q_id: answer.qId || 0,
          q_seq: answer.qSeq || 0,
          answer_text: answer.answer,
          answer_url: answer.answer_url || null, // 녹음파일 등
          feedback: answer.feedback ? (typeof answer.feedback === 'string' ? answer.feedback : JSON.stringify(answer.feedback)) : null
        }));
      if (answersToInsert.length === 0) {
        setSaveResult('❌ 저장할 유효한 답변이 없습니다.');
        setIsSaving(false);
        return;
      }
      const { error: answersError } = await supabase.from('test_answers').insert(answersToInsert);
      if (answersError) {
        setSaveResult('❌ 답변 저장 실패: ' + answersError.message);
        setIsSaving(false);
        return;
      }

      setSaveResult(`✅ 시험 세트 및 ${answersToInsert.length}개 답변이 모두 저장되었습니다.`);
      localStorage.removeItem('testAnswers');
      
      // 마이페이지로 이동하기 전에 잠시 딜레이를 주어 메시지를 확인하게 함
      setTimeout(() => {
        router.push('/mypage');
      }, 1500);

    } catch (e) {
      console.error('Save error:', e);
      setSaveResult('❌ 저장 중 오류 발생: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      // isSaving 상태는 성공/실패 여부와 관계없이 1.5초 후에 풀어줌
      setTimeout(() => setIsSaving(false), 1500);
    }
  };

  const handleNextQuestion = () => {
    // URL 파라미터에서 총 문제 수 확인
    const urlTotalQuestions = searchParams.get('totalQuestions')
    let totalQuestions = 3 // 기본값
    
    if (urlTotalQuestions) {
      totalQuestions = parseInt(urlTotalQuestions)
    } else {
      // URL에 없으면 세션 스토리지 확인
      const sessionKey = `questions_${selectedCategory}_${selectedType}`
      let storedData = sessionStorage.getItem(sessionKey)
      
      // 키가 없으면 다른 키 형태들 시도
      if (!storedData) {
        const altKeys = [
          `questions_${selectedCategory}`,
          `selectedQuestions_${selectedCategory}`,
          `test_questions_${selectedCategory}`
        ]
        
        for (const key of altKeys) {
          storedData = sessionStorage.getItem(key)
          if (storedData) {
            break
          }
        }
      }
      
      if (storedData) {
        try {
          const sessionData = JSON.parse(storedData)
          totalQuestions = sessionData.questions ? sessionData.questions.length : 
                          sessionData.length ? sessionData.length : 3
        } catch (error) {
          // 파싱 에러 시 기본적으로 3문제로 가정
          totalQuestions = 3
        }
      } else {
        // 세션 데이터가 없으면 기본 3문제로 가정
        totalQuestions = 3
      }
    }
    
    const nextQuestionIndex = questionInfo.questionIndex + 1
    
    if (nextQuestionIndex <= totalQuestions) {
      // 다음 문제가 있으면 테스트 페이지의 다음 문제로 이동
      const nextTestUrl = `/test?type=${encodeURIComponent(selectedType)}&category=${selectedCategory}&question=${nextQuestionIndex}&level=${encodeURIComponent(selectedLevel)}`
      router.push(nextTestUrl)
    } else {
      // 모든 문제 완료 - 문제유형선택 페이지로 이동
      const completeUrl = `/question-type?level=${encodeURIComponent(selectedLevel)}`
      router.push(completeUrl)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const currentQuestionData = sampleQuestions.find(q => q.q_id === questionInfo.qid && q.q_seq === questionInfo.qseq)
  
  // 동적 피드백 데이터 생성
  const feedbackData = generateFeedbackData(questionInfo.theme, questionInfo.qseq)

  // 마지막 문제인지 확인
  const isLastQuestion = (() => {
    // 먼저 URL 파라미터에서 총 문제 수 확인 시도
    const urlTotalQuestions = searchParams.get('totalQuestions')
    if (urlTotalQuestions) {
      const total = parseInt(urlTotalQuestions)
      const isLast = questionInfo.questionIndex >= total
      return isLast
    }
    
    // URL에 없으면 세션 스토리지 확인
    const sessionKey = `questions_${selectedCategory}_${selectedType}`
    let storedData = sessionStorage.getItem(sessionKey)
    
    // 키가 없으면 다른 키 형태들 시도
    if (!storedData) {
      const altKeys = [
        `questions_${selectedCategory}`,
        `selectedQuestions_${selectedCategory}`,
        `test_questions_${selectedCategory}`,
        `questions_${selectedType}_${selectedCategory}`
      ]
      
      for (const key of altKeys) {
        storedData = sessionStorage.getItem(key)
        if (storedData) {
          break
        }
      }
    }
    
    if (storedData) {
      try {
        const sessionData = JSON.parse(storedData)
        const totalQuestions = sessionData.questions ? sessionData.questions.length : 
                             sessionData.length ? sessionData.length : 3
        const isLast = questionInfo.questionIndex >= totalQuestions
        
        return isLast
      } catch (error) {
        // 파싱 에러 시 기본적으로 3문제로 가정
        return questionInfo.questionIndex >= 3
      }
    }
    
    // 세션 데이터가 없으면 기본 3문제로 가정
    const isLast = questionInfo.questionIndex >= 3
    return isLast
  })()

  // TODO: API 연동 시 수정 필요
  // 향후 API에서 다음과 같은 데이터를 받아올 예정:
  // - 사용자 답변 텍스트 (현재: STT 변환 텍스트)
  // - AI 분석 결과 (문법, 발음, 유창성 등)
  // - 맞춤형 피드백 및 개선 제안
  // - 점수 및 등급 정보

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-6xl mx-auto">
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
            <span className="mx-2">›</span>
            <span>답변 피드백</span>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">답변 피드백</h2>
            <p className="text-gray-600 font-medium">영어 말하기 실력 향상을 위한 AI 분석 결과입니다.</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column - 내 답변들 */}
            <div>
              {allAnswers.length > 0 ? (
                <div>
                  <div className="bg-black text-white p-4 rounded-t-xl">
                    <h3 className="text-lg font-bold">내 답변 - {allAnswers[0]?.theme || questionInfo.theme}</h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-6 space-y-6">
                    {allAnswers.map((answer, index) => (
                      <div key={index}>
                        <h4 className="font-semibold text-gray-700 mb-2">{index + 1}/3</h4>
                        <div className="text-gray-600 text-sm leading-relaxed">
                          {answer.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-black text-white p-4 rounded-t-xl">
                    <h3 className="text-lg font-bold">내 답변 - {questionInfo.theme}</h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-6">
                    <div className="text-gray-800 leading-relaxed">
                      {userAnswer}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - 전문가 피드백 */}
            <div className="relative">
              <div className="bg-black text-white p-4 rounded-t-xl">
                <h3 className="text-lg font-bold">전문가 피드백</h3>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-6 blur-sm">
                {/* 종합 평가 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-2">종합 평가</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feedbackData.overallComment}
                  </p>
                </div>

                {/* 문법 피드백 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">문법 피드백</h4>
                  <ul className="space-y-2">
                    {feedbackData.grammarFeedback.map((feedback, index) => (
                      <li key={index} className="text-gray-600 text-sm leading-relaxed flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <span>{feedback}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 발음 피드백 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">발음 피드백</h4>
                  <ul className="space-y-2">
                    {feedbackData.pronunciationFeedback.map((feedback, index) => (
                      <li key={index} className="text-gray-600 text-sm leading-relaxed flex items-start">
                        <span className="text-blue-500 mr-2 mt-1">•</span>
                        <span>{feedback}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* 추후 예정 오버레이 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-xl">
                <div className="bg-white px-6 py-3 rounded-lg shadow-lg border-2 border-gray-300">
                  <span className="text-xl font-bold text-gray-700">(추후 예정)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 max-w-lg mx-auto">
            <button 
              onClick={handleSave}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center leading-tight"
            >
              <span className="block sm:inline">저장 및<br className="sm:hidden" /> 응시 리스트 보기</span>
            </button>
            <button 
              onClick={handleNextQuestion}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center leading-tight"
            >
              <span className="block sm:inline">{isLastQuestion ? '다른 문제 풀기' : '다음 문제 풀기'}</span>
            </button>
          </div>
          {saveResult && (
            <div className="text-center mt-4 font-semibold" style={{ color: saveResult.startsWith('✅') ? 'green' : 'red' }}>{saveResult}</div>
          )}
        </div>
      </div>
    </div>
  );
} 