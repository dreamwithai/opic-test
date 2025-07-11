"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
import { Download, Users, Calendar, ArrowLeft, Home } from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  email: string;
  name?: string;
  provider: string;
  ref_site?: string;
  ref_id?: string;
  status?: string;
  created_at: string;
}

export default function MemberListPage() {
  const [startDate, setStartDate] = useState(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // useEffect 제거 (자동 조회 X)

  const fetchMembers = async () => {
    setSelected([]); // 검색 시 선택 초기화
    setLoading(true);
    setError(null);
    const start = dayjs(startDate).startOf("day").toISOString();
    const end = dayjs(endDate).endOf("day").toISOString();
    const { data, error } = await supabase
      .from("members")
      .select("id, email, name, provider, ref_site, ref_id, status, created_at")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setMembers(data || []);
    setLoading(false);
  };

  const handleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selected.length === members.length) setSelected([]);
    else setSelected(members.map(m => m.id));
  };

  const handleRegisterClass = async () => {
    if (selected.length === 0) return;
    setUpdating(true);
    const { error } = await supabase
      .from("members")
      .update({ status: "class" })
      .in("id", selected);
    if (!error) {
      setMembers(members.map(m => selected.includes(m.id) ? { ...m, status: "class" } : m));
      setSelected([]);
    } else {
      alert("업데이트 실패: " + error.message);
    }
    setUpdating(false);
  };

  const statusLabel = (status?: string) => {
    if (status === "class") return "수강중";
    if (status === "basic") return "일반";
    return status || "-";
  };

  const getStatusBadge = (status?: string) => {
    if (status === "class") {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">수강중</span>;
    }
    if (status === "basic") {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">일반</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">-</span>;
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      google: "bg-red-100 text-red-800",
      kakao: "bg-yellow-100 text-yellow-800",
      naver: "bg-green-100 text-green-800",
      email: "bg-gray-100 text-gray-800"
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[provider as keyof typeof colors] || colors.email}`}>
        {provider}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['가입일시', '이메일', '이름', 'Provider', 'ref_site', 'ref_id', 'status'];
    const csvContent = [
      headers.join(','),
      ...members.map(m => [
        dayjs(m.created_at).format("YYYY-MM-DD HH:mm:ss"),
        m.email,
        m.name || '',
        m.provider,
        m.ref_site || '',
        m.ref_id || '',
        statusLabel(m.status)
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `members_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-8">
      {/* 네비게이션 */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로가기
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            어드민 홈
          </Link>
        </div>
      </div>

      {/* 헤더 */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회원 관리</h1>
          <p className="text-gray-600">일자별로 등록한 회원을 조회하고 관리하세요</p>
        </div>
      </div>

      {/* 날짜 검색 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full text-sm pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            max={endDate}
            placeholder="시작일"
          />
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full text-sm pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={startDate}
            max={dayjs().format('YYYY-MM-DD')}
            placeholder="종료일"
          />
          <button
            onClick={fetchMembers}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">전체</p>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 text-sm font-bold">C</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">수강중</p>
              <p className="text-2xl font-bold text-gray-900">{members.filter(m => m.status === 'class').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-blue-600 text-sm font-bold">일</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">일반</p>
              <p className="text-2xl font-bold text-gray-900">{members.filter(m => m.status === 'basic').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-end space-x-3 mb-6">
        <button
          onClick={exportToCSV}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          CSV 다운로드
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          onClick={handleRegisterClass}
          disabled={selected.length === 0 || updating}
        >
          {updating ? '처리 중...' : `수강회원 전환 (${selected.length})`}
        </button>
      </div>

      {/* 회원 목록 */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-red-500">오류: {error}</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selected.length === members.length && members.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">가입일시</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ref_site</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ref_id</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">해당 기간에 가입한 회원이 없습니다.</p>
                    </td>
                  </tr>
                ) : (
                  members.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selected.includes(m.id)}
                          onChange={() => handleSelect(m.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dayjs(m.created_at).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {m.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {m.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getProviderBadge(m.provider)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {m.ref_site || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {m.ref_id || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(m.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 