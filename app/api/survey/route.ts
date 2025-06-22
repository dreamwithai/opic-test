import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('memberId')

  if (!memberId) {
    return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('member_survey')
      .select('id')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Survey fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ hasSurvey: !!data })
  } catch (error) {
    console.error('Survey fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, surveyData } = body

    if (!memberId || !surveyData) {
      return NextResponse.json({ error: 'Member ID and survey data are required' }, { status: 400 })
    }

    const { error } = await supabase.from('member_survey').insert([
      {
        member_id: memberId,
        opic_experience: surveyData.experience,
        current_level: surveyData.level,
        opic_purpose: surveyData.purpose,
        opic_plan: surveyData.schedule,
        agree_terms: surveyData.agreement === '동의함',
      }
    ])

    if (error) {
      console.error('Survey save error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Survey save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 