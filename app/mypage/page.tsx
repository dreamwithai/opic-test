"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TestSessionRow {
  id: string;
  member_id: string;
  type: string;
  theme: string;
  level: string;
  started_at: string;
  first_answer: string;
  first_feedback: string;
}

export default function MyPage() {
  const [sessions, setSessions] = useState<TestSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'card' | 'table'>('card');
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      const member = JSON.parse(localStorage.getItem("member") || "{}");
      if (!member.id) {
        setSessions([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("test_session")
        .select("id, member_id, type, theme, level, started_at, first_answer, first_feedback")
        .eq("member_id", member.id)
        .order("started_at", { ascending: false });
      if (error) {
        setSessions([]);
      } else {
        setSessions(data || []);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  // 새 테스트 시작하기 버튼 핸들러
  const handleStartTest = () => {
    if (sessions.length > 0) {
      const recentLevel = sessions[0].level || 'IM2';
      router.push(`/question-type?level=${encodeURIComponent(recentLevel)}`);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Content */}
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Back button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-3 text-sm"
        >
          <span className="mr-2">←</span>
          <span className="font-medium">뒤로가기</span>
        </button>
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Link href="/" className="hover:text-gray-800">홈</Link>
          <span className="mx-2">›</span>
          <span>마이페이지</span>
        </div>
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2">마이페이지</h2>
        <p className="text-gray-600 font-medium mb-6">내 응시내역을 보실 수 있습니다.</p>
        {/* View Type Toggle */}
        <div className="flex justify-end mb-4 gap-2">
          <button
            className={`px-4 py-2 rounded font-semibold border ${viewType === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border-blue-600'}`}
            onClick={() => setViewType('card')}
          >
            카드형 보기
          </button>
          <button
            className={`px-4 py-2 rounded font-semibold border ${viewType === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 border-blue-600'}`}
            onClick={() => setViewType('table')}
          >
            테이블형 보기
          </button>
        </div>
        {/* 카드형 리스트 */}
        {viewType === 'card' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8">응시 내역이 없습니다.</div>
            ) : (
              sessions.map((row) => (
                <div key={row.id} className="border rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between bg-white hover:shadow-md transition">
                  <div>
                    <div className="font-semibold text-blue-700">{row.type} ({row.theme})</div>
                    <div className="text-xs text-gray-500 mb-1">{row.started_at?.slice(0, 10)}</div>
                    <div className="text-sm text-gray-700 truncate">내 답변: {row.first_answer?.slice(0, 40) || '-'}</div>
                    <div className="text-sm text-gray-500 truncate">피드백: {row.first_feedback?.slice(0, 40) || '-'}</div>
                  </div>
                  <button className="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium">상세보기</button>
                </div>
              ))
            )}
          </div>
        )}
        {/* 테이블형 리스트 */}
        {viewType === 'table' && (
          <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">일자</th>
                  <th className="px-4 py-2">유형</th>
                  <th className="px-4 py-2">답변</th>
                  <th className="px-4 py-2">피드백</th>
                  <th className="px-4 py-2">상세</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8">로딩 중...</td></tr>
                ) : sessions.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8">응시 내역이 없습니다.</td></tr>
                ) : (
                  sessions.map((row) => (
                    <tr key={row.id} className="even:bg-gray-50 hover:bg-blue-50 transition">
                      <td className="px-4 py-2">{row.started_at?.slice(0, 10)}</td>
                      <td className="px-4 py-2">{row.type} ({row.theme})</td>
                      <td className="px-4 py-2 truncate max-w-xs">{row.first_answer?.slice(0, 30) || '-'}</td>
                      <td className="px-4 py-2 truncate max-w-xs">{row.first_feedback?.slice(0, 30) || '-'}</td>
                      <td className="px-4 py-2"><button className="text-blue-600 underline">상세보기</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-center mt-8">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            onClick={handleStartTest}
          >
            새 테스트 시작하기
          </button>
        </div>
      </div>
    </div>
  );
} 