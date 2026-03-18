DROP FUNCTION IF EXISTS admin_delete_letter(UUID);
DROP FUNCTION IF EXISTS admin_delete_reply(UUID);

CREATE OR REPLACE FUNCTION admin_delete_letter(target_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM replies WHERE letter_id = target_id;
  DELETE FROM letter_likes WHERE letter_id = target_id;
  DELETE FROM daily_letters WHERE letter_id = target_id;
  DELETE FROM matches WHERE letter_a = target_id OR letter_b = target_id;
  UPDATE letters SET matched_letter_id = NULL WHERE matched_letter_id = target_id;
  DELETE FROM letters WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_reply(target_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM replies WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
