'use client'

import LoadingSpinner from './LoadingSpinner'

interface FullScreenLoaderProps {
  message?: string
}

export default function FullScreenLoader({ message = '로딩 중...' }: FullScreenLoaderProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="md" className="mx-auto mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  )
} 