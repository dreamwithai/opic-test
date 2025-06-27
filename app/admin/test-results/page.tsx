'use client'

import { useState, useEffect } from 'react'
import { Download, Search, Filter, Calendar, User, FileText, Play, Pause, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import { supabase } from '@/lib/supabase'

interface TestSession {
  id: string
  member_id: string
  type: string
  theme: string
  level: string
  first_answer: string
  first_feedback: string
  started_at: string
  member?: {
    email: string
    name: string
    nickname?: string
    provider?: string
  }
  answers?: TestAnswer[]
}

interface TestAnswer {
  id: string
  session_id: string
  q_id: number
  q_seq: number
  answer_text: string
  answer_url: string | null
  feedback: string | null
  created_at: string
}

// fetchWithTimeout 유틸 함수 추가
function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 10000) {
  return Promise.race([
    fetch(resource, options),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
  ]);
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환하는 함수
function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 날짜 표기 부분에서
// {new Date(session.started_at).toLocaleString()}
// ->
// {formatDateTime(session.started_at)}
function formatDateTime(dateString: string) {
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

export default function TestResultsPage() {
  const [sessions, setSessions] = useState<TestSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState(getTodayString())
  const [typeFilter, setTypeFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('test_session')
        .select(`
          *,
          member:members(email, name, nickname, provider),
          answers:test_answers(*)
        `)
        .order('started_at', { ascending: false })

      // 필터 적용
      if (searchTerm) {
        query = query.or(`member.email.ilike.%${searchTerm}%,member.name.ilike.%${searchTerm}%,theme.ilike.%${searchTerm}%`)
      }
      if (dateFilter) {
        const startDate = new Date(dateFilter)
        const endDate = new Date(dateFilter)
        endDate.setDate(endDate.getDate() + 1)
        query = query.gte('started_at', startDate.toISOString()).lt('started_at', endDate.toISOString())
      }
      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }
      if (levelFilter) {
        query = query.eq('level', levelFilter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching sessions:', error)
        setError('데이터를 불러오는 중 오류가 발생했습니다.')
        return
      }

      setSessions(data || [])
    } catch (err) {
      console.error('Error:', err)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const playAudio = async (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    // signedUrl 받아오기
    const response = await fetchWithTimeout('/api/get-signed-audio-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: audioUrl }),
    }, 10000)
    if (!(response instanceof Response) || !response.ok) {
      alert('재생용 URL을 가져오지 못했습니다.');
      return;
    }
    const { signedUrl } = await response.json();
    const audio = new Audio(signedUrl);
    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentAudio(null)
    })
    audio.play()
    setCurrentAudio(audio)
    setIsPlaying(true)
  }

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setCurrentAudio(null)
      setIsPlaying(false)
    }
  }

  const downloadSessionAudio = async (session: TestSession) => {
    if (!session.answers || session.answers.length === 0) {
      alert('다운로드할 음성파일이 없습니다.')
      return
    }

    try {
      // JSZip 동적 import
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      let hasAudio = false

      for (let i = 0; i < session.answers.length; i++) {
        const answer = session.answers[i]
        if (!answer.answer_url) continue

        // signedUrl 요청
        const response = await fetchWithTimeout('/api/get-signed-audio-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: answer.answer_url }),
        }, 10000)

        if (!(response instanceof Response) || !response.ok) continue

        const { signedUrl } = await response.json()
        const audioRes = await fetchWithTimeout(signedUrl, {}, 10000)
        if (!(audioRes instanceof Response) || !audioRes.ok) continue

        const blob = await audioRes.blob()
        zip.file(`answer_${i + 1}.webm`, blob)
        hasAudio = true
      }

      if (!hasAudio) {
        alert('다운로드할 음성파일이 없습니다.')
        return
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(zipBlob)
      a.download = `session_${session.id}_audio.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const downloadSessionText = (session: TestSession) => {
    if (!session.answers || session.answers.length === 0) {
      alert('다운로드할 답변이 없습니다.')
      return
    }

    const text = session.answers
      .sort((a, b) => a.q_seq - b.q_seq)
      .map((a, i) => `문제 ${i + 1}\n${a.answer_text}\n`)
      .join('\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `session_${session.id}_text.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const downloadAllSessions = async () => {
    if (sessions.length === 0) {
      alert('다운로드할 데이터가 없습니다.')
      return
    }

    setDownloading(true)
    setDownloadProgress({ current: 0, total: 0 })
    let missingFiles = 0
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      // 전체 파일 개수 계산
      let totalFiles = 0
      sessions.forEach(session => {
        if (session.answers && session.answers.length > 0) {
          totalFiles += session.answers.length
        }
      })
      setDownloadProgress({ current: 0, total: totalFiles })
      let processed = 0

      for (const session of sessions) {
        if (!session.answers || session.answers.length === 0) continue

        const sessionFolder = zip.folder(`session_${session.id}`)
        if (!sessionFolder) continue

        // 텍스트 파일 추가
        const text = session.answers
          .sort((a, b) => a.q_seq - b.q_seq)
          .map((a, i) => `문제 ${i + 1}\n${a.answer_text}\n`)
          .join('\n')
        
        sessionFolder.file('answers.txt', text)

        // 음성 파일 추가
        for (let i = 0; i < session.answers.length; i++) {
          const answer = session.answers[i]
          if (!answer.answer_url) {
            processed++
            setDownloadProgress({ current: processed, total: totalFiles })
            continue
          }

          try {
            const response = await fetchWithTimeout('/api/get-signed-audio-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: answer.answer_url }),
            }, 10000)

            if (!(response instanceof Response) || !response.ok) {
              missingFiles++
              processed++
              setDownloadProgress({ current: processed, total: totalFiles })
              continue
            }

            const { signedUrl } = await response.json()
            const audioRes = await fetchWithTimeout(signedUrl, {}, 10000)
            if (!(audioRes instanceof Response) || !audioRes.ok) {
              missingFiles++
              processed++
              setDownloadProgress({ current: processed, total: totalFiles })
              continue
            }

            const blob = await audioRes.blob()
            sessionFolder.file(`answer_${i + 1}.webm`, blob)
          } catch (error) {
            missingFiles++
          } finally {
            processed++
            setDownloadProgress({ current: processed, total: totalFiles })
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(zipBlob)
      a.download = `all_sessions_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      if (missingFiles > 0) {
        alert(`일부 음성 파일(${missingFiles}개)을 찾을 수 없어 제외되었습니다.`)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
      setDownloadProgress({ current: 0, total: 0 })
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        session.member?.email?.toLowerCase().includes(searchLower) ||
        session.member?.name?.toLowerCase().includes(searchLower) ||
        session.theme.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 네비게이션 */}
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로가기
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                어드민 홈
              </Link>
            </div>
          </div>

          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">시험 응시 데이터 관리</h1>
            <p className="text-gray-600">모든 고객의 시험 응시 데이터를 조회하고 다운로드할 수 있습니다.</p>
          </div>

          {/* 검색(서버) 영역 */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">모든 유형</option>
                <option value="선택주제">선택주제</option>
                <option value="롤플레이">롤플레이</option>
                <option value="모의고사">모의고사</option>
              </select>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">모든 레벨</option>
                <option value="IM2">IM2</option>
                <option value="IH">IH</option>
                <option value="AL">AL</option>
              </select>
              <button
                onClick={fetchSessions}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                검색
              </button>
            </div>
          </div>

          {/* 필터(클라이언트) 영역 */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="이메일, 이름, 테마로 필터링..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* 결과 통계 */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{filteredSessions.length}</div>
                <div className="text-sm text-gray-600">총 응시 수</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredSessions.reduce((sum, session) => sum + (session.answers?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">총 답변 수</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredSessions.filter(s => s.answers?.some(a => a.answer_url)).length}
                </div>
                <div className="text-sm text-gray-600">음성 파일 포함</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {filteredSessions.length > 0 ? 
                    formatDateTime(filteredSessions[0].started_at) : '-'
                  }
                </div>
                <div className="text-sm text-gray-600">최근 응시일</div>
              </div>
            </div>
          </div>

          {/* 전체 다운로드 버튼 */}
          <div className="flex justify-end mb-6">
            <button
              onClick={downloadAllSessions}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              disabled={downloading}
            >
              <Download className="w-4 h-4" />
              {downloading ? `다운로드 중... (${downloadProgress.current}/${downloadProgress.total})` : '전체 다운로드'}
            </button>
          </div>

          {/* 세션 목록 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-lg shadow-sm border">
                  {/* 세션 헤더 */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {session.type} - {session.theme}
                          </h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {session.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {session.member?.name || session.member?.email || session.member?.nickname || session.member?.provider || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDateTime(session.started_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {session.answers?.length || 0}개 답변
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadSessionAudio(session)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                        >
                          <Download className="w-3 h-3" />
                          음성
                        </button>
                        <button
                          onClick={() => downloadSessionText(session)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                        >
                          <Download className="w-3 h-3" />
                          텍스트
                        </button>
                        <button
                          onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                        >
                          {expandedSession === session.id ? '접기' : '상세'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 답변 상세 */}
                  {expandedSession === session.id && session.answers && (
                    <div className="p-6">
                      <div className="space-y-4">
                        {session.answers
                          .sort((a, b) => a.q_seq - b.q_seq)
                          .map((answer, index) => (
                            <div key={answer.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">문제 {index + 1}</h4>
                                <div className="flex items-center gap-2">
                                  {answer.answer_url && (
                                    <>
                                      {isPlaying ? (
                                        <button
                                          onClick={stopAudio}
                                          className="flex items-center justify-center w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                          <Pause className="w-3 h-3" />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={async () => await playAudio(answer.answer_url!)}
                                          className="flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded-full hover:bg-green-600"
                                        >
                                          <Play className="w-3 h-3" />
                                        </button>
                                      )}
                                      <button
                                        onClick={async () => {
                                          const response = await fetchWithTimeout('/api/get-signed-audio-url', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ filePath: answer.answer_url }),
                                          }, 10000)
                                          if (!(response instanceof Response) || !response.ok) {
                                            alert('다운로드 URL을 가져오지 못했습니다.')
                                            return
                                          }
                                          const { signedUrl } = await response.json()
                                          const a = document.createElement('a')
                                          a.href = signedUrl
                                          a.download = `answer_${index + 1}.webm`
                                          document.body.appendChild(a)
                                          a.click()
                                          document.body.removeChild(a)
                                        }}
                                        className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {answer.answer_text}
                              </div>
                              {answer.feedback && (
                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                  <strong>피드백:</strong> {answer.feedback}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
} 