'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { HelpCircle, ArrowLeft, FileText, User, MessageSquare } from 'lucide-react';

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
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </button>
        </div>

        {/* 헤더 영역 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">후기 작성</h1>
          </div>
          <p className="text-gray-600 text-sm">
            여러분의 OPIC 학습 이야기를 들려주세요! 다른 분들도 도움이 될 거예요 😊
          </p>
        </div>

        {/* 작성 폼 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 닉네임 섹션 */}
            {needsNickname && (
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    닉네임 *
                    <div className="relative group">
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-pointer" />
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 px-3 py-2 bg-white text-black text-xs rounded border border-gray-300 shadow-lg opacity-0 group-hover:opacity-100 z-20 whitespace-pre-line pointer-events-none">
                        사이트 내에서 작성한 글들에 대해
작성자 노출시 사용하게 되는 항목입니다.
                      </div>
                    </div>
                  </label>
                </div>
                <input
                  type="text"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="닉네임을 입력하세요"
                  required
                  maxLength={30}
                />
                <p className="text-xs text-gray-500 mt-1">최대 30자까지 입력 가능합니다.</p>
              </div>
            )}

            {/* 제목 섹션 */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">제목 *</label>
              </div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="후기 제목을 입력하세요 (예: OPIC 학습 후기, 시험 준비 팁 등)"
                required
                maxLength={100}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">어떤 내용인지 한눈에 알 수 있게 작성해주세요 ✨</p>
                <span className="text-xs text-gray-400 ml-4">{title.length}/100</span>
              </div>
            </div>

            {/* 내용 섹션 */}
            <div className="pb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">내용 *</label>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="OPIC 학습 경험을 자세히 작성해주세요.&#10;&#10;예시:&#10;- 어떤 방식으로 학습했는지&#10;- 어려웠던 부분과 해결 방법&#10;- 시험 준비 팁이나 조언&#10;- 실제 시험 경험 등"
                required
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">여러분만의 특별한 경험과 팁을 자유롭게 공유해주세요 💡</p>
                <span className="text-xs text-gray-400 ml-4">{content.length}/2000</span>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/reviews')}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '등록 중...' : '후기 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 