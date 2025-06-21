'use client'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  className?: string
}

export default function LoadingSpinner({
  size = 'md',
  color = 'border-blue-600',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4',
  }

  const finalColor = color.startsWith('border-') ? color : `border-${color}`

  return (
    <div
      className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} ${finalColor} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
} 