'use client'

import { useState } from 'react'
import { uploadAudioFile, supabase } from '@/lib/supabase'

export default function AdminUploadPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string>('')
  const [testing, setTesting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('S')

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'S', label: 'S (선택주제)' },
    { value: 'C', label: 'C (돌발주제)' },
    { value: 'RP', label: 'RP (롤플레이)' },
    { value: 'MOCK', label: 'MOCK (모의고사)' }
  ]

  // Supabase 연결 테스트 함수
  const testSupabaseConnection = async () => {
    setTesting(true)
    setUploadResult('')
    
    try {
      // 환경변수 확인 (브라우저에서 확인 가능)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      console.log('🔍 Environment Check:')
      console.log('Supabase URL:', supabaseUrl)
      console.log('Has Anon Key:', !!supabaseKey)
      console.log('Anon Key length:', supabaseKey?.length || 0)
      
      if (!supabaseUrl || !supabaseKey) {
        setUploadResult(`❌ 환경변수 누락:\n- URL: ${!!supabaseUrl}\n- Key: ${!!supabaseKey}`)
        return
      }
      
      setUploadResult(`🔍 연결 시도 중...\n- URL: ${supabaseUrl}\n- Key 길이: ${supabaseKey.length}`)
      
      // Storage 버킷 리스트 가져오기 테스트
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Supabase error:', error)
        setUploadResult(`❌ Supabase 연결 실패:\n${error.message}`)
      } else {
        setUploadResult(`✅ Supabase 연결 성공!\n버킷 목록: ${buckets?.map(b => b.name).join(', ') || '없음'}`)
      }
    } catch (error) {
      console.error('Connection test error:', error)
      setUploadResult(`❌ 연결 테스트 실패: ${error}`)
    } finally {
      setTesting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadResult('')

    try {
      for (const file of Array.from(files)) {
        // 선택된 카테고리를 파일 경로에 적용
        const originalFileName = file.name
        const fileName = `${selectedCategory}/${originalFileName}`
        
        console.log(`Uploading: ${originalFileName} → ${fileName}`)
        
        await uploadAudioFile(file, fileName)
        setUploadResult(prev => prev + `✅ ${originalFileName} → ${fileName} 업로드 완료\n`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult(prev => prev + `❌ 업로드 실패: ${error}\n상세: ${error instanceof Error ? error.message : String(error)}\n`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">오디오 파일 업로드 (관리자)</h1>
        
        {/* Supabase 연결 테스트 버튼 */}
        <div className="mb-6">
          <button
            onClick={testSupabaseConnection}
            disabled={testing}
            className={`px-4 py-2 rounded text-white ${
              testing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {testing ? '테스트 중...' : '🔧 Supabase 연결 테스트'}
          </button>
        </div>

        {/* 카테고리 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            카테고리 선택
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            파일이 업로드될 폴더: <code>{selectedCategory}/</code>
          </p>
        </div>
        
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            multiple
            accept="audio/*,.mp3"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="audio-upload"
          />
          <label
            htmlFor="audio-upload"
            className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
              uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {uploading ? '업로드 중...' : '오디오 파일 선택'}
          </label>
          <p className="mt-2 text-sm text-gray-600">
            MP3 파일을 선택하세요. 여러 파일 동시 업로드 가능합니다.
          </p>
          <p className="mt-1 text-sm text-blue-600">
            선택된 카테고리: <strong>{categoryOptions.find(opt => opt.value === selectedCategory)?.label}</strong>
          </p>
        </div>

        {uploadResult && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">업로드 결과:</h3>
            <pre className="whitespace-pre-wrap text-sm">{uploadResult}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-2">📋 사용 방법:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>1단계:</strong> 위에서 카테고리를 선택하세요</li>
            <li>• <strong>2단계:</strong> 파일명은 <code>테마_id_seq.mp3</code> 형식으로 하세요</li>
            <li>• <strong>예시:</strong> <code>Movies_001_001.mp3</code></li>
            <li>• <strong>자동 경로:</strong> 선택한 카테고리 폴더에 자동 업로드됩니다</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 