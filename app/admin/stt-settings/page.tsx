'use client'

import { useState, useEffect } from 'react'
import AdminGuard from '@/components/AdminGuard'
import FullScreenLoader from '@/app/components/FullScreenLoader'

type SttMode = 'USER_SELECT' | 'FORCE_A' | 'FORCE_B'

export default function SttSettingsPage() {
  return (
    <AdminGuard>
      <SettingsUI />
    </AdminGuard>
  )
}

function SettingsUI() {
  const [currentMode, setCurrentMode] = useState<SttMode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    // Fetch the current configuration when the component mounts
    async function fetchConfig() {
      try {
        const response = await fetch('/api/stt-config')
        if (!response.ok) throw new Error('Failed to fetch config')
        const data = await response.json()
        setCurrentMode(data.mobile_stt_mode)
      } catch (error) {
        console.error(error)
        setMessage({ type: 'error', text: '설정을 불러오는 데 실패했습니다.' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleSave = async (newMode: SttMode) => {
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/stt-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile_stt_mode: newMode }),
      })
      
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save config')
      }

      setCurrentMode(newMode)
      setMessage({ type: 'success', text: `설정이 성공적으로 "${getModeDescription(newMode)}" (으)로 저장되었습니다.` })
    } catch (error: any) {
      console.error(error)
      setMessage({ type: 'error', text: `저장 실패: ${error.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  const getModeDescription = (mode: SttMode) => {
    switch (mode) {
      case 'USER_SELECT':
        return '사용자 직접 선택'
      case 'FORCE_A':
        return '타입 A 강제'
      case 'FORCE_B':
        return '타입 B 강제'
      default:
        return ''
    }
  }

  if (isLoading) {
    return <FullScreenLoader />
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">모바일 STT 설정</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <p className="mb-6 text-gray-600">
          모바일 기기 사용자의 음성 인식(STT) 방식을 설정합니다. 이 설정은 모바일 사용자에게만 적용됩니다.
        </p>
        
        <div className="space-y-4">
          <SettingOption
            mode="USER_SELECT"
            title="사용자 직접 선택 (기본값)"
            description="모바일 사용자에게 STT 점검 페이지를 보여주고, 타입 A와 B 중 직접 테스트하고 선택하게 합니다."
            currentMode={currentMode}
            onSelect={handleSave}
            isSaving={isSaving}
          />
          <SettingOption
            mode="FORCE_A"
            title="타입 A 강제"
            description="모든 모바일 사용자가 STT 점검 페이지를 건너뛰고, 간단한 누적 방식(타입 A)으로 테스트를 진행합니다."
            currentMode={currentMode}
            onSelect={handleSave}
            isSaving={isSaving}
          />
          <SettingOption
            mode="FORCE_B"
            title="타입 B 강제"
            description="모든 모바일 사용자가 STT 점검 페이지를 건너뛰고, 고급 처리 방식(타입 B)으로 테스트를 진행합니다."
            currentMode={currentMode}
            onSelect={handleSave}
            isSaving={isSaving}
          />
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}

interface SettingOptionProps {
  mode: SttMode
  title: string
  description: string
  currentMode: SttMode | null
  onSelect: (mode: SttMode) => void
  isSaving: boolean
}

function SettingOption({ mode, title, description, currentMode, onSelect, isSaving }: SettingOptionProps) {
  const isSelected = currentMode === mode
  return (
    <div className={`p-4 border rounded-lg transition-all ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-300 bg-white hover:border-gray-400'}`}>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600 my-2">{description}</p>
      <button
        onClick={() => onSelect(mode)}
        disabled={isSaving || isSelected}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          isSelected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300'
        }`}
      >
        {isSaving && !isSelected ? '저장 중...' : isSelected ? '현재 설정' : '이 설정으로 저장'}
      </button>
    </div>
  )
} 