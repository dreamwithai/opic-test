import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 오디오 파일 URL 생성 함수
export function getAudioUrl(fileName: string, category?: string): string {
  // 이미 카테고리가 포함된 경우 (예: C/filename.mp3)
  if (fileName.includes('/')) {
    const { data } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName)
    return data.publicUrl
  }
  
  // 카테고리가 제공된 경우
  if (category) {
    // 파일명에 이미 .mp3가 있는지 확인하고, 없으면 추가
    const fullFileName = fileName.endsWith('.mp3') ? fileName : `${fileName}.mp3`
    const { data } = supabase.storage
      .from('audio-files')
      .getPublicUrl(`${category}/${fullFileName}`)
    return data.publicUrl
  }
  
  // 기본: 파일명만 (기존 방식)
  const { data } = supabase.storage
    .from('audio-files')
    .getPublicUrl(fileName)
  
  return data.publicUrl
}

// 오디오 파일 업로드 함수 (관리자용)
export async function uploadAudioFile(file: File, fileName: string) {
  const { data, error } = await supabase.storage
    .from('audio-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    throw error
  }

  return data
} 