/*
# Seed default ranks, achievements, passages, and profile auto-creation trigger

1. Data
- Insert 7 default ranks: Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster with configurable score thresholds.
- Insert ~20 achievement definitions across speed, accuracy, streak, volume, and rank categories.
- Insert ~40 typing passages across all 4 difficulties and categories (words, sentences, quotes, programming).

2. Functions / Triggers
- `handle_new_user()` trigger function: when a new auth user is created, insert a matching row in profiles with a generated default username. This ensures every signup has a profile for leaderboard display.

3. Security
- The trigger runs as SECURITY DEFINER (system-level) so it can insert into profiles even before RLS policies evaluate.
- RLS already allows authenticated users to update their own profile, so they can change username/avatar after signup.
*/

-- Default ranks
INSERT INTO ranks (name, min_score, display_order) VALUES
  ('Bronze', 0, 1),
  ('Silver', 500, 2),
  ('Gold', 1200, 3),
  ('Platinum', 2500, 4),
  ('Diamond', 4500, 5),
  ('Master', 7000, 6),
  ('Grandmaster', 10000, 7)
ON CONFLICT DO NOTHING;

-- Default achievements
INSERT INTO achievements (key, name, description, icon, category, threshold) VALUES
  ('first_test', 'First Steps', 'Complete your first typing test', 'Flag', 'volume', 1),
  ('wpm_50', 'Getting Fast', 'Reach 50 WPM', 'Gauge', 'speed', 50),
  ('wpm_75', 'Speed Demon', 'Reach 75 WPM', 'Zap', 'speed', 75),
  ('wpm_100', 'Centurion', 'Reach 100 WPM', 'Rocket', 'speed', 100),
  ('wpm_120', 'Lightning Fingers', 'Reach 120 WPM', 'Bolt', 'speed', 120),
  ('wpm_150', 'Hypersonic', 'Reach 150 WPM', 'Wind', 'speed', 150),
  ('acc_99', 'Sharpshooter', 'Achieve 99% accuracy', 'Target', 'accuracy', 99),
  ('acc_100', 'Flawless', 'Achieve 100% accuracy', 'CheckCircle2', 'accuracy', 100),
  ('tests_10', 'Consistent', 'Complete 10 tests', 'Calendar', 'volume', 10),
  ('tests_100', 'Dedicated', 'Complete 100 tests', 'Trophy', 'volume', 100),
  ('time_1h', 'Marathon', 'Type for 1 hour total', 'Clock', 'time', 3600),
  ('time_10h', 'Endurance', 'Type for 10 hours total', 'Hourglass', 'time', 36000),
  ('streak_7', 'Week Warrior', 'Maintain a 7-day streak', 'Flame', 'streak', 7),
  ('streak_30', 'Unstoppable', 'Maintain a 30-day streak', 'Flame', 'streak', 30),
  ('top_100', 'Rising Star', 'Reach the top 100', 'Star', 'rank', 100),
  ('top_10', 'Elite', 'Reach the top 10', 'Medal', 'rank', 10),
  ('rank_1', 'Apex Typist', 'Reach rank #1', 'Crown', 'rank', 1),
  ('daily_1', 'Daily Habit', 'Complete your first daily challenge', 'Sun', 'daily', 1),
  ('daily_7', 'Weekly Challenger', 'Complete 7 daily challenges', 'Sparkles', 'daily', 7),
  ('daily_30', 'Daily Devotee', 'Complete 30 daily challenges', 'Sunrise', 'daily', 30)
ON CONFLICT (key) DO NOTHING;

-- Default passages: easy words
INSERT INTO passages (content, difficulty, category) VALUES
  ('the quick brown fox jumps over the lazy dog near the river bank every morning', 'easy', 'words'),
  ('a young child plays in the park while birds sing in the tall green trees above', 'easy', 'words'),
  ('she walked to the store to buy fresh bread and milk for the family dinner tonight', 'easy', 'words'),
  ('the sun rises in the east and sets in the west bringing light to each new day', 'easy', 'words'),
  ('a small boat floats gently on the calm lake as the wind blows softly through the trees', 'easy', 'sentences'),
  ('the old man sat by the fire and told stories of his youth to the children gathered around', 'easy', 'sentences'),
  ('every morning the birds sing and the flowers open to greet the warm golden sun', 'easy', 'sentences'),
  ('the children laughed and played games in the garden all afternoon until the sun went down', 'easy', 'sentences'),
  ('the only way to do great work is to love what you do and never stop learning', 'easy', 'quotes'),
  ('life is what happens when you are busy making other plans for the future ahead', 'easy', 'quotes')
ON CONFLICT DO NOTHING;

-- Medium passages
INSERT INTO passages (content, difficulty, category) VALUES
  ('The ability to communicate effectively is one of the most valuable skills a person can develop, opening doors to countless opportunities.', 'medium', 'sentences'),
  ('Technology continues to evolve at an unprecedented pace, transforming the way we work, communicate, and interact with the world around us.', 'medium', 'sentences'),
  ('The art of writing requires patience, practice, and a willingness to revise your work until every sentence carries its intended meaning.', 'medium', 'sentences'),
  ('Reading regularly expands your vocabulary, improves your focus, and exposes you to ideas that can change your perspective on life.', 'medium', 'sentences'),
  ('The journey of a thousand miles begins with a single step, and every great achievement starts with the decision to try.', 'medium', 'quotes'),
  ('Success is not final, failure is not fatal: it is the courage to continue that truly counts in the long run.', 'medium', 'quotes'),
  ('In the middle of difficulty lies opportunity, waiting to be discovered by those who are willing to look beyond the surface.', 'medium', 'quotes'),
  ('The best time to plant a tree was twenty years ago; the second best time is right now, today.', 'medium', 'quotes')
ON CONFLICT DO NOTHING;

-- Hard passages
INSERT INTO passages (content, difficulty, category) VALUES
  ('The quantum entanglement phenomenon, first described by Einstein as "spooky action at a distance," occurs when 2 particles become correlated & remain so regardless of separation distance (up to 10^8 meters).', 'hard', 'sentences'),
  ('In 1969, Apollo 11''s lunar module Eagle touched down at 20:17:40 UTC; Armstrong''s famous "one small step" followed at 02:56:15 — watched by ~650M people across 49 countries worldwide!', 'hard', 'sentences'),
  ('The Mariana Trench reaches 10,994m deep; pressure there equals 1,086 atmospheres (15,750 psi) — enough to crush standard submarines. Only 3 manned descents have ever reached the bottom.', 'hard', 'sentences'),
  ('DNA contains ~3 billion base pairs; humans share 98.8% DNA with chimpanzees, 85% with mice, & 60% with bananas. A single gram of DNA can store 215 petabytes (215,000,000,000,000 bytes) of data.', 'hard', 'sentences'),
  ('The Internet, originally ARPANET (1969), connected 4 nodes: UCLA, SRI, UCSB & Utah. By 2023, 5.3B people (66% of humanity) were online — generating 328.77 million terabytes of data daily.', 'hard', 'quotes')
ON CONFLICT DO NOTHING;

-- Expert programming passages
INSERT INTO passages (content, difficulty, category) VALUES
  ('const fetchData = async (url) => { try { const res = await fetch(url); if (!res.ok) throw new Error(`HTTP ${res.status}`); return await res.json(); } catch (e) { console.error(e); return null; } };', 'expert', 'programming'),
  ('function quickSort(arr) { if (arr.length <= 1) return arr; const [pivot, ...rest] = arr; const left = rest.filter(x => x < pivot); const right = rest.filter(x => x >= pivot); return [...quickSort(left), pivot, ...quickSort(right)]; }', 'expert', 'programming'),
  ('import React, { useState, useEffect, useCallback } from "react"; export const useDebounce = (value, delay = 300) => { const [debounced, setDebounced] = useState(value); useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t); }, [value, delay]); return debounced; };', 'expert', 'programming'),
  ('class Node<T> { constructor(public val: T, public next: Node<T> | null = null) {} } class LinkedList<T> { private head: Node<T> | null = null; private size = 0; get length() { return this.size; } add(val: T) { const node = new Node(val); if (!this.head) { this.head = node; } else { let curr = this.head; while (curr.next) curr = curr.next; curr.next = node; } this.size++; } }', 'expert', 'programming'),
  ('SELECT u.id, u.username, COUNT(r.id) AS tests, MAX(r.wpm) AS best_wpm, AVG(r.accuracy)::numeric(5,2) AS avg_acc FROM profiles u LEFT JOIN test_results r ON r.user_id = u.id WHERE r.created_at >= NOW() - INTERVAL ''30 days'' GROUP BY u.id, u.username HAVING COUNT(r.id) > 0 ORDER BY best_wpm DESC LIMIT 100;', 'expert', 'programming'),
  ('docker run -d --name postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=s3cr3t -p 5432:5432 -v $HOME/pgdata:/var/lib/postgresql/data postgres:16-alpine && psql -h localhost -U admin -c "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL);"', 'expert', 'programming')
ON CONFLICT DO NOTHING;

-- Profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();