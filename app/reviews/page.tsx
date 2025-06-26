import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb 
          items={[
            { label: '홈', href: '/' },
            { label: '후기 게시판', href: '/reviews' }
          ]} 
        />
        <div className="max-w-2xl mx-auto">
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
            {/* 후기 목록(빈 상태) */}
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">아직 작성된 후기가 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 