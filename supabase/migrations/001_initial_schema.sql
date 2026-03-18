-- deadletter — Initial Schema
-- "보내지 못한 편지" 익명 편지 교환 플랫폼

-- 카테고리 enum
CREATE TYPE letter_category AS ENUM (
  'ex_lover',       -- 전 연인에게
  'parent',         -- 부모님에게
  'child',          -- 자녀에게
  'friend',         -- 친구에게
  'younger_self',   -- 과거의 나에게
  'future_self',    -- 미래의 나에게
  'deceased',       -- 떠난 사람에게
  'someone_who_hurt', -- 나를 아프게 한 사람에게
  'mentor',         -- 은사님에게
  'stranger',       -- 모르는 누군가에게
  'other'           -- 기타
);

-- 감정 enum
CREATE TYPE letter_emotion AS ENUM (
  'regret',         -- 후회
  'gratitude',      -- 감사
  'anger',          -- 분노
  'longing',        -- 그리움
  'forgiveness',    -- 용서
  'confession',     -- 고백
  'grief',          -- 슬픔
  'hope',           -- 희망
  'apology',        -- 사과
  'love'            -- 사랑
);

-- 사용자 (익명, 기기 기반 UUID)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_premium BOOLEAN DEFAULT false,
  premium_until TIMESTAMPTZ,
  letters_written INT DEFAULT 0,
  letters_received INT DEFAULT 0,
  daily_count INT DEFAULT 0,
  daily_date DATE DEFAULT CURRENT_DATE
);

-- 편지
CREATE TABLE letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_number SERIAL,
  author_id UUID REFERENCES profiles(id),
  recipient_label TEXT NOT NULL,         -- "3년 전 헤어진 너에게"
  category letter_category NOT NULL,
  emotion letter_emotion NOT NULL,
  body TEXT NOT NULL,
  language TEXT DEFAULT 'ko',
  is_published BOOLEAN DEFAULT true,
  is_crisis BOOLEAN DEFAULT false,
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  matched_letter_id UUID,                -- 매칭된 편지
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 대리 답장
CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id UUID REFERENCES letters(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  body TEXT NOT NULL,
  likes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 편지 매칭 기록
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_a UUID REFERENCES letters(id),
  letter_b UUID REFERENCES letters(id),
  match_reason TEXT,
  matched_at TIMESTAMPTZ DEFAULT now()
);

-- 하루 한 통 배정
CREATE TABLE daily_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  letter_id UUID REFERENCES letters(id),
  assigned_date DATE DEFAULT CURRENT_DATE,
  is_read BOOLEAN DEFAULT false,
  UNIQUE(user_id, assigned_date)
);

-- 좋아요 추적
CREATE TABLE letter_likes (
  user_id UUID REFERENCES profiles(id),
  letter_id UUID REFERENCES letters(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, letter_id)
);

-- 인덱스
CREATE INDEX idx_letters_published ON letters(is_published, created_at DESC);
CREATE INDEX idx_letters_category ON letters(category, emotion);
CREATE INDEX idx_letters_author ON letters(author_id);
CREATE INDEX idx_replies_letter ON replies(letter_id, created_at);
CREATE INDEX idx_daily_user_date ON daily_letters(user_id, assigned_date);

-- letter_number를 DL-XXXX 포맷으로 반환하는 함수
CREATE OR REPLACE FUNCTION letter_display_id(num INT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'DL-' || LPAD(num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RLS (Row Level Security)
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE letter_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_letters ENABLE ROW LEVEL SECURITY;

-- 편지: 누구나 게시된 편지를 읽을 수 있음
CREATE POLICY "letters_select" ON letters FOR SELECT USING (is_published = true);
CREATE POLICY "letters_insert" ON letters FOR INSERT WITH CHECK (true);

-- 답장: 누구나 읽기, 인증된 사용자만 작성
CREATE POLICY "replies_select" ON replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON replies FOR INSERT WITH CHECK (true);

-- 프로필: 자기 프로필만 수정
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid());

-- 좋아요
CREATE POLICY "likes_select" ON letter_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON letter_likes FOR INSERT WITH CHECK (true);

-- 하루 한 통
CREATE POLICY "daily_select" ON daily_letters FOR SELECT USING (true);
CREATE POLICY "daily_insert" ON daily_letters FOR INSERT WITH CHECK (true);
