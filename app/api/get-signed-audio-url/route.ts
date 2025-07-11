import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from "next-auth/next"
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Service Role 키를 사용하여 Supabase 클라이언트 초기화 (보안상 중요)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. 사용자 세션 확인 (인증된 사용자만 접근 가능)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    }

    // 2. 요청에서 파일 경로 받아오기
    const { filePath } = await request.json()
    if (!filePath) {
      return NextResponse.json({ error: '파일 경로가 필요합니다.' }, { status: 400 })
    }

    // 3. 보안 검사: 요청한 사용자가 파일의 소유자인지 확인
    // 파일 경로는 'permanent/USER_ID/FILENAME' 형식이어야 함
    const pathParts = filePath.split('/');
    const ownerId = pathParts.length > 1 ? pathParts[1] : null;

    const isAdmin = session.user.type === 'admin';
    if (!isAdmin && ownerId !== session.user.id) {
        return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 4. 서명된 URL 생성 (유효시간: 600초 = 10분)
    const { data, error } = await supabase.storage
      .from('recordings')
      .createSignedUrl(filePath, 600, { download: true }) // 600초(10분) 동안 유효, 다운로드 강제

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json({ error: 'URL 생성에 실패했습니다: ' + error.message }, { status: 500 })
    }

    // 5. 생성된 URL 반환
    return NextResponse.json({ signedUrl: data.signedUrl })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: '내부 서버 오류가 발생했습니다.' }, { status: 500 })
  }
} 