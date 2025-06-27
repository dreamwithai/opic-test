'use client'

import { useAdminAuth } from '@/lib/useAdminAuth'
import FullScreenLoader from '@/app/components/FullScreenLoader'
import { useStaticMenuPermissions } from '@/lib/useStaticMenuPermissions'
import { useSession } from 'next-auth/react'

interface AdminGuardProps {
  children: React.ReactNode
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, isLoading } = useAdminAuth()
  const { data: session, status } = useSession()
  const { hasAccess, loading } = useStaticMenuPermissions()

  if (isLoading) {
    return <FullScreenLoader />
  }

  if (!isAdmin) {
    return null // 이미 useAdminAuth에서 리다이렉트 처리됨
  }

  return <>{children}</>
} 