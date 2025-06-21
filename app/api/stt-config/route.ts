import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]/route' // Import authOptions

// This GET handler fetches the current STT configuration.
// It's a public endpoint, so any client can check the current setting.
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  try {
    const { data, error } = await supabase
      .from('stt_config')
      .select('mobile_stt_mode')
      .eq('id', 1) // We assume the config is stored in a single row with id = 1
      .single()

    // If the row doesn't exist, return the default value.
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ mobile_stt_mode: 'USER_SELECT' })
      }
      throw error
    }
    return NextResponse.json({ mobile_stt_mode: data.mobile_stt_mode })
  } catch (error: any) {
    console.error('GET /api/stt-config Error:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

// This POST handler updates the STT configuration.
// It is protected and only accessible by admin users.
export async function POST(request: Request) {
  try {
    // 1. Get the session using the official NextAuth.js method.
    // This is the single source of truth for user authentication.
    const session = await getServerSession(authOptions)

    // Check if a session exists and if the user object with a 'type' property is present.
    if (!session || !session.user || session.user.type !== 'admin') {
      // Log the reason for denial for debugging purposes.
      console.warn(`Admin access denied. Session: ${JSON.stringify(session)}`);
      return NextResponse.json({ error: 'Forbidden: User is not an admin or not logged in.' }, { status: 403 })
    }

    // 2. If the user is an admin, proceed with the update.
    const { mobile_stt_mode } = await request.json()
    const validModes = ['USER_SELECT', 'FORCE_A', 'FORCE_B']
    if (!validModes.includes(mobile_stt_mode)) {
      return NextResponse.json({ error: 'Invalid mode provided' }, { status: 400 })
    }

    // 3. Use a Supabase client with service_role to bypass RLS for the update.
    // This is only for database mutation, not for authentication.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: updateError } = await supabaseAdmin
      .from('stt_config')
      .upsert({ id: 1, mobile_stt_mode: mobile_stt_mode })
      .eq('id', 1)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, mode: mobile_stt_mode })
  } catch (error: any) {
    console.error('POST /api/stt-config Error:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
} 