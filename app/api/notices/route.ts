import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 공지사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const isAdminQuery = searchParams.get('admin') === '1'
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.type === 'admin' && isAdminQuery

    let query = supabase
      .from('notices')
      .select(`
        *,
        members!notices_created_by_fkey(nickname)
      `)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 관리자가 아니면 공개된 공지사항만 (예약일 조건 추가)
    if (!isAdmin) {
      query = query
        .eq('is_published', true)
        .or('published_at.is.null,published_at.lte.' + new Date().toISOString())
    }

    const { data: notices, error, count } = await query

    if (error) {
      console.error('Notices fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 작성자 이름 추가
    const noticesWithAuthor = notices?.map(notice => ({
      ...notice,
      author_name: notice.members?.nickname || '관리자'
    })) || []

    return NextResponse.json({
      notices: noticesWithAuthor,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Notices API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 공지사항 생성 (관리자만)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, priority = 0, is_published = true, published_at = null } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('notices')
      .insert([{
        title,
        content,
        priority,
        is_published,
        published_at,
        created_by: session.user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Notice creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notice: data })
  } catch (error) {
    console.error('Notice creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 