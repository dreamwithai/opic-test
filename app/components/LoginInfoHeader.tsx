"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function LoginInfoHeader() {
  const { data: session, status } = useSession();
  const user = session?.user;

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white border-b border-gray-200" style={{ marginBottom: 0 }}>
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center" style={{ height: 48 }}>
        <h1 className="text-lg font-bold text-blue-600 cursor-pointer font-sans">
          <Link href="/">OPIc 모의테스트</Link>
        </h1>
        {status === "loading" ? (
          <div>Loading...</div>
        ) : user ? (
          <span style={{ color: "#2563eb", fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center' }}>
            {user.name && (user.name.length > 6 ? `${user.name.slice(0, 6)}...` : user.name)} 님
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