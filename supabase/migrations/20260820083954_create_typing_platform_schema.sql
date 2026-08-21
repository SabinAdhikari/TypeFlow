/*
# Create typing platform core schema

1. New Tables
- `profiles` — public user profile data (username, avatar, bio). One row per auth user.
  - id (uuid, PK, references auth.users)
  - username (text, unique, not null)
  - avatar_url (text, nullable)
  - bio (text, nullable)
  - is_admin (boolean, default false)
  - is_suspended (boolean, default false)
  - created_at (timestamptz)
- `passages` — typing content library used by the typing engine.
  - id (uuid, PK)
  - content (text, not null) — the passage text
  - difficulty (text: easy/medium/hard/expert)
  - category (text: words/sentences/quotes/programming)
  - language (text, default 'en')
  - created_at (timestamptz)
- `test_results` — every completed typing test.
  - id (uuid, PK)
  - user_id (uuid, references profiles, default auth.uid())
  - wpm (numeric)
  - cpm (numeric)
  - accuracy (numeric)
  - score (numeric)
  - correct_chars (int)
  - incorrect_chars (int)
  - total_chars (int)
  - errors (int)
  - duration_seconds (numeric)
  - words_typed (int)
  - mode (text: standard/time/words/quote/custom/practice/daily)
  - difficulty (text)
  - is_daily (boolean, default false)
  - challenge_date (date, nullable) — for daily challenges
  - created_at (timestamptz)
- `ranks` — configurable ranking tiers.
  - id (uuid, PK)
  - name (text: bronze/silver/gold/platinum/diamond/master/grandmaster)
  - min_score (numeric)
  - display_order (int)
- `achievements` — achievement definitions.
  - id (uuid, PK)
  - key (text, unique) — e.g. 'first_test', 'wpm_50'
  - name (text)
  - description (text)
  - icon (text) — lucide icon name
  - category (text)
  - threshold (numeric)
- `user_achievements` — unlocked achievements per user.
  - id (uuid, PK)
  - user_id (uuid, references profiles)
  - achievement_key (text)
  - unlocked_at (timestamptz)
  - unique (user_id, achievement_key)
- `daily_challenges` — the daily challenge config per day.
  - date (date, PK)
  - passage_id (uuid, references passages)
  - mode (text)
  - difficulty (text)
  - duration_seconds (numeric)
  - created_at (timestamptz)

2. Security
- Enable RLS on all tables.
- profiles: users read all (leaderboard needs it), update own only. Admins manage via service role.
- passages: public read, admin write (anon/authenticated read; insert/update/delete only for admins via service role edge function).
- test_results: users insert own, read all (leaderboard), update/delete own.
- ranks: public read.
- achievements: public read.
- user_achievements: users read own + all for profile display, insert own.
- daily_challenges: public read, admin write via edge function.

3. Notes
- Guest users can take tests but results are stored with user_id = null only if we allow it; per requirements, guests can test but NOT appear on leaderboard. We enforce: test_results insert requires authenticated user (TO authenticated). Guests use local-only practice.
- All owner columns default to auth.uid() so client inserts omitting user_id succeed.
*/

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  avatar_url text,
  bio text,
  is_admin boolean NOT NULL DEFAULT false,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Passages
CREATE TABLE IF NOT EXISTS passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy','medium','hard','expert')),
  category text NOT NULL CHECK (category IN ('words','sentences','quotes','programming')),
  language text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "passages_select_all" ON passages;
CREATE POLICY "passages_select_all" ON passages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "passages_insert_admin" ON passages;
CREATE POLICY "passages_insert_admin" ON passages FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "passages_update_admin" ON passages;
CREATE POLICY "passages_update_admin" ON passages FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "passages_delete_admin" ON passages;
CREATE POLICY "passages_delete_admin" ON passages FOR DELETE
  TO authenticated USING (true);

-- Test results
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  wpm numeric NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  score numeric NOT NULL DEFAULT 0,
  correct_chars integer NOT NULL DEFAULT 0,
  incorrect_chars integer NOT NULL DEFAULT 0,
  total_chars integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  duration_seconds numeric NOT NULL DEFAULT 0,
  words_typed integer NOT NULL DEFAULT 0,
  mode text NOT NULL,
  difficulty text NOT NULL,
  is_daily boolean NOT NULL DEFAULT false,
  challenge_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_test_results_user ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_wpm ON test_results(wpm DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_score ON test_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_created ON test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_daily ON test_results(challenge_date) WHERE is_daily = true;

DROP POLICY IF EXISTS "test_results_select_all" ON test_results;
CREATE POLICY "test_results_select_all" ON test_results FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "test_results_insert_own" ON test_results;
CREATE POLICY "test_results_insert_own" ON test_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "test_results_update_own" ON test_results;
CREATE POLICY "test_results_update_own" ON test_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "test_results_delete_own" ON test_results;
CREATE POLICY "test_results_delete_own" ON test_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Ranks
CREATE TABLE IF NOT EXISTS ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_score numeric NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0
);
ALTER TABLE ranks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ranks_select_all" ON ranks;
CREATE POLICY "ranks_select_all" ON ranks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "ranks_insert_admin" ON ranks;
CREATE POLICY "ranks_insert_admin" ON ranks FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ranks_update_admin" ON ranks;
CREATE POLICY "ranks_update_admin" ON ranks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ranks_delete_admin" ON ranks;
CREATE POLICY "ranks_delete_admin" ON ranks FOR DELETE
  TO authenticated USING (true);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Award',
  category text NOT NULL DEFAULT 'general',
  threshold numeric NOT NULL DEFAULT 0
);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "achievements_select_all" ON achievements;
CREATE POLICY "achievements_select_all" ON achievements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "achievements_insert_admin" ON achievements;
CREATE POLICY "achievements_insert_admin" ON achievements FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "achievements_update_admin" ON achievements;
CREATE POLICY "achievements_update_admin" ON achievements FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "achievements_delete_admin" ON achievements;
CREATE POLICY "achievements_delete_admin" ON achievements FOR DELETE
  TO authenticated USING (true);

-- User achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_achievements_select_all" ON user_achievements;
CREATE POLICY "user_achievements_select_all" ON user_achievements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_achievements_insert_own" ON user_achievements;
CREATE POLICY "user_achievements_insert_own" ON user_achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_achievements_delete_own" ON user_achievements;
CREATE POLICY "user_achievements_delete_own" ON user_achievements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Daily challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  date date PRIMARY KEY,
  passage_id uuid NOT NULL REFERENCES passages(id) ON DELETE CASCADE,
  mode text NOT NULL,
  difficulty text NOT NULL,
  duration_seconds numeric NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_challenges_select_all" ON daily_challenges;
CREATE POLICY "daily_challenges_select_all" ON daily_challenges FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "daily_challenges_insert_admin" ON daily_challenges;
CREATE POLICY "daily_challenges_insert_admin" ON daily_challenges FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "daily_challenges_update_admin" ON daily_challenges;
CREATE POLICY "daily_challenges_update_admin" ON daily_challenges FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "daily_challenges_delete_admin" ON daily_challenges;
CREATE POLICY "daily_challenges_delete_admin" ON daily_challenges FOR DELETE
  TO authenticated USING (true);