'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface MemberInfo {
  id: string
  email: string
  name: string
  provider: string
  ref_site: string | null
  ref_id: string | null
  created_at: string
  status: string | null
  withdrawn_at: string | null
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [liveKlassId, setLiveKlassId] = useState('')
  const [updateMessage, setUpdateMessage] = useState('')

  // 회원 정보 불러오기
  useEffect(() => {
    const fetchMemberInfo = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching member info:', error)
        } else {
          setMemberInfo(data)
          setLiveKlassId(data.ref_id || '')
        }
        setIsLoading(false)
      } else if (status === 'unauthenticated') {
        setIsLoading(false)
      }
    }

    fetchMemberInfo()
  }, [status, session])

  // LiveKlass ID 업데이트
  const handleUpdateLiveKlassId = async () => {
    if (!session?.user?.id) return

    setIsUpdating(true)
    setUpdateMessage('')

    const { data: updatedData, error } = await supabase
      .from('members')
      .update({
        ref_site: 'liveKlass',
        ref_id: liveKlassId.trim()
      })
      .eq('id', session.user.id)
      .select() // RLS 정책 실패를 감지하기 위해 select()를 추가하여 결과를 반환받음

    if (error) {
      setUpdateMessage(`❌ 업데이트 실패: ${error.message}`)
    } else if (!updatedData || updatedData.length === 0) {
      // RLS 정책에 의해 막혔거나 해당 유저가 없는 경우 이 분기로 들어옵니다.
      setUpdateMessage('❌ 업데이트 실패: 데이터를 수정할 권한이 없습니다. Supabase RLS 정책을 확인해주세요.')
    } else {
      setUpdateMessage('✅ LiveKlass ID가 성공적으로 업데이트되었습니다!')
      // 업데이트된 정보를 state에 즉시 반영
      setMemberInfo(updatedData[0])
    }

    setIsUpdating(false)

    // 2초 후에 메시지 숨기기
    setTimeout(() => {
      setUpdateMessage('')
    }, 2000)
  }

  // 회원탈퇴
  const handleDeleteAccount = async () => {
    if (!confirm('정말로 회원탈퇴를 하시겠습니까?\n이 작업은 되돌릴 수 없으며, 회원 정보가 비활성화됩니다.')) {
      return
    }

    if (!session?.user?.id) return

    setIsUpdating(true)
    setUpdateMessage('')

    const { data: updatedData, error } = await supabase
      .from('members')
      .update({
        name: 'withdrawn',
        ref_id: 'withdrawn',
        status: 'withdrawn',
        withdrawn_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()

    if (error) {
      setUpdateMessage(`❌ 회원탈퇴 처리 실패: ${error.message}`)
      setIsUpdating(false)
    } else if (!updatedData || updatedData.length === 0) {
      setUpdateMessage('❌ 회원탈퇴 처리 실패: 데이터를 수정할 권한이 없습니다. Supabase RLS 정책을 확인해주세요.')
      setIsUpdating(false)
    } else {
      setUpdateMessage('✅ 회원탈퇴가 완료되었습니다. 잠시 후 로그아웃됩니다.')
      setTimeout(() => {
        signOut({ callbackUrl: '/' })
      }, 2000)
    }
  }

  // 로그아웃
  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center text-gray-500">
          <p>회원 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    )
  }

  if (!memberInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center text-gray-500">
          <p>회원 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">회원정보 관리</h1>
            <p className="text-gray-600 mt-2">회원 정보를 확인하고 관리할 수 있습니다.</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            홈으로 돌아가기
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border">{memberInfo.name || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border">{memberInfo.email || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가입 방법</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                  {memberInfo.provider === 'google' ? 'Google' : 
                   memberInfo.provider === 'kakao' ? 'Kakao' : 
                   memberInfo.provider === 'naver' ? 'Naver' : 
                   memberInfo.provider || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                  {new Date(memberInfo.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* LiveKlass ID 설정 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">LiveKlass ID 설정</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LiveKlass ID</label>
                <input
                  type="text"
                  value={liveKlassId}
                  onChange={(e) => setLiveKlassId(e.target.value)}
                  placeholder="LiveKlass ID를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleUpdateLiveKlassId}
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {isUpdating ? '업데이트 중...' : 'LiveKlass ID 업데이트'}
              </button>
              {updateMessage && (
                <p className={`text-sm ${updateMessage.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                  {updateMessage}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">계정 관리</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleLogout}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              로그아웃
            </button>
            {/*
            <button
              onClick={handleDeleteAccount}
              disabled={isUpdating}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              {isUpdating ? '처리 중...' : '회원탈퇴'}
            </button>
            */}
          </div>
          {/*
          <p className="text-sm text-gray-500 mt-2">
            회원탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          */}
        </div>
      </div>
    </div>
  )
} 