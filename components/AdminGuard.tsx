'use client'

import { useAdminAuth } from '@/lib/useAdminAuth'
import FullScreenLoader from '@/app/components/FullScreenLoader'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isLoading } = useAdminAuth()

  if (isLoading) {
    return <FullScreenLoader />
  }

  if (!isAdmin) {
    return null // 이미 useAdminAuth에서 리다이렉트 처리됨
  }

  return <>{children}</>
} 