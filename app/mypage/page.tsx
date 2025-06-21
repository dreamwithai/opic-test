"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import FullScreenLoader from '../components/FullScreenLoader'
import LoadingSpinner from '../components/LoadingSpinner'
import Breadcrumb from "../components/Breadcrumb";
import { ClipboardList } from "lucide-react";

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
  const { data: session, status: authStatus } = useSession();
  const [sessions, setSessions] = useState<TestSessionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'card' | 'table' | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Detect device type and set default view
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setViewType(isMobile ? 'card' : 'table');

    const fetchSessions = async () => {
      if (authStatus === 'authenticated' && session?.user?.id) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("test_session")
          .select("id, member_id, type, theme, level, started_at, first_answer, first_feedback")
          .eq("member_id", session.user.id)
          .order("started_at", { ascending: false });
        
        if (error) {
          console.error("Error fetching sessions:", error);
          setSessions([]);
        } else {
          setSessions(data || []);
        }
        setIsLoading(false);
      } else if (authStatus === 'unauthenticated') {
        setSessions([]);
        setIsLoading(false);
      }
      // if authStatus is 'loading', isLoading remains true until status changes.
    };

    fetchSessions();
  }, [authStatus, session]);

  const handleStartTest = () => {
    // If there are past sessions, suggest the most recent level.
    // Otherwise, redirect to the main page to start over.
    if (sessions.length > 0 && sessions[0].level) {
      router.push(`/question-type?level=${encodeURIComponent(sessions[0].level)}`);
    } else {
      router.push('/');
    }
  };

  if (authStatus === 'loading') {
    return <FullScreenLoader />;
  }
  
  if (authStatus === 'unauthenticated') {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-center">
        <p className="text-xl font-semibold text-gray-700 mb-4">로그인이 필요합니다.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          홈으로 이동
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="mb-6">
          <Breadcrumb items={[{ href: '/', label: '홈' }, { label: '마이페이지' }]} />
          <div className="mt-2 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-gray-700" />
            <h2 className="text-3xl font-bold text-gray-800">마이페이지</h2>
          </div>
          <p className="text-gray-600 font-medium mt-2 ml-11">내 응시내역을 보실 수 있습니다.</p>
        </div>
        
        {isLoading || viewType === null ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner className="mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="font-semibold text-gray-700">응시 내역이 없습니다.</p>
            <p className="text-gray-500 text-sm mt-1">첫 테스트를 시작해보세요!</p>
          </div>
        ) : viewType === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((row) => (
              <div key={row.id} className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
                <div>
                  <div className="font-semibold text-blue-700">{row.type} ({row.theme})</div>
                  <div className="text-xs text-gray-500 mb-2">{new Date(row.started_at).toLocaleDateString()}</div>
                  <p className="text-sm text-gray-700 break-all"><strong>내 답변:</strong> {row.first_answer?.slice(0, 50) || '-'}...</p>
                </div>
                <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm">결과 상세보기</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">일자</th>
                  <th className="px-4 py-3 font-medium text-gray-600">유형</th>
                  <th className="px-4 py-3 font-medium text-gray-600">첫 답변</th>
                  <th className="px-4 py-3 font-medium text-gray-600">상세</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 text-gray-700">{new Date(row.started_at).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-gray-700">{row.type} ({row.theme})</td>
                    <td className="px-4 py-2 text-gray-600 truncate max-w-sm">{row.first_answer || '-'}</td>
                    <td className="px-4 py-2"><button className="text-blue-600 hover:underline font-medium">결과 보기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="flex justify-center mt-8">
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg"
            onClick={handleStartTest}
          >
            새 테스트 시작하기
          </button>
        </div>
      </div>
    </div>
  );
} 