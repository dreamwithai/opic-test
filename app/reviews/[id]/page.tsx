"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';

interface Review {
  id: number;
  title: string;
  content: string;
  created_at: string;
  member_id: string;
  member_nickname: string;
}
interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  created_at: string;
  member_id: string;
  member_nickname: string;
  member_profile_image?: string;
  children?: Comment[];
}

export default function ReviewDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [review, setReview] = useState<Review | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyInput, setReplyInput] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [replyActive, setReplyActive] = useState<{ [key: number]: boolean }>({});

  // 리뷰/댓글 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 어뷰징 방지를 위한 조회수 증가 로직
      const incrementViewCount = async () => {
        try {
          // 1. 세션 기반 중복 체크
          const viewedReviews = JSON.parse(localStorage.getItem('viewedReviews') || '{}');
          const now = Date.now();
          const reviewId = String(id);
          
          // 5분(300000ms) 내에 같은 리뷰를 본 경우 조회수 증가 안 함
          if (viewedReviews[reviewId] && (now - viewedReviews[reviewId]) < 300000) {
            return;
          }
          
          // 2. DB에서 중복 체크 (post_views 테이블 활용)
          if (session?.user?.id) {
            const { data: existingView } = await supabase
              .from('post_views')
              .select('id')
              .eq('post_type', 'review')
              .eq('post_id', reviewId)
              .eq('member_id', session.user.id)
              .gte('viewed_at', new Date(now - 300000).toISOString()) // 5분 내
              .single();
            
            if (existingView) {
              return;
            }
          }
          
          // 3. 조회수 증가
          const { data: currentReview } = await supabase
            .from('reviews')
            .select('view_count')
            .eq('id', reviewId)
            .single();
          
          if (currentReview) {
            const newViewCount = (currentReview.view_count || 0) + 1;
            await supabase
              .from('reviews')
              .update({ view_count: newViewCount })
              .eq('id', reviewId);
          }
          
          // 4. 조회 기록 저장
          if (session?.user?.id) {
            await supabase
              .from('post_views')
              .insert({
                post_type: 'review',
                post_id: reviewId,
                member_id: session.user.id,
                viewed_at: new Date().toISOString()
              });
          }
          
          // 5. 세션에 조회 기록 저장
          viewedReviews[reviewId] = now;
          localStorage.setItem('viewedReviews', JSON.stringify(viewedReviews));
          
        } catch (error) {
          // 오류는 남겨둡니다.
          console.error('조회수 증가 중 오류:', error);
        }
      };
      
      // 조회수 증가 실행
      await incrementViewCount();
      
      // 리뷰
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('id, title, content, created_at, member_id, members(nickname)')
        .eq('id', String(id))
        .single();
      if (reviewData) {
        setReview({
          ...reviewData,
          member_nickname:
            Array.isArray((reviewData as any).members)
              ? (reviewData as any).members[0]?.nickname
              : (reviewData as any).members?.nickname,
        });
      }
      // 댓글
      const { data: commentData } = await supabase
        .from('review_comments')
        .select('id, content, parent_id, created_at, member_id, members(nickname, profile_image)')
        .eq('review_id', String(id))
        .order('created_at', { ascending: true });
      if (commentData) {
        // 2depth 트리 변환
        const map: { [id: number]: Comment } = {};
        const roots: Comment[] = [];
        commentData.forEach((c: any) => {
          map[c.id] = { ...c, member_nickname: c.members?.nickname, member_profile_image: c.members?.profile_image, children: [] };
        });
        commentData.forEach((c: any) => {
          if (c.parent_id && map[c.parent_id]) {
            map[c.parent_id].children!.push(map[c.id]);
          } else {
            roots.push(map[c.id]);
          }
        });
        setComments(roots);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, session?.user?.id]);

  // 댓글 등록
  const handleComment = async (parentId: number | null = null) => {
    const content = parentId ? replyInput[parentId] : commentInput;
    if (!content?.trim()) return;
    const params = {
      review_id: id,
      content,
      parent_id: parentId,
      member_id: session?.user?.id,
    };
    const { data, error } = await supabase.from('review_comments').insert(params);
    console.log('insert result', { data, error, params });
    if (error) {
      alert('댓글 등록 실패: ' + error.message);
      return;
    }
    setCommentInput("");
    setReplyInput((prev) => ({ ...prev, [parentId!]: "" }));
    // 새로고침
    const { data: commentData } = await supabase
      .from('review_comments')
      .select('id, content, parent_id, created_at, member_id, members(nickname, profile_image)')
      .eq('review_id', String(id))
      .order('created_at', { ascending: true });
    if (commentData) {
      const map: { [id: number]: Comment } = {};
      const roots: Comment[] = [];
      commentData.forEach((c: any) => {
        map[c.id] = { ...c, member_nickname: c.members?.nickname, member_profile_image: c.members?.profile_image, children: [] };
      });
      commentData.forEach((c: any) => {
        if (c.parent_id && map[c.parent_id]) {
          map[c.parent_id].children!.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });
      setComments(roots);
    }
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;
  if (!review) return <div className="p-8 text-center">리뷰를 찾을 수 없습니다.</div>;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* 상단 네비게이션 */}
      <div className="mb-4 flex items-center gap-2">
        <Link href="/reviews" className="inline-flex items-center text-gray-600 hover:text-blue-600 text-sm font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <h1 className="text-xl font-bold mb-2">{review.title}</h1>
        <div className="text-gray-500 text-sm mb-4">
          작성자: {review.member_nickname || '닉네임 없음'} | {new Date(review.created_at).toLocaleString()}
        </div>
        <div className="text-gray-800 whitespace-pre-line mb-4">{review.content}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold mb-4">댓글</h2>
        {/* 댓글 목록 */}
        <CommentList comments={comments} onReply={handleComment} replyInput={replyInput} setReplyInput={setReplyInput} replyActive={replyActive} setReplyActive={setReplyActive} />
        {/* 댓글 입력 */}
        <CommentInput
          value={commentInput}
          onChange={e => setCommentInput(e.target.value)}
          onSubmit={e => {
            e.preventDefault();
            handleComment(null);
          }}
          disabled={!commentInput.trim()}
        />
      </div>
    </div>
  );
}

function CommentList({ comments, onReply, replyInput, setReplyInput, replyActive, setReplyActive }: {
  comments: Comment[];
  onReply: (parentId: number) => void;
  replyInput: { [key: number]: string };
  setReplyInput: (f: (prev: { [key: number]: string }) => { [key: number]: string }) => void;
  replyActive: { [key: number]: boolean };
  setReplyActive: (f: (prev: { [key: number]: boolean }) => { [key: number]: boolean }) => void;
}) {
  return (
    <ul className="space-y-4">
      {comments.map(comment => (
        <li key={comment.id} className="border-b pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
            <img
              src={comment.member_profile_image || '/default-profile.png'}
              alt="프로필"
              className="w-7 h-7 rounded-full object-cover bg-gray-200"
              onError={e => { e.currentTarget.src = '/default-profile.png'; }}
            />
            {comment.member_nickname || '닉네임 없음'}
          </div>
          <div className="mb-2 text-gray-700 whitespace-pre-line">{comment.content}</div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>{new Date(comment.created_at).toLocaleString()}</span>
            <button
              type="button"
              className="text-xs text-blue-500 hover:underline ml-2"
              onClick={() => setReplyActive(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
            >
              답글쓰기
            </button>
          </div>
          {/* 대댓글 입력 */}
          {replyActive[comment.id] && (
            <div className="flex flex-col gap-2 mb-4 ml-4">
              <div className="flex items-center gap-2">
                <textarea
                  value={replyInput[comment.id] || ''}
                  onChange={e => setReplyInput(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  className="flex-1 resize-none px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 text-sm transition-all min-h-[44px] max-h-32"
                  placeholder="답글을 입력하세요"
                  autoFocus
                  maxLength={200}
                  rows={2}
                />
                <button 
                  onClick={() => onReply(comment.id)} 
                  className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!replyInput[comment.id]?.trim()}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          {/* 2depth 대댓글 */}
          {comment.children && comment.children.length > 0 && (
            <ul className="ml-6 border-l pl-4 space-y-2">
              {comment.children.map(child => (
                <li key={child.id} className="border-b pb-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
                    <img
                      src={child.member_profile_image || '/default-profile.png'}
                      alt="프로필"
                      className="w-7 h-7 rounded-full object-cover bg-gray-200"
                      onError={e => { e.currentTarget.src = '/default-profile.png'; }}
                    />
                    {child.member_nickname || '닉네임 없음'}
                  </div>
                  <div className="mb-1 text-gray-700 whitespace-pre-line">{child.content}</div>
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                    <span>{new Date(child.created_at).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

// 댓글 입력창 컴포넌트 분리 및 모바일 하단 고정 스타일 추가
function CommentInput({ value, onChange, onSubmit, disabled }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  return (
    <form
      className="flex items-center gap-2 mb-4 sm:mb-0 bg-white sm:static fixed bottom-0 left-0 w-full sm:w-auto px-4 py-3 sm:p-0 border-t sm:border-0 z-50"
      style={{ maxWidth: '640px', margin: '0 auto' }}
      onSubmit={onSubmit}
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={onChange}
        rows={2}
        placeholder="댓글을 남겨보세요"
        className="flex-1 resize-none px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 text-sm transition-all min-h-[44px] max-h-32"
        maxLength={200}
        onFocus={() => {
          setTimeout(() => {
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }}
      />
      <button
        type="submit"
        className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
} 