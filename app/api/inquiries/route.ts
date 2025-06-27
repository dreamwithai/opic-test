import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 문의사항 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const offset = (page - 1) * limit

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = session.user.type === 'admin'

    let query = supabase
      .from('inquiries')
      .select(`
        *,
        members!inquiries_member_id_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 관리자가 아니면 본인 문의사항만
    if (userId) {
      query = query.eq('member_id', userId)
    } else if (!isAdmin) {
      query = query.eq('member_id', session.user.id)
    }

    // 상태 필터
    if (status) {
      query = query.eq('status', status)
    }

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category)
    }

    // 날짜 범위 필터
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00`)
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59`)
    }

    const { data: inquiries, error, count } = await query

    if (error) {
      console.error('Inquiries fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 작성자 이름 추가
    const inquiriesWithAuthor = inquiries?.map(inquiry => ({
      ...inquiry,
      member_name: inquiry.members?.name || '사용자'
    })) || []

    return NextResponse.json({
      inquiries: inquiriesWithAuthor,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Inquiries API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 문의사항 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, category } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        member_id: session.user.id,
        title,
        content,
        category: category || 'general'
      })
      .select()
      .single()

    if (error) {
      console.error('Inquiry creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inquiry: data })
  } catch (error) {
    console.error('Inquiry creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 