import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// FAQ 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const offset = (page - 1) * limit

    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.type === 'admin'

    let query = supabase
      .from('faqs')
      .select(`
        *,
        members!faqs_created_by_fkey(name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 카테고리 필터
    if (category) {
      query = query.eq('category', category)
    }

    // 관리자가 아니면 공개된 FAQ만
    if (!isAdmin) {
      query = query.eq('is_published', true)
    }

    const { data: faqs, error, count } = await query

    if (error) {
      console.error('FAQs fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 작성자 이름 추가
    const faqsWithAuthor = faqs?.map(faq => ({
      ...faq,
      author_name: faq.members?.name || '관리자'
    })) || []

    return NextResponse.json({
      faqs: faqsWithAuthor,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('FAQs API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// FAQ 생성 (관리자만)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { question, answer, category = 'general', is_published = true } = body

    if (!question || !answer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('faqs')
      .insert([{
        question,
        answer,
        category,
        is_published,
        created_by: session.user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('FAQ creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ faq: data })
  } catch (error) {
    console.error('FAQ creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 