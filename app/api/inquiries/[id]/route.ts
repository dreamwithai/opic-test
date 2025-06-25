import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 개별 문의사항 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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
      .eq('id', id)

    // 관리자가 아니면 본인 문의사항만
    if (!isAdmin) {
      query = query.eq('member_id', session.user.id)
    }

    const { data: inquiries, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
      }
      console.error('Inquiry fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 작성자 이름 추가
    const inquiryWithAuthor = {
      ...inquiries,
      member_name: inquiries.members?.name || '사용자'
    }

    return NextResponse.json({ inquiry: inquiryWithAuthor })
  } catch (error) {
    console.error('Inquiry API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 문의사항 상태 업데이트 (관리자만)
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
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('inquiries')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Inquiry update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inquiry: data })
  } catch (error) {
    console.error('Inquiry update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 