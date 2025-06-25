'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'
import { Play, Pause } from 'lucide-react'
import JSZip from 'jszip'

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
  const [saveProgress, setSaveProgress] = useState('');
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveResult('');
    setSaveProgress('데이터 준비 중...');
    
    try {
      const storedAnswers = JSON.parse(localStorage.getItem('testAnswers') || '[]');
      if (!storedAnswers.length) {
        throw new Error('저장할 답변이 없습니다.');
      }

      setSaveProgress('세션 정보 생성 중...');
      
      // 세션 데이터 준비
      const sessionData = {
        type: selectedType,
        theme: currentTheme,
        level: selectedLevel,
        first_answer: storedAnswers[0]?.answer || '',
        first_feedback: '피드백 준비 중...'
      };

      setSaveProgress('답변 데이터 정리 중...');
      
      // 답변 데이터 준비
      const answersData = storedAnswers.map((answer: any) => ({
        q_id: answer.qid || 0,
        q_seq: answer.qseq || 0,
        answer_text: answer.answer || '',
        answer_url: answer.uploadedPath || null,
        feedback: '피드백 준비 중...'
      }));

      setSaveProgress('녹음 파일 정보 정리 중...');

      // 녹음 파일 정보 준비
      const recordingFiles = storedAnswers
        .filter((answer: any) => answer.uploadedPath)
        .map((answer: any) => ({
          path: answer.uploadedPath // 'USER_ID/FILENAME.webm' 형태
        }));

      setSaveProgress('서버에 데이터 전송 중...');

      // save-session API 호출
      const response = await fetch('/api/save-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData,
          answersData,
          recordingFiles
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '저장 실패');
      }

      const result = await response.json();
      
      if (result.success) {
        setSaveProgress('저장 완료!');
        setSaveResult(`✅ 시험 세트 및 ${result.savedAnswers}개 답변이 모두 저장되었습니다.`);
        localStorage.removeItem('testAnswers');
        
        // 마이페이지로 이동하기 전에 잠시 딜레이를 주어 메시지를 확인하게 함
        setTimeout(() => {
          router.push('/mypage');
        }, 1500);
      } else {
        throw new Error(result.error || '저장 실패');
      }

    } catch (e) {
      console.error('Save error:', e);
      setSaveResult('❌ 저장 중 오류 발생: ' + (e instanceof Error ? e.message : '알 수 없는 오류'));
    } finally {
      // isSaving 상태는 성공/실패 여부와 관계없이 1.5초 후에 풀어줌
      setTimeout(() => {
        setIsSaving(false);
        setSaveProgress('');
      }, 1500);
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

  const playAudio = async (uploadedPath: string | null) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    if (!uploadedPath) {
      alert('재생할 오디오 파일이 없습니다.');
      return;
    }
    try {
      // signedUrl 요청
      const response = await fetch('/api/get-signed-audio-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: `temp/${uploadedPath}` }),
      });
      if (!response.ok) {
        alert('오디오 URL을 가져오지 못했습니다.');
        return;
      }
      const { signedUrl } = await response.json();
      if (!signedUrl) {
        alert('오디오 URL이 비어 있습니다.');
        return;
      }
      let audio = new Audio(signedUrl);
      audio.addEventListener('error', () => {
        alert('오디오 파일을 재생할 수 없습니다.');
        setIsPlaying(false);
        setCurrentAudio(null);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      });
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      await audio.play();
      setCurrentAudio(audio);
    } catch (error) {
      alert('오디오 재생 중 오류가 발생했습니다.');
      setIsPlaying(false);
    }
  };
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  // 다운로드 핸들러 함수 분리
  const handleDownload = async (uploadedPath: string | null, index: number) => {
    if (!uploadedPath) return;
    const response = await fetch('/api/get-signed-audio-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: `temp/${uploadedPath}` }),
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
  };

  // 전체 오디오(zip) 다운로드 핸들러
  const handleDownloadAllAudio = async () => {
    if (!allAnswers.length) return alert('다운로드할 답변이 없습니다.');
    const zip = new JSZip();
    let hasAudio = false;
    for (let i = 0; i < allAnswers.length; i++) {
      const answer = allAnswers[i];
      if (!answer.uploadedPath) continue;
      // signedUrl 요청
      const response = await fetch('/api/get-signed-audio-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: `temp/${answer.uploadedPath}` }),
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
  };

  // 전체 텍스트(txt) 다운로드 핸들러
  const handleDownloadAllText = () => {
    if (!allAnswers.length) return alert('다운로드할 답변이 없습니다.');
    const text = allAnswers.map((a, i) => `문제 ${i + 1}\n${a.answer}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'answers.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
                <div className="relative">
                  <div className="absolute top-4 right-4 flex gap-2 z-10">
                    {/* 전체 오디오 다운로드 */}
                    <button
                      className="flex items-center justify-center min-w-[32px] min-h-[32px] rounded-full bg-gray-100 hover:bg-blue-600 hover:text-white text-blue-600 transition-colors shadow"
                      aria-label="전체 음성파일 다운로드"
                      onClick={handleDownloadAllAudio}
                    >
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
                      onClick={handleDownloadAllText}
                    >
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="4" y="7" width="14" height="10" rx="2" fill="#ede9fe" stroke="#7c3aed" strokeWidth="1.5"/>
                        <rect x="7" y="4" width="14" height="10" rx="2" fill="#fff" stroke="#7c3aed" strokeWidth="1.5"/>
                        <path d="M10 9h8M10 12h8M10 15h4" stroke="#7c3aed" strokeWidth="1.2"/>
                      </svg>
                    </button>
                  </div>
                  <div className="bg-black text-white p-4 rounded-t-xl">
                    <h3 className="text-lg font-bold">내 답변 - {allAnswers[0]?.theme || questionInfo.theme}</h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-6 space-y-6">
                    {allAnswers.map((answer, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">{index + 1}/3</h4>
                          <div className="flex items-center gap-2">
                            {answer.uploadedPath && (
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
                                    onClick={() => playAudio(answer.uploadedPath)}
                                    className="flex items-center justify-center min-h-[28px] min-w-[28px] px-0 py-0 bg-green-500 text-white rounded-full text-base hover:bg-green-600 transition-colors"
                                    aria-label="재생"
                                  >
                                    <Play size={18} />
                                  </button>
                                )}
                                {/* 다운로드 버튼 */}
                                <button
                                  onClick={() => handleDownload(answer.uploadedPath, index)}
                                  className="flex items-center justify-center min-h-[28px] min-w-[28px] px-0 py-0 bg-blue-500 text-white rounded-full text-base hover:bg-blue-600 transition-colors"
                                  aria-label="다운로드"
                                >
                                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4m-8 8h8" /></svg>
                                </button>
                              </>
                            )}
                            {/* 텍스트 복사 버튼 */}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(answer.answer)
                                  .then(() => alert('답변이 복사되었습니다!'))
                                  .catch(() => alert('복사에 실패했습니다.'))
                              }}
                              className="flex items-center justify-center min-h-[28px] min-w-[28px] px-0 py-0 bg-purple-600 text-white rounded-full text-base hover:bg-purple-700 transition-colors"
                              aria-label="복사"
                            >
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
                        <div className="text-gray-600 text-sm leading-relaxed max-h-[11.5em] overflow-y-auto break-words" style={{ display: 'block', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
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
                    <div className="text-gray-800 leading-relaxed max-h-[11.5em] overflow-y-auto break-words" style={{ display: 'block', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
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
                  <p className="text-gray-600 text-sm leading-relaxed max-h-[11.5em] overflow-y-auto break-words" style={{ display: 'block', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
                    {feedbackData.overallComment}
                  </p>
                </div>

                {/* 문법 피드백 */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">문법 피드백</h4>
                  <ul className="space-y-2">
                    {feedbackData.grammarFeedback.map((feedback, index) => (
                      <li key={index} className="text-gray-600 text-sm leading-relaxed flex items-start max-h-[11.5em] overflow-y-auto break-words" style={{ display: 'block', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
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
                      <li key={index} className="text-gray-600 text-sm leading-relaxed flex items-start max-h-[11.5em] overflow-y-auto break-words" style={{ display: 'block', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'auto' }}>
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

          {/* 하단 버튼 영역 */}
          <div className="sticky bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-md flex items-center gap-4">
            <button
              onClick={handleSave}
              className={`w-1/2 flex items-center justify-center text-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-colors duration-300 ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={isSaving}
            >
              {isSaving && <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>}
              <span className="leading-tight">
                {isSaving ? saveProgress : '저장 및 응시\n리스트 보기'}
              </span>
            </button>
            <button
              onClick={handleNextQuestion}
              className="w-1/2 flex items-center justify-center text-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors duration-300"
            >
              <span className="leading-tight text-center w-full">다른 문제 풀기</span>
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