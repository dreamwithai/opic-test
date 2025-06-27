"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { LogOut, User, Settings, ClipboardList, FileText, HelpCircle, MessageSquare, ChevronDown } from 'lucide-react';
import ImageWithFallback from './ImageWithFallback';

export default function LoginInfoHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    signOut({ callbackUrl: '/' });
  };

  // 로고 클릭 시 홈으로 이동
  const handleLogoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // 현재 페이지를 홈으로 교체
    window.location.replace('/');
  };

  // 드롭다운 메뉴 닫기 함수
  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // 이름/이메일/프로바이더/사용자 표시 함수
  function getDisplayName(user: any) {
    if (user?.name && user.name.trim() !== '') {
      return user.name;
    } else if (user?.email && user.email.trim() !== '') {
      const [id, domain] = user.email.split('@');
      return id.slice(0, 3) + '****@' + domain;
    } else if (user?.provider) {
      let kor = user.provider === 'kakao' ? '카카오' : user.provider === 'naver' ? '네이버' : user.provider === 'google' ? '구글' : user.provider;
      return `${kor} 회원`;
    } else {
      return '사용자';
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16">
        <div onClick={handleLogoClick} className="cursor-pointer">
          <ImageWithFallback
            src="/logo.png"
            alt="OPIc 모의테스트 로고"
            width={150}
            height={40}
            priority
            fallbackSrc="/logo.png"
          />
        </div>
        
        {pathname !== '/login' && (
          <>
            {status === "loading" ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-800 font-normal max-w-[120px] truncate text-sm">
                    {getDisplayName(user) + ' 님'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {user.image ? (
                      <ImageWithFallback 
                        src={user.image} 
                        alt="프로필" 
                        width={32}
                        height={32}
                        className="w-full h-full object-cover rounded-full"
                        priority
                        fallbackSrc="/default-profile.png"
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      href="/mypage" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeDropdown}
                    >
                      <ClipboardList className="h-4 w-4" />
                      마이페이지
                    </Link>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeDropdown}
                    >
                      <Settings className="h-4 w-4" />
                      설정
                    </Link>
                    
                    {/* 게시판 메뉴 */}
                    <div className="border-t border-gray-100 pt-1">
                      <Link 
                        href="/notices" 
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeDropdown}
                      >
                        <FileText className="h-4 w-4" />
                        공지사항
                      </Link>
                      <Link 
                        href="/inquiries" 
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={closeDropdown}
                      >
                        <MessageSquare className="h-4 w-4" />
                        1:1 문의하기
                      </Link>
                    </div>
                    
                    {user.type === 'admin' && (
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 border-t border-gray-100"
                        onClick={closeDropdown}
                      >
                        관리자 페이지
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
                로그인
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
} 