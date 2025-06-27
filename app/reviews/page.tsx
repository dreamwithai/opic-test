"use client"

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Eye, User, Calendar, MessageCircle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';
import { supabase } from '@/lib/supabase';

function formatDateTime(dateString: string) {
  const d = new Date(dateString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      // reviews + members + 댓글수
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          member:members(email, name, nickname, provider),
          comments:review_comments(count)
        `)
        .order('created_at', { ascending: false });
      if (error) {
        setReviews([]);
      } else {
        setReviews(data || []);
      }
      setLoading(false);
    };
    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: '홈', href: '/' },
            { label: '후기 게시판', href: '/reviews' }
          ]} 
        />
        <div className="bg-white rounded-lg shadow-sm border">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-bold text-gray-900">후기 게시판</h1>
              </div>
              <Link
                href="/reviews/new"
                className="p-2 rounded-full hover:bg-blue-50 text-blue-600"
                title="새 후기 작성"
                aria-label="새 후기 작성"
              >
                <span className="font-bold text-lg">＋</span>
              </Link>
            </div>
            <p className="text-sm text-gray-600 mt-1">서비스를 이용한 후기를 자유롭게 남겨주세요.</p>
          </div>
          {/* 후기 목록 */}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">아직 작성된 후기가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reviews.map((review) => (
                <Link key={review.id} href={`/reviews/${review.id}`} className="block hover:bg-gray-50 transition-colors">
                  <div className="py-4 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-gray-900 truncate max-w-xs">{review.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500 items-center">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {review.member?.name || review.member?.email || review.member?.nickname || review.member?.provider || 'Unknown'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(review.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4 items-center mt-2 sm:mt-0">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Eye className="w-4 h-4" />
                        {review.view_count || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <MessageCircle className="w-4 h-4" />
                        {review.comments?.length ?? 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 