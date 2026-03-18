-- Admin DELETE policies for all tables
-- Access control is enforced at the application level;
-- these permissive policies allow deletes to pass through RLS.

-- Enable RLS on matches (was missing in 001)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- DELETE policies
CREATE POLICY "letters_delete" ON letters FOR DELETE USING (true);
CREATE POLICY "replies_delete" ON replies FOR DELETE USING (true);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (true);
CREATE POLICY "likes_delete" ON letter_likes FOR DELETE USING (true);
CREATE POLICY "daily_delete" ON daily_letters FOR DELETE USING (true);
CREATE POLICY "matches_delete" ON matches FOR DELETE USING (true);

-- Additional SELECT/INSERT policies for matches (also missing in 001)
CREATE POLICY "matches_select" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert" ON matches FOR INSERT WITH CHECK (true);

-- UPDATE policy for replies (allows editing reply body, likes, etc.)
CREATE POLICY "replies_update" ON replies FOR UPDATE USING (true);
