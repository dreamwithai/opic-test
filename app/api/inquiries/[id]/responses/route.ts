import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 문의사항 답변 목록 조회
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

    // 문의사항이 본인 것인지 확인 (관리자는 모든 답변 조회 가능)
    const isAdmin = session.user.type === 'admin'
    
    if (!isAdmin) {
      const { data: inquiry, error: inquiryError } = await supabase
        .from('inquiries')
        .select('member_id')
        .eq('id', id)
        .single()

      if (inquiryError || inquiry.member_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { data: responses, error } = await supabase
      .from('inquiry_responses')
      .select(`
        *,
        members!inquiry_responses_created_by_fkey(name, type)
      `)
      .eq('inquiry_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Inquiry responses fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 작성자 정보 추가
    const responsesWithAuthor = responses?.map(response => ({
      ...response,
      author_name: response.members?.name || '관리자',
      is_admin: response.members?.type === 'admin'
    })) || []

    return NextResponse.json({ responses: responsesWithAuthor })
  } catch (error) {
    console.error('Inquiry responses API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 문의사항 답변 생성 (관리자만)
export async function POST(
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
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // 문의사항이 존재하는지 확인
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('id, status')
      .eq('id', id)
      .single()

    if (inquiryError) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // 답변 생성
    const { data: response, error } = await supabase
      .from('inquiry_responses')
      .insert([{
        inquiry_id: id,
        content,
        created_by: session.user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Response creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 문의사항 상태를 'answered'로 업데이트
    await supabase
      .from('inquiries')
      .update({ 
        status: 'answered',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Response creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 