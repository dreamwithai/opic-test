import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 메뉴 권한 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { menu_name, menu_label, menu_path, icon_name, is_active, admin_access, user_access, guest_access, sort_order } = body

    const { data, error } = await supabase
      .from('menu_permissions')
      .update({
        menu_name,
        menu_label,
        menu_path,
        icon_name,
        is_active,
        admin_access,
        user_access,
        guest_access,
        sort_order
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating menu permission:', error)
      return NextResponse.json({ error: 'Failed to update menu permission' }, { status: 500 })
    }

    return NextResponse.json({ menuPermission: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 메뉴 권한 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('menu_permissions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting menu permission:', error)
      return NextResponse.json({ error: 'Failed to delete menu permission' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 