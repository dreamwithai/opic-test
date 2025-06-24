'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import FullScreenLoader from './components/FullScreenLoader'

export default function Home() {
  const { data: session, status } = useSession()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [surveyDone, setSurveyDone] = useState<boolean | null>(null)
  const surveyRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    experience: '',
    level: '',
    purpose: [] as string[],
    schedule: '',
    agreement: ''
  })
  const [modalMessage, setModalMessage] = useState('');
  const router = useRouter()
  const [sttConfig, setSttConfig] = useState<{ mobile_stt_mode: string } | null>(null);

  // Fetch STT config on component mount
  useEffect(() => {
    async function fetchSttConfig() {
      try {
        const response = await fetch('/api/stt-config');
        if (response.ok) {
          const data = await response.json();
          setSttConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch STT config:", error);
        // On failure, default to user selection to avoid blocking users
        setSttConfig({ mobile_stt_mode: 'USER_SELECT' });
      }
    }
    fetchSttConfig();
  }, []);

  // 설문 완료 여부 체크 (세션 기반으로 변경)
  useEffect(() => {
    const checkSurvey = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        const { data } = await supabase
          .from('member_survey')
          .select('id')
          .eq('member_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        setSurveyDone(!!data)
      } else {
        // 미로그인 시에는 설문 완료 여부를 null로 설정 (설문 영역을 보여줌)
        setSurveyDone(null)
      }
    }
    checkSurvey()
  }, [status, session])

  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckboxChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      purpose: prev.purpose.includes(value) 
        ? prev.purpose.filter(item => item !== value)
        : [...prev.purpose, value]
    }))
  }

  const validateForm = () => {
    const { experience, level, purpose, schedule, agreement } = formData
    
    if (!experience || !level || purpose.length === 0 || !schedule || agreement !== '동의함') {
      setShowModal(true)
      return false
    }
    return true
  }

  // 목표레벨 선택 버튼을 감싸는 컴포넌트
  const LevelLink = ({ level, children }: { level: string, children: React.ReactNode }) => {
    const handleClick = async (e: React.MouseEvent) => {
      e.preventDefault();

      const proceedToNextStep = (targetLevel: string) => {
        // Now, it ALWAYS goes to the question-type page first.
        router.push(`/question-type?level=${encodeURIComponent(targetLevel)}`);
      };

      // 로그인한 사용자가 설문을 완료했다면
      if (status === 'authenticated' && surveyDone === true) {
        proceedToNextStep(level);
        return;
      }

      // 미로그인 사용자는 로그인 요구
      if (status !== 'authenticated') {
        setModalMessage('로그인 후 테스트 진행이 가능합니다.');
        setShowModal(true);
        return;
      }

      // 로그인한 사용자이지만 설문을 완료하지 않은 경우
      const { experience, level: lv, purpose, schedule } = formData;
      if (!experience || !lv || purpose.length === 0 || !schedule) {
        setModalMessage('기초설문 이후 테스트 진행가능합니다.');
        setShowModal(true);
        return;
      }
      if (formData.agreement !== '동의함') {
        setModalMessage('이용 동의 후 테스트 진행가능합니다.');
        setShowModal(true);
        return;
      }
      
      // 로그인한 사용자의 설문 저장 및 테스트 페이지 이동
      const { error } = await supabase.from('member_survey').insert([
        {
          member_id: session.user.id,
          opic_experience: formData.experience,
          current_level: formData.level,
          opic_purpose: formData.purpose,
          opic_plan: formData.schedule,
          agree_terms: formData.agreement === '동의함',
        }
      ]);

      if (!error) {
        setSurveyDone(true);
        proceedToNextStep(level);
      } else {
        alert('설문 저장에 실패했습니다. 다시 시도해 주세요.');
      }
    };

    return <div onClick={handleClick} className="cursor-pointer">{children}</div>;
  };

  const closeModalAndScroll = () => {
    setShowModal(false)
    setIsFormOpen(true) // 설문 영역 펼치기
    
    // 설문 영역으로 스크롤 (약간 위쪽으로)
    setTimeout(() => {
      if (surveyRef.current) {
        const elementPosition = surveyRef.current.offsetTop
        const offsetPosition = elementPosition - 10 // 10px 위쪽으로 조정
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  if (status === 'loading' || sttConfig === null) {
    return <FullScreenLoader />
  }

  const isLoggedIn = status === 'authenticated'

  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: "'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif" }}>
      {/* Hero Section */}
      <section
        className="w-screen relative overflow-hidden flex items-center justify-center p-0 m-0 md:h-[364px]"
        style={{ aspectRatio: '1079/861' }}
      >
        {/* PC용 와이드 이미지 */}
        <img
          src="/info_pc.png"
          alt="4시간 오픽 가이드"
          className="hidden md:block absolute inset-0 w-full h-full object-cover object-center select-none"
          draggable={false}
        />
        {/* 모바일용 와이드 이미지 */}
        <img
          src="/info_mb.png"
          alt="4시간 오픽 가이드"
          className="block md:hidden absolute inset-0 w-full h-full object-cover object-bottom bg-black select-none"
          draggable={false}
        />
      </section>

      {/* 해당 모의고사는 Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-left">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">해당 모의고사는,</h3>
          
          <div className="space-y-2 text-lg text-gray-700">
            <p>강지완쌤 국룰서베이 기반 테스트입니다.</p>
            <p className="text-base text-gray-600">
              (서베이 항목 : 집, 공연, 콘서트, 카페, 술집, 음악듣기, 조깅, 걷기, 하이킹, 운동안함, 국내여행, 해외여행)
            </p>
            <p>문제풀이와 내 답변저장 및 답변 다시듣기 서비스는 무료로 제공됩니다.</p>
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">이용방법</h3>
          
          <div className="space-y-2 text-left">
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">1.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">4시간오픽 사이트 가입 후 기초 설문</span>
                <span className="text-gray-600 ml-2">*서비스 이용 필수사항</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">2.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">목표레벨 선택</span>
                <span className="text-gray-600 ml-2">IM2, IH, AL 중 택1, *테스트마다 변경가능</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">3.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">문제유형 선택</span>
                <span className="text-gray-600 ml-2">선택주제, 롤플레이, 돌발주제, 모의고사 1회 중 택1</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">4.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">문제풀이</span>
                <span className="text-gray-600 ml-2">선택주제, 롤플레이, 돌발주제는 콤보 출제로 콤보문제 연속풀이 가능</span>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <span className="text-xl font-bold text-gray-800 flex-shrink-0">5.</span>
              <div>
                <span className="text-xl font-bold text-gray-800">답변저장</span>
                <span className="text-gray-600 ml-2">통한 테스트 내역 확인가능</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Survey Section */}
      {surveyDone === true ? (
        // 설문을 완료한 로그인 사용자에게는 설문 영역을 완전히 숨김
        null
      ) : (
        // 설문을 완료하지 않은 사용자(로그인/미로그인 모두)에게는 설문 영역 표시
        <section className="container mx-auto px-4 py-8" ref={surveyRef}>
          <div className="max-w-4xl mx-auto">
            <div className="border border-gray-300 rounded-lg">
              <button 
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">기초설문/이용동의</h3>
                  <p className="text-sm text-gray-600">*서비스 이용 필수설문으로 눌러서 선택하세요</p>
                </div>
                <div className={`transform transition-transform ${isFormOpen ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {isFormOpen && (
                <div className="border-t border-gray-300 p-6 space-y-6">
                  {/* 오픽 응시경험 */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">(필수)오픽 응시경험이 있으신가요?</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="experience" 
                          value="미응시"
                          checked={formData.experience === '미응시'}
                          onChange={(e) => handleRadioChange('experience', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">미응시</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="experience" 
                          value="1회"
                          checked={formData.experience === '1회'}
                          onChange={(e) => handleRadioChange('experience', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">1회</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="experience" 
                          value="2회"
                          checked={formData.experience === '2회'}
                          onChange={(e) => handleRadioChange('experience', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">2회</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="experience" 
                          value="3회이상"
                          checked={formData.experience === '3회이상'}
                          onChange={(e) => handleRadioChange('experience', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">3회이상</span>
                      </label>
                    </div>
                  </div>

                  {/* 현재 등급 */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">(필수)현재 등급을 알려주세요.</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="level" 
                          value="없음(미응시)"
                          checked={formData.level === '없음(미응시)'}
                          onChange={(e) => handleRadioChange('level', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">없음(미응시)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="level" 
                          value="NH이하"
                          checked={formData.level === 'NH이하'}
                          onChange={(e) => handleRadioChange('level', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">NH이하</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="level" 
                          value="IM1"
                          checked={formData.level === 'IM1'}
                          onChange={(e) => handleRadioChange('level', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">IM1</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="level" 
                          value="IM2"
                          checked={formData.level === 'IM2'}
                          onChange={(e) => handleRadioChange('level', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">IM2</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="level" 
                          value="IM3"
                          checked={formData.level === 'IM3'}
                          onChange={(e) => handleRadioChange('level', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">IM3</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="level" 
                          value="IH"
                          checked={formData.level === 'IH'}
                          onChange={(e) => handleRadioChange('level', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">IH</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="level" 
                          value="AL"
                          checked={formData.level === 'AL'}
                          onChange={(e) => handleRadioChange('level', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">AL</span>
                      </label>
                    </div>
                  </div>

                  {/* 오픽응시 목적 */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">(필수)오픽응시 목적은? (복수 선택 가능)</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={formData.purpose.includes('취업준비')}
                          onChange={() => handleCheckboxChange('취업준비')}
                          className="form-checkbox" 
                        />
                        <span className="text-sm">취업준비</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={formData.purpose.includes('이직준비')}
                          onChange={() => handleCheckboxChange('이직준비')}
                          className="form-checkbox" 
                        />
                        <span className="text-sm">이직준비</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={formData.purpose.includes('승진 및 직장 여가기준 충족')}
                          onChange={() => handleCheckboxChange('승진 및 직장 여가기준 충족')}
                          className="form-checkbox" 
                        />
                        <span className="text-sm">승진 및 직장 여가기준 충족</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          checked={formData.purpose.includes('자기계발 및 성장')}
                          onChange={() => handleCheckboxChange('자기계발 및 성장')}
                          className="form-checkbox" 
                        />
                        <span className="text-sm">자기계발 및 성장</span>
                      </label>
                    </div>
                  </div>

                  {/* 예정일 */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">(필수)오픽 응시 예정일은 언제인가요?</h4>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="schedule" 
                          value="1주일이내"
                          checked={formData.schedule === '1주일이내'}
                          onChange={(e) => handleRadioChange('schedule', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">1주일이내</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="schedule" 
                          value="1개월이내"
                          checked={formData.schedule === '1개월이내'}
                          onChange={(e) => handleRadioChange('schedule', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">1개월이내</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="schedule" 
                          value="3개월이내"
                          checked={formData.schedule === '3개월이내'}
                          onChange={(e) => handleRadioChange('schedule', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">3개월이내</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="schedule" 
                          value="6개월이내"
                          checked={formData.schedule === '6개월이내'}
                          onChange={(e) => handleRadioChange('schedule', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">6개월이내</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="schedule" 
                          value="날짜 미정"
                          checked={formData.schedule === '날짜 미정'}
                          onChange={(e) => handleRadioChange('schedule', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">날짜 미정</span>
                      </label>
                    </div>
                  </div>

                  {/* 이용 동의 안내 */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-800 mb-3">(필수)이용 동의 안내</h4>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4">
                      <p className="mb-2">4시간오픽 모의고사 서비스를 원활히 제공하고, 응답자의 데이터를 안전하게 활용하기 위해 아래 내용을 안내드립니다.</p>
                      <p className="mb-2">사용자의 답변(음성/텍스트) 및 설문 결과는 서비스 품질 개선 및 통계 분석 목적으로 활용될 수 있습니다.</p>
                      <p className="mb-2">서비스 이용을 위해 위 내용을 이해하고 동의해주셔야 모의고사를 이용하실 수 있습니다.</p>
                      <p>이에 동의하십니까?</p>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="agreement" 
                          value="동의함"
                          checked={formData.agreement === '동의함'}
                          onChange={(e) => handleRadioChange('agreement', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">동의함 (필수)</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          name="agreement" 
                          value="동의하지 않음"
                          checked={formData.agreement === '동의하지 않음'}
                          onChange={(e) => handleRadioChange('agreement', e.target.value)}
                          className="form-radio" 
                        />
                        <span className="text-sm">동의하지 않음 (서비스 이용불가)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Level Selection Section */}
      <section className="bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-6">목표레벨선택</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LevelLink level="IM2">
                <div 
                  className="rounded-xl p-6 cursor-pointer transition-colors h-full"
                  style={{ backgroundColor: '#063ff9' }}
                >
                  <div className="mb-4">
                    <h4 className="text-4xl font-bold mb-2 text-white">IM2 <span className="text-lg font-medium">선택</span></h4>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    "쉽게 간단한 문장과 원하는 정도를 할 수 있다"
                  </p>
                </div>
              </LevelLink>

              <LevelLink level="IH">
                <div 
                  className="rounded-xl p-6 cursor-pointer transition-colors h-full"
                  style={{ backgroundColor: '#063ff9' }}
                >
                  <div className="mb-4">
                    <h4 className="text-4xl font-bold mb-2 text-white">IH <span className="text-lg font-medium">선택</span></h4>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    "문단으로 말하고,<br />
                    시제/돌발/일기정보이 가능해야 한다"
                  </p>
                </div>
              </LevelLink>

              <LevelLink level="AL">
                <div 
                  className="rounded-xl p-6 cursor-pointer transition-colors h-full"
                  style={{ backgroundColor: '#063ff9' }}
                >
                  <div className="mb-4">
                    <h4 className="text-4xl font-bold mb-2 text-white">AL <span className="text-lg font-medium">선택</span></h4>
                  </div>
                  <p className="text-white/90 text-sm leading-relaxed">
                    "실수가 극히 적고, 표현이 다양해야 한다."
                  </p>
                </div>
              </LevelLink>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">설문 작성 필요</h3>
              <p className="text-gray-600 mb-6">{modalMessage}</p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={closeModalAndScroll}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 font-medium">
            © 2025 OPIc 모의테스트. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 