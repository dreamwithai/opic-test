import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 24시간 전 시간 계산
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // temp 폴더의 모든 파일 목록 가져오기
    const { data: files, error } = await supabase.storage
      .from('recordings')
      .list('temp', {
        limit: 1000,
        offset: 0
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 24시간이 지난 파일들 필터링
    const expiredFiles = files.filter(file => {
      const fileTime = new Date(file.updated_at || file.created_at || '')
      return fileTime < new Date(cutoffTime)
    })

    if (expiredFiles.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No expired files to clean up',
        cleanedFiles: 0
      })
    }

    // 만료된 파일들 삭제
    const filePaths = expiredFiles.map(file => `temp/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from('recordings')
      .remove(filePaths)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${expiredFiles.length} expired files`,
      cleanedFiles: expiredFiles.length
    })

  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 