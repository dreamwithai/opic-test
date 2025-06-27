import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

// 정적 메뉴 파일 생성
export async function POST() {
  try {
    // 메뉴 권한 데이터 가져오기
    const { data: menuPermissions, error } = await supabase
      .from('menu_permissions')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching menu permissions:', error)
      return NextResponse.json({ error: 'Failed to fetch menu permissions' }, { status: 500 })
    }

    // 권한별 메뉴 분류
    const adminMenus = menuPermissions.filter(menu => menu.is_active && menu.admin_access)
    const userMenus = menuPermissions.filter(menu => menu.is_active && menu.user_access)
    const guestMenus = menuPermissions.filter(menu => menu.is_active && menu.guest_access)

    // public/menu 디렉토리 생성
    const menuDir = path.join(process.cwd(), 'public', 'menu')
    if (!fs.existsSync(menuDir)) {
      fs.mkdirSync(menuDir, { recursive: true })
    }

    // 정적 파일 생성
    const files = [
      { name: 'admin-menu.json', data: adminMenus },
      { name: 'user-menu.json', data: userMenus },
      { name: 'guest-menu.json', data: guestMenus }
    ]

    for (const file of files) {
      const filePath = path.join(menuDir, file.name)
      fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2))
    }

    console.log('Static menu files generated successfully')
    return NextResponse.json({ 
      success: true, 
      message: 'Static menu files generated',
      files: files.map(f => f.name)
    })

  } catch (error) {
    console.error('Error generating static menu files:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 