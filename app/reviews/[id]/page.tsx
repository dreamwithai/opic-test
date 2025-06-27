"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from '@/lib/supabase';

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

  // 리뷰/댓글 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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
        .select('id, content, parent_id, created_at, member_id, members(nickname)')
        .eq('review_id', String(id))
        .order('created_at', { ascending: true });
      if (commentData) {
        // 2depth 트리 변환
        const map: { [id: number]: Comment } = {};
        const roots: Comment[] = [];
        commentData.forEach((c: any) => {
          map[c.id] = { ...c, member_nickname: c.members?.nickname, children: [] };
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
  }, [id]);

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
      .select('id, content, parent_id, created_at, member_id, members(nickname)')
      .eq('review_id', String(id))
      .order('created_at', { ascending: true });
    if (commentData) {
      const map: { [id: number]: Comment } = {};
      const roots: Comment[] = [];
      commentData.forEach((c: any) => {
        map[c.id] = { ...c, member_nickname: c.members?.nickname, children: [] };
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
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <h1 className="text-xl font-bold mb-2">{review.title}</h1>
        <div className="text-gray-500 text-sm mb-4">
          작성자: {review.member_nickname || '닉네임 없음'} | {new Date(review.created_at).toLocaleString()}
        </div>
        <div className="text-gray-800 whitespace-pre-line mb-4">{review.content}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="font-semibold mb-4">댓글</h2>
        {/* 댓글 입력 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={commentInput}
            onChange={e => setCommentInput(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="댓글을 입력하세요"
          />
          <button onClick={() => handleComment(null)} className="px-4 py-2 bg-blue-600 text-white rounded">등록</button>
        </div>
        {/* 댓글 목록 */}
        <CommentList comments={comments} onReply={handleComment} replyInput={replyInput} setReplyInput={setReplyInput} />
      </div>
    </div>
  );
}

function CommentList({ comments, onReply, replyInput, setReplyInput }: {
  comments: Comment[];
  onReply: (parentId: number) => void;
  replyInput: { [key: number]: string };
  setReplyInput: (f: (prev: { [key: number]: string }) => { [key: number]: string }) => void;
}) {
  return (
    <ul className="space-y-4">
      {comments.map(comment => (
        <li key={comment.id} className="border-b pb-2">
          <div className="text-sm text-gray-800 mb-1">{comment.member_nickname || '닉네임 없음'} <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span></div>
          <div className="mb-2 text-gray-700 whitespace-pre-line">{comment.content}</div>
          {/* 대댓글 입력 */}
          <div className="flex gap-2 mb-2 ml-4">
            <input
              type="text"
              value={replyInput[comment.id] || ''}
              onChange={e => setReplyInput(prev => ({ ...prev, [comment.id]: e.target.value }))}
              className="flex-1 px-2 py-1 border rounded text-xs"
              placeholder="답글을 입력하세요"
            />
            <button onClick={() => onReply(comment.id)} className="px-2 py-1 bg-blue-500 text-white rounded text-xs">답글</button>
          </div>
          {/* 2depth 대댓글 */}
          {comment.children && comment.children.length > 0 && (
            <ul className="ml-6 border-l pl-4 space-y-2">
              {comment.children.map(child => (
                <li key={child.id}>
                  <div className="text-xs text-gray-800 mb-1">{child.member_nickname || '닉네임 없음'} <span className="text-[10px] text-gray-400">{new Date(child.created_at).toLocaleString()}</span></div>
                  <div className="mb-1 text-gray-700 whitespace-pre-line text-xs">{child.content}</div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
} 