DROP POLICY IF EXISTS "letters_delete" ON letters;
DROP POLICY IF EXISTS "letters_update" ON letters;
DROP POLICY IF EXISTS "replies_delete" ON replies;
DROP POLICY IF EXISTS "replies_update" ON replies;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "likes_delete" ON letter_likes;
DROP POLICY IF EXISTS "daily_delete" ON daily_letters;
DROP POLICY IF EXISTS "matches_delete" ON matches;
DROP POLICY IF EXISTS "matches_select" ON matches;
DROP POLICY IF EXISTS "matches_insert" ON matches;

CREATE POLICY "letters_delete" ON letters FOR DELETE USING (true);
CREATE POLICY "letters_update" ON letters FOR UPDATE USING (true);
CREATE POLICY "replies_delete" ON replies FOR DELETE USING (true);
CREATE POLICY "replies_update" ON replies FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (true);
CREATE POLICY "likes_delete" ON letter_likes FOR DELETE USING (true);
CREATE POLICY "daily_delete" ON daily_letters FOR DELETE USING (true);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_delete" ON matches FOR DELETE USING (true);
CREATE POLICY "matches_select" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (true);
