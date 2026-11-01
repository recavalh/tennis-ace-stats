BEGIN;
CREATE SCHEMA IF NOT EXISTS ace_game;
REVOKE ALL ON SCHEMA ace_game FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS ace_game.profiles (
  id uuid PRIMARY KEY,
  token text UNIQUE NOT NULL,
  body text NOT NULL,
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS ace_game.points (
  id text PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES ace_game.profiles(id) ON DELETE CASCADE,
  scenario text,
  mode text NOT NULL CHECK (mode IN ('academy','computer','duel')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ace_game.matches (
  id uuid NOT NULL,
  profile_id uuid NOT NULL REFERENCES ace_game.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, profile_id)
);
CREATE TABLE IF NOT EXISTS ace_game.events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id uuid NOT NULL,
  kind text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS points_profile_created_idx ON ace_game.points(profile_id,created_at DESC);
CREATE INDEX IF NOT EXISTS matches_profile_created_idx ON ace_game.matches(profile_id,created_at DESC);
ALTER TABLE ace_game.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_game.points ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_game.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ace_game.events ENABLE ROW LEVEL SECURITY;
-- Only the trusted game server accesses this private schema via DATABASE_URL.
-- Browser clients receive no table grants, no service key, and no direct writes.
REVOKE ALL ON ALL TABLES IN SCHEMA ace_game FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ace_game FROM PUBLIC, anon, authenticated;
COMMIT;
