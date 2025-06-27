import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 메뉴 권한 목록 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('menu_permissions')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching menu permissions:', error)
      return NextResponse.json({ error: 'Failed to fetch menu permissions' }, { status: 500 })
    }

    return NextResponse.json({ menuPermissions: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 메뉴 권한 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { menu_name, menu_label, menu_path, icon_name, admin_access, user_access, guest_access, sort_order } = body

    const { data, error } = await supabase
      .from('menu_permissions')
      .insert({
        menu_name,
        menu_label,
        menu_path,
        icon_name,
        admin_access,
        user_access,
        guest_access,
        sort_order
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating menu permission:', error)
      return NextResponse.json({ error: 'Failed to create menu permission' }, { status: 500 })
    }

    return NextResponse.json({ menuPermission: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 