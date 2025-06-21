'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

export function useAdminAuth() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (status === 'loading') {
        return
      }

      if (status === 'unauthenticated') {
        setIsAdmin(false)
        setIsLoading(false)
        alert('로그인이 필요합니다.')
        router.replace('/login')
        return
      }

      if (status === 'authenticated' && session?.user?.id) {
        // 먼저 세션의 type을 확인
        if (session.user.type === 'admin') {
          setIsAdmin(true)
          setIsLoading(false)
          return
        }
        
        try {
          // Supabase에서 사용자의 type 확인
          const { data, error } = await supabase
            .from('members')
            .select('type')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Error checking admin status:', error)
            setIsAdmin(false)
            setIsLoading(false)
            alert('권한 확인 중 오류가 발생했습니다.')
            router.replace('/')
            return
          }
          
          if (data?.type === 'admin') {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
            alert('관리자만 접근 가능합니다.')
            router.replace('/')
          }
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
          setIsLoading(false)
          alert('권한 확인 중 오류가 발생했습니다.')
          router.replace('/')
          return
        }
      }

      setIsLoading(false)
    }

    checkAdminStatus()
  }, [status, session, router])

  return { isAdmin, isLoading, status }
} 