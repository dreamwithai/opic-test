'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminGuard from '@/components/AdminGuard'
import { Settings, Edit, Trash2, Plus, Save, X, Eye, EyeOff, Users, User, Shield, ArrowLeft, Home } from 'lucide-react'

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

export default function MenuManagementPage() {
  return (
    <AdminGuard>
      <MenuManagementUI />
    </AdminGuard>
  )
}

function MenuManagementUI() {
  const { data: session, status } = useSession()
  const [menuPermissions, setMenuPermissions] = useState<MenuPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    menu_name: '',
    menu_label: '',
    menu_path: '',
    icon_name: '',
    is_active: true,
    admin_access: true,
    user_access: false,
    guest_access: false,
    sort_order: 0
  })
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMenuPermissions()
    }
  }, [status])

  const fetchMenuPermissions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/menu-permissions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch menu permissions')
      }

      const data = await response.json()
      setMenuPermissions(data.menuPermissions)
    } catch (error) {
      console.error('Error fetching menu permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (menu: MenuPermission) => {
    setEditingId(menu.id)
    setFormData({
      menu_name: menu.menu_name,
      menu_label: menu.menu_label,
      menu_path: menu.menu_path,
      icon_name: menu.icon_name,
      is_active: menu.is_active,
      admin_access: menu.admin_access,
      user_access: menu.user_access,
      guest_access: menu.guest_access,
      sort_order: menu.sort_order
    })
  }

  const handleSave = async () => {
    try {
      const url = editingId 
        ? `/api/menu-permissions/${editingId}`
        : '/api/menu-permissions'
      
      const method = editingId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save menu permission')
      }

      setEditingId(null)
      setShowAddForm(false)
      setFormData({
        menu_name: '',
        menu_label: '',
        menu_path: '',
        icon_name: '',
        is_active: true,
        admin_access: true,
        user_access: false,
        guest_access: false,
        sort_order: 0
      })
      fetchMenuPermissions()
      alert(editingId ? '메뉴가 수정되었습니다.' : '메뉴가 추가되었습니다.')
    } catch (error) {
      console.error('Error saving menu permission:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/menu-permissions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete menu permission')
      }

      fetchMenuPermissions()
      alert('메뉴가 삭제되었습니다.')
    } catch (error) {
      console.error('Error deleting menu permission:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const generateStaticMenuFiles = async () => {
    try {
      const response = await fetch('/api/menu-permissions/generate-static', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert('정적 메뉴 파일이 성공적으로 생성되었습니다!')
        console.log('Generated files:', result.files)
      } else {
        alert('정적 파일 생성 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('Error generating static menu files:', error)
      alert('정적 파일 생성 중 오류가 발생했습니다.')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    setFormData({
      menu_name: '',
      menu_label: '',
      menu_path: '',
      icon_name: '',
      is_active: true,
      admin_access: true,
      user_access: false,
      guest_access: false,
      sort_order: 0
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const getAccessBadge = (admin: boolean, user: boolean, guest: boolean) => {
    const badges = []
    if (admin) badges.push('관리자')
    if (user) badges.push('사용자')
    if (guest) badges.push('게스트')
    return badges.join(', ') || '접근 불가'
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 네비게이션 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-white rounded-md border hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </button>
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 bg-white rounded-md border hover:bg-gray-50"
          >
            <Home className="w-4 h-4" />
            어드민홈
          </button>
        </div>

        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">메뉴 관리</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={generateStaticMenuFiles}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Settings className="w-4 h-4" />
                정적 파일 생성
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                새 메뉴 추가
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            각 메뉴별로 접근 권한을 설정할 수 있습니다. 메뉴 변경 후 "정적 파일 생성" 버튼을 눌러주세요.
          </p>
        </div>

        {/* 새 메뉴 추가 폼 */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">새 메뉴 추가</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">메뉴명 *</label>
                <input
                  type="text"
                  name="menu_name"
                  value={formData.menu_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="예: notices"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">표시명 *</label>
                <input
                  type="text"
                  name="menu_label"
                  value={formData.menu_label}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="예: 공지사항"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">경로 *</label>
                <input
                  type="text"
                  name="menu_path"
                  value={formData.menu_path}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="예: /notices"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">아이콘명</label>
                <input
                  type="text"
                  name="icon_name"
                  value={formData.icon_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="예: FileText"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">정렬 순서</label>
                <input
                  type="number"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">접근 권한</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="admin_access"
                    checked={formData.admin_access}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="text-sm">관리자</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="user_access"
                    checked={formData.user_access}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">사용자</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="guest_access"
                    checked={formData.guest_access}
                    onChange={handleInputChange}
                    className="rounded"
                  />
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">게스트</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* 메뉴 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">메뉴 목록</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {menuPermissions.map((menu) => (
                <div key={menu.id} className="p-6">
                  {editingId === menu.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">메뉴명</label>
                          <input
                            type="text"
                            name="menu_name"
                            value={formData.menu_name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">표시명</label>
                          <input
                            type="text"
                            name="menu_label"
                            value={formData.menu_label}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">경로</label>
                          <input
                            type="text"
                            name="menu_path"
                            value={formData.menu_path}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">아이콘명</label>
                          <input
                            type="text"
                            name="icon_name"
                            value={formData.icon_name}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="admin_access"
                            checked={formData.admin_access}
                            onChange={handleInputChange}
                            className="rounded"
                          />
                          <span className="text-sm">관리자</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="user_access"
                            checked={formData.user_access}
                            onChange={handleInputChange}
                            className="rounded"
                          />
                          <span className="text-sm">사용자</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="guest_access"
                            checked={formData.guest_access}
                            onChange={handleInputChange}
                            className="rounded"
                          />
                          <span className="text-sm">게스트</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{menu.menu_label}</h3>
                          <p className="text-sm text-gray-500">{menu.menu_path}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          접근: {getAccessBadge(menu.admin_access, menu.user_access, menu.guest_access)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(menu)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(menu.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 