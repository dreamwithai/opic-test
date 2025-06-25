import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// FAQ 개별 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data: faq, error } = await supabase
      .from('faqs')
      .select(`
        *,
        members!faqs_author_id_fkey(name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'FAQ not found' }, { status: 404 })
      }
      console.error('FAQ fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 조회수 증가 (공개된 FAQ만)
    if (faq.is_published) {
      await supabase
        .from('faqs')
        .update({ view_count: faq.view_count + 1 })
        .eq('id', id)
    }

    // 작성자 이름 추가
    const faqWithAuthor = {
      ...faq,
      author_name: faq.members?.name || '관리자'
    }

    return NextResponse.json({ faq: faqWithAuthor })
  } catch (error) {
    console.error('FAQ API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// FAQ 수정 (관리자만)
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
    const { question, answer, category, is_published } = body

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('faqs')
      .update({
        question,
        answer,
        category: category || 'general',
        is_published: is_published !== undefined ? is_published : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('FAQ update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ faq: data })
  } catch (error) {
    console.error('FAQ update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// FAQ 삭제 (관리자만)
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
      .from('faqs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('FAQ delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'FAQ deleted successfully' })
  } catch (error) {
    console.error('FAQ delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 