const fs = require('fs');
const path = require('path');

// 테스트용 메뉴 데이터
const testMenuData = {
  admin: [
    {
      id: 1,
      menu_name: 'notices',
      menu_label: '공지사항',
      menu_path: '/admin/notices',
      icon_name: 'FileText',
      is_active: true,
      admin_access: true,
      user_access: false,
      guest_access: false,
      sort_order: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      menu_name: 'inquiries',
      menu_label: '문의관리',
      menu_path: '/admin/inquiries',
      icon_name: 'MessageSquare',
      is_active: true,
      admin_access: true,
      user_access: false,
      guest_access: false,
      sort_order: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      menu_name: 'reviews',
      menu_label: '리뷰관리',
      menu_path: '/admin/reviews',
      icon_name: 'Star',
      is_active: true,
      admin_access: true,
      user_access: false,
      guest_access: false,
      sort_order: 3,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      menu_name: 'menu-management',
      menu_label: '메뉴관리',
      menu_path: '/admin/menu-management',
      icon_name: 'Settings',
      is_active: true,
      admin_access: true,
      user_access: false,
      guest_access: false,
      sort_order: 4,
      created_at: new Date().toISOString()
    }
  ],
  user: [
    {
      id: 5,
      menu_name: 'notices',
      menu_label: '공지사항',
      menu_path: '/notices',
      icon_name: 'FileText',
      is_active: true,
      admin_access: false,
      user_access: true,
      guest_access: false,
      sort_order: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      menu_name: 'faqs',
      menu_label: '자주묻는질문',
      menu_path: '/faqs',
      icon_name: 'HelpCircle',
      is_active: true,
      admin_access: false,
      user_access: true,
      guest_access: false,
      sort_order: 2,
      created_at: new Date().toISOString()
    },
    {
      id: 7,
      menu_name: 'inquiries',
      menu_label: '문의하기',
      menu_path: '/inquiries',
      icon_name: 'MessageSquare',
      is_active: true,
      admin_access: false,
      user_access: true,
      guest_access: false,
      sort_order: 3,
      created_at: new Date().toISOString()
    },
    {
      id: 8,
      menu_name: 'reviews',
      menu_label: '리뷰',
      menu_path: '/reviews',
      icon_name: 'Star',
      is_active: true,
      admin_access: false,
      user_access: true,
      guest_access: false,
      sort_order: 4,
      created_at: new Date().toISOString()
    }
  ],
  guest: [
    {
      id: 9,
      menu_name: 'notices',
      menu_label: '공지사항',
      menu_path: '/notices',
      icon_name: 'FileText',
      is_active: true,
      admin_access: false,
      user_access: false,
      guest_access: true,
      sort_order: 1,
      created_at: new Date().toISOString()
    },
    {
      id: 10,
      menu_name: 'faqs',
      menu_label: '자주묻는질문',
      menu_path: '/faqs',
      icon_name: 'HelpCircle',
      is_active: true,
      admin_access: false,
      user_access: false,
      guest_access: true,
      sort_order: 2,
      created_at: new Date().toISOString()
    }
  ]
};

// public/menu 디렉토리 생성
const menuDir = path.join(process.cwd(), 'public', 'menu');
if (!fs.existsSync(menuDir)) {
  fs.mkdirSync(menuDir, { recursive: true });
}

// 정적 파일 생성
const files = [
  { name: 'admin-menu.json', data: testMenuData.admin },
  { name: 'user-menu.json', data: testMenuData.user },
  { name: 'guest-menu.json', data: testMenuData.guest }
];

for (const file of files) {
  const filePath = path.join(menuDir, file.name);
  fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2));
  console.log(`Generated: ${file.name}`);
}

console.log('Static menu files generated successfully!'); 