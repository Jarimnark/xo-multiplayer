-- Run this in the Supabase SQL editor to set up the database.

-- 1. Games table — stores the full game state as JSONB
CREATE TABLE IF NOT EXISTS games (
  id      TEXT PRIMARY KEY,
  state   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON games;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Enable Row-Level Security (public demo — allow all for now)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations (demo)" ON games
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Supabase Realtime on the games table
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- 5. Atomic typing-race claim function
--    Only the first caller succeeds; concurrent callers get false.
CREATE OR REPLACE FUNCTION claim_typing_win(
  p_game_id  TEXT,
  p_new_state JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE games
  SET state = p_new_state
  WHERE id = p_game_id
    AND (state -> 'typingRace' ->> 'winner') IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
