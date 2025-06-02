import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 오디오 파일 URL 생성 함수
export function getAudioUrl(fileName: string): string {
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