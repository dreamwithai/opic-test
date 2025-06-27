'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { HelpCircle } from 'lucide-react';

export default function ReviewNewPage() {
  const { data: session, status } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [needsNickname, setNeedsNickname] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNickname = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        const { data, error } = await supabase
          .from('members')
          .select('nickname')
          .eq('id', session.user.id)
          .single();
        if (!data?.nickname) {
          setNeedsNickname(true);
        } else {
          setNeedsNickname(false);
          setNickname(data.nickname);
        }
      }
    };
    fetchNickname();
  }, [status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    if (needsNickname && !nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      // 닉네임이 필요한 경우 먼저 저장
      if (needsNickname && session?.user?.id) {
        const { error } = await supabase
          .from('members')
          .update({ nickname })
          .eq('id', session.user.id);
        if (error) throw new Error('닉네임 저장 실패');
      }
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('등록 실패');
      router.push('/reviews');
    } catch (err) {
      alert('후기 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-xl font-bold mb-6">후기 작성</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {needsNickname && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  닉네임 *
                  <div className="relative group">
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 px-3 py-2 bg-white text-black text-xs rounded border border-gray-300 shadow-lg opacity-0 group-hover:opacity-100 z-20 whitespace-pre-line pointer-events-none">
                      사이트 내에서 작성한 글들에 대해
작성자 노출시 사용하게 되는 항목입니다.
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="닉네임을 입력하세요"
                  required
                  maxLength={30}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="후기 제목을 입력하세요"
                required
                maxLength={100}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="후기 내용을 자세히 작성해주세요."
                required
                maxLength={2000}
              />
            </div>
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/reviews')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 