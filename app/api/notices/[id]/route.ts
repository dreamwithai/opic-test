import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 공지사항 개별 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: notice, error } = await supabase
      .from('notices')
      .select(`
        *,
        members!notices_created_by_fkey(nickname)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Notice not found' }, { status: 404 })
      }
      console.error('Notice fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 조회수 증가 (공개된 공지사항만)
    if (notice.is_published) {
      await supabase
        .from('notices')
        .update({ view_count: notice.view_count + 1 })
        .eq('id', id)
    }

    // 작성자 이름 추가
    const noticeWithAuthor = {
      ...notice,
      author_name: notice.members?.nickname || '관리자'
    }

    return NextResponse.json({ notice: noticeWithAuthor })
  } catch (error) {
    console.error('Notice API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 공지사항 수정 (관리자만)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, priority, is_published, published_at } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('notices')
      .update({
        title,
        content,
        priority: priority || 'normal',
        is_published: is_published !== undefined ? is_published : true,
        published_at: published_at !== undefined ? published_at : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Notice update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notice: data })
  } catch (error) {
    console.error('Notice update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 공지사항 삭제 (관리자만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Notice delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notice deleted successfully' })
  } catch (error) {
    console.error('Notice delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 