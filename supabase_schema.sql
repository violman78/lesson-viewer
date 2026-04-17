-- Supabase 'lessons' 테이블 스키마 재정의 (AI Lesson Coach 구조 반영)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.lessons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    share_token TEXT UNIQUE NOT NULL,       -- 학부모 공유용 고유 해시 토큰
    student_id TEXT,                        -- 내부 식별용 학생 ID
    student_name TEXT NOT NULL,             -- 학생 식별 이름 ("예: 김민준")
    instrument TEXT,                        -- 악기 ("예: 바이올린", "피아노")
    book_unit TEXT,                         -- 교재/단원 ("예: 스즈키 3권")
    piece_title TEXT,                       -- 별도 곡명 ("예: 가보트")
    lesson_date DATE NOT NULL,              -- 실제 레슨 진행 일자
    
    -- JSONB 데이터를 활용하여 다중 파일 및 구조화된 피드백을 유연하게 저장
    materials JSONB DEFAULT '[]'::jsonb,    
    -- 구조: [{"type": "score", "url": "https...", "title": "악보"}, {"type": "student_video", "url": "..."}]
    
    observation_memo TEXT,                  -- 순수 강사용 관찰 보관 기록 (private)
    ai_reference_memo TEXT,                 -- AI가 피드백 생성 시 필수로 참고해야 할 지시사항 (분석 소스)
    
    ai_feedback JSONB DEFAULT '{}'::jsonb,  
    -- 구조: {"core": "...", "good": "...", "improve": "...", "comment": "...", "homework": ["...", "..."]}
    
    status TEXT DEFAULT 'draft',            -- 상태값 (draft: 강사 작성/AI 분석 중, published: 공유 완료)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE     -- 링크 무효화 시점 (접근 만료)
);

-- RLS (Row Level Security) 설정이 필요하다면 추가 구성
-- ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public can view valid tokens" ON public.lessons FOR SELECT USING (share_token IS NOT NULL);
