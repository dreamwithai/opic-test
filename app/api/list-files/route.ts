import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'temp'

    console.log('Listing files in folder:', folder)

    // temp 폴더 전체 목록
    const { data: tempFiles, error: tempError } = await supabase.storage
      .from('recordings')
      .list(folder)

    if (tempError) {
      console.error('Error listing temp files:', tempError)
      return NextResponse.json({ error: tempError.message }, { status: 500 })
    }

    console.log('Temp folder contents:', tempFiles)

    // 사용자별 폴더 내용도 확인
    const userFolder = `${folder}/${session.user.id}`
    const { data: userFiles, error: userError } = await supabase.storage
      .from('recordings')
      .list(userFolder)

    if (userError) {
      console.error('Error listing user files:', userError)
    } else {
      console.log('User folder contents:', userFiles)
    }

    return NextResponse.json({
      tempFolder: tempFiles,
      userFolder: userFiles || [],
      userFolderPath: userFolder
    })

  } catch (error) {
    console.error('List files error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 