import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { title, content } = await request.json();
  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용을 입력하세요.' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ member_id: session.user.id, title, content }]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
} 