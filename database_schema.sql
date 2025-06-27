-- 게시판 시스템을 위한 테이블 생성

-- 1. 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 0, -- 0: 일반, 1: 중요, 2: 긴급
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Q&A 테이블
CREATE TABLE IF NOT EXISTS faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general', -- general, technical, payment, etc.
    is_published BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 문의사항 테이블
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 문의사항 답변 테이블
CREATE TABLE IF NOT EXISTS inquiry_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 게시글 조회 기록 테이블 (선택사항 - 조회수 중복 방지용)
CREATE TABLE IF NOT EXISTS post_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_type VARCHAR(20) NOT NULL, -- 'notice', 'faq'
    post_id UUID NOT NULL,
    member_id UUID REFERENCES members(id),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_type, post_id, member_id)
);

-- 후기(리뷰) 게시판 테이블
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 후기 댓글/대댓글 테이블
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES review_comments(id) ON DELETE CASCADE, -- NULL이면 댓글, 있으면 대댓글
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notices_priority ON notices(priority DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category, is_published);
CREATE INDEX IF NOT EXISTS idx_faqs_published ON faqs(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_member ON inquiries(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiry_responses_inquiry ON inquiry_responses(inquiry_id, created_at);

-- RLS 정책 설정 (간단한 버전)

-- 1. notices 테이블 RLS 정책
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개된 공지사항 조회 가능
CREATE POLICY "공개 공지사항 조회 가능" ON notices
    FOR SELECT USING (is_published = true);

-- 관리자만 공지사항 작성/수정/삭제 가능
CREATE POLICY "관리자만 공지사항 관리 가능" ON notices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.type = 'admin'
        )
    );

-- 2. faqs 테이블 RLS 정책
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 공개된 FAQ 조회 가능
CREATE POLICY "공개 FAQ 조회 가능" ON faqs
    FOR SELECT USING (is_published = true);

-- 관리자만 FAQ 작성/수정/삭제 가능
CREATE POLICY "관리자만 FAQ 관리 가능" ON faqs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.type = 'admin'
        )
    );

-- 3. inquiries 테이블 RLS 정책
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 문의사항만 접근 가능
CREATE POLICY "본인 문의사항 접근 가능" ON inquiries
    FOR ALL USING (member_id = auth.uid());

-- 관리자는 모든 문의사항 접근 가능
CREATE POLICY "관리자는 모든 문의사항 접근 가능" ON inquiries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.type = 'admin'
        )
    );

-- 4. inquiry_responses 테이블 RLS 정책
ALTER TABLE inquiry_responses ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 문의사항의 답변만 조회 가능
CREATE POLICY "본인 문의사항 답변 조회 가능" ON inquiry_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM inquiries 
            WHERE inquiries.id = inquiry_responses.inquiry_id 
            AND inquiries.member_id = auth.uid()
        )
    );

-- 관리자는 모든 답변 관리 가능
CREATE POLICY "관리자는 모든 답변 관리 가능" ON inquiry_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.type = 'admin'
        )
    );

-- 사용자는 본인 문의사항에 답변 작성 가능 (추가 답변용)
CREATE POLICY "본인 문의사항에 답변 작성 가능" ON inquiry_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM inquiries 
            WHERE inquiries.id = inquiry_responses.inquiry_id 
            AND inquiries.member_id = auth.uid()
        )
    );

-- 추가 보안 정책 (선택사항)

-- 5. 비밀글 보호 정책 (inquiries)
-- 비밀글은 작성자와 관리자만 조회 가능
CREATE POLICY "비밀글은 작성자와 관리자만 조회 가능" ON inquiries
    FOR SELECT USING (
        NOT is_private OR 
        member_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.type = 'admin'
        )
    );

-- 6. 삭제 제한 정책 (선택사항)
-- 사용자는 본인 문의사항을 삭제할 수 없음 (관리자만 삭제 가능)
CREATE POLICY "사용자는 문의사항 삭제 불가" ON inquiries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.type = 'admin'
        )
    );

-- 7. 수정 제한 정책 (선택사항)
-- 사용자는 본인 문의사항을 수정할 수 없음 (관리자만 수정 가능)
CREATE POLICY "사용자는 문의사항 수정 불가" ON inquiries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM members 
            WHERE members.id = auth.uid() 
            AND members.type = 'admin'
        )
    );

-- 8. 조회수 업데이트 정책
-- 공개된 게시물의 조회수는 누구나 업데이트 가능 (하지만 실제로는 서버에서만)
CREATE POLICY "공개 게시물 조회수 업데이트 가능" ON notices
    FOR UPDATE USING (
        is_published = true
    ) WITH CHECK (
        is_published = true
    );

CREATE POLICY "공개 FAQ 조회수 업데이트 가능" ON faqs
    FOR UPDATE USING (
        is_published = true
    ) WITH CHECK (
        is_published = true
    );

-- 기존 reviews 테이블에 view_count 컬럼 추가 (이미 존재하는 경우 무시)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reviews' AND column_name = 'view_count') THEN
        ALTER TABLE reviews ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
END $$; 