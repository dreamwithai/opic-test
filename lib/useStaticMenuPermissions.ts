import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface MenuPermission {
  id: number
  menu_name: string
  menu_label: string
  menu_path: string
  icon_name: string
  is_active: boolean
  admin_access: boolean
  user_access: boolean
  guest_access: boolean
  sort_order: number
  created_at: string
}

export function useStaticMenuPermissions() {
  const { data: session, status } = useSession()
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaticMenuPermissions()
  }, [status])

  const fetchStaticMenuPermissions = async () => {
    try {
      setLoading(true)
      
      // 사용자 타입에 따라 적절한 파일 선택
      let fileName = 'guest-menu.json'
      if (status === 'authenticated') {
        if (session?.user?.type === 'admin') {
          fileName = 'admin-menu.json'
        } else {
          fileName = 'user-menu.json'
        }
      }

      const response = await fetch(`/menu/${fileName}`)
      
      if (response.ok) {
        const data = await response.json()
        setMenuPermissions(data)
      } else {
        // 파일이 없으면 빈 배열로 설정
        setMenuPermissions([])
      }
    } catch (error) {
      console.error('Error fetching static menu permissions:', error)
      setMenuPermissions([])
    } finally {
      setLoading(false)
    }
  }

  const getUserType = () => {
    if (status === 'loading') return 'loading'
    if (status === 'unauthenticated') return 'guest'
    if (session?.user?.type === 'admin') return 'admin'
    return 'user'
  }

  const hasAccess = (menuName: string): boolean => {
    return menuPermissions.some(menu => menu.menu_name === menuName && menu.is_active)
  }

  const getAccessibleMenus = (): MenuPermission[] => {
    return menuPermissions
      .filter(menu => menu.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  return {
    menuPermissions,
    loading,
    hasAccess,
    getAccessibleMenus,
    getUserType,
    refresh: fetchStaticMenuPermissions
  }
} 