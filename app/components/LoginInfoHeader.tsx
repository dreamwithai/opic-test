"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";

export default function LoginInfoHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    signOut({ callbackUrl: '/' });
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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16">
        <h1 className="text-xl font-bold text-blue-600 cursor-pointer font-sans">
          <Link href="/">OPIc 모의테스트</Link>
        </h1>
        {status === "loading" ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        ) : user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2"
            >
              <span className="hidden sm:inline text-gray-700 font-medium text-sm">
                {user.name} 님
              </span>
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.image ? (
                  <img src={user.image} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                <Link href="/mypage" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}>
                  응시 내역
                </Link>
                <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsDropdownOpen(false)}>
                  회원 정보
                </Link>
                <div className="border-t border-gray-100 my-1"></div>
                <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold text-sm hover:bg-blue-700 transition-colors">
            로그인
          </Link>
        )}
      </div>
    </header>
  );
} 