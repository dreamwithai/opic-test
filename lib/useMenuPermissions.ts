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

export function useMenuPermissions() {
  const { data: session, status } = useSession()
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMenuPermissions()
    } else if (status === 'unauthenticated') {
      // 게스트 사용자도 메뉴 권한이 필요하므로 가져오기
      fetchMenuPermissions()
    }
  }, [status]) // 로그인 상태 변경 시에만 실행

  const fetchMenuPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/menu-permissions')
      
      if (response.ok) {
        const data = await response.json()
        setMenuPermissions(data.menuPermissions)
      }
    } catch (error) {
      console.error('Error fetching menu permissions:', error)
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
    const userType = getUserType()
    const menu = menuPermissions.find(m => m.menu_name === menuName && m.is_active)
    
    if (!menu) return false
    
    switch (userType) {
      case 'admin':
        return menu.admin_access
      case 'user':
        return menu.user_access
      case 'guest':
        return menu.guest_access
      default:
        return false
    }
  }

  const getAccessibleMenus = (): MenuPermission[] => {
    const userType = getUserType()
    
    return menuPermissions
      .filter(menu => menu.is_active)
      .filter(menu => {
        switch (userType) {
          case 'admin':
            return menu.admin_access
          case 'user':
            return menu.user_access
          case 'guest':
            return menu.guest_access
          default:
            return false
        }
      })
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  return {
    menuPermissions,
    loading,
    hasAccess,
    getAccessibleMenus,
    getUserType,
    refresh: fetchMenuPermissions
  }
} 