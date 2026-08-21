export type Difficulty = "easy" | "medium" | "hard" | "expert";
export type TestMode = "standard" | "time" | "words" | "quote" | "custom" | "practice" | "daily";
export type PassageCategory = "words" | "sentences" | "quotes" | "programming";

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
  is_suspended: boolean;
  created_at: string;
}

export interface TestResult {
  id: string;
  user_id: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  score: number;
  correct_chars: number;
  incorrect_chars: number;
  total_chars: number;
  errors: number;
  duration_seconds: number;
  words_typed: number;
  mode: string;
  difficulty: string;
  is_daily: boolean;
  challenge_date: string | null;
  created_at: string;
}

export interface Rank {
  id: string;
  name: string;
  min_score: number;
  display_order: number;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  threshold: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export interface DailyChallenge {
  date: string;
  passage_id: string;
  mode: string;
  difficulty: string;
  duration_seconds: number;
  created_at: string;
}

export interface Passage {
  id: string;
  content: string;
  difficulty: Difficulty;
  category: PassageCategory;
  language: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  best_wpm: number;
  avg_accuracy: number;
  best_score: number;
  total_tests: number;
}

export interface TypingStats {
  bestWpm: number;
  avgWpm: number;
  bestAccuracy: number;
  avgAccuracy: number;
  totalTests: number;
  totalWords: number;
  totalChars: number;
  totalTime: number;
  currentStreak: number;
  longestStreak: number;
}
