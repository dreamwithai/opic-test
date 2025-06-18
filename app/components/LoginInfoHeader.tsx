"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginInfoHeader() {
  const [member, setMember] = useState<{ name?: string } | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const m = localStorage.getItem("member");
      if (m) setMember(JSON.parse(m));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("member");
    localStorage.removeItem("isAdmin");
    window.location.href = "/";
  };

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
              <a href="#" onClick={handleLogout} style={{ color: '#888', fontWeight: 400, fontSize: 14, marginLeft: 8, textDecoration: 'underline', cursor: 'pointer' }}>
                로그아웃
              </a>
            </span>
            <Link href="/mypage" style={{ marginLeft: 16 }}>
              <button style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                마이페이지
              </button>
            </Link>
          </span>
        ) : (
          <span style={{ color: "#888", fontSize: 15 }}>로그인</span>
        )}
      </div>
    </header>
  );
} 