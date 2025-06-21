'use client'

import LoadingSpinner from './LoadingSpinner'

export default function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="md" className="mx-auto" />
      </div>
    </div>
  )
} 