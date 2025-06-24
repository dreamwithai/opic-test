"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

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
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setSelected([]); // 날짜 바뀌면 선택 초기화
    const fetchMembers = async () => {
      setLoading(true);
      setError(null);
      const start = dayjs(date).startOf("day").toISOString();
      const end = dayjs(date).endOf("day").toISOString();
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
    fetchMembers();
  }, [date]);

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
    if (status === "basic") return "기본";
    return status || "-";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-8">
      <h1 className="text-2xl font-bold mb-6">회원 일자별 조회</h1>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <label className="mr-2 font-medium">조회 날짜:</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleRegisterClass}
          disabled={selected.length === 0 || updating}
        >
          {updating ? '처리 중...' : '수강회원 전환'}
        </button>
      </div>
      {loading ? (
        <div>로딩 중...</div>
      ) : error ? (
        <div className="text-red-500">오류: {error}</div>
      ) : (
        <table className="w-full bg-white rounded shadow text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 w-8 text-center">
                <input
                  type="checkbox"
                  checked={selected.length === members.length && members.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-2">가입일시</th>
              <th className="p-2">이메일</th>
              <th className="p-2">이름</th>
              <th className="p-2">Provider</th>
              <th className="p-2">ref_site</th>
              <th className="p-2">ref_id</th>
              <th className="p-2">status</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={8} className="text-center p-4">해당 날짜에 가입한 회원이 없습니다.</td></tr>
            ) : (
              members.map(m => (
                <tr key={m.id} className="border-t">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => handleSelect(m.id)}
                    />
                  </td>
                  <td className="p-2">{dayjs(m.created_at).format("YYYY-MM-DD HH:mm:ss")}</td>
                  <td className="p-2">{m.email}</td>
                  <td className="p-2">{m.name || '-'}</td>
                  <td className="p-2">{m.provider}</td>
                  <td className="p-2">{m.ref_site || '-'}</td>
                  <td className="p-2">{m.ref_id || '-'}</td>
                  <td className="p-2">{statusLabel(m.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
} 