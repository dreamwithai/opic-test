"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useUserStore } from './useUserStore';

export default function LoginInfoHeader() {
  const { member, initFromStorage, logout } = useUserStore();

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <header className="bg-white border-b border-gray-200" style={{ marginBottom: 0 }}>
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center" style={{ height: 48 }}>
        <h1 className="text-lg font-bold text-blue-600 cursor-pointer font-sans">
          <Link href="/">OPIc 모의테스트</Link>
        </h1>
        {member?.name ? (
          <span style={{ color: "#2563eb", fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center' }}>
            {member.name.length > 6 ? `${member.name.slice(0, 6)}...` : member.name} 님
            <span style={{ marginLeft: 16 }}>
              <a href="#" onClick={logout} style={{ color: '#888', fontWeight: 400, fontSize: 14, marginLeft: 8, textDecoration: 'underline', cursor: 'pointer' }}>
                로그아웃
              </a>
            </span>
            <Link href="/mypage" style={{ marginLeft: 16 }}>
              <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                마이페이지
              </button>
            </Link>
          </span>
        ) : member === null ? null : (
          <span style={{ color: "#888", fontSize: 15 }}>
            <Link href="/login" style={{ textDecoration: 'underline', cursor: 'pointer' }}>
              로그인
            </Link>
          </span>
        )}
      </div>
    </header>
  );
}

export function useScrollToTopOnMount() {
  useEffect(() => {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    if (isIframe) {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 30); // 렌더링 이후 스크롤 이동 보장
    }
  }, []);
} 