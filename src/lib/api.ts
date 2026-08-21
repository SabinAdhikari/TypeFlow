import { supabase, EDGE_FUNCTION_URL } from "./supabase";
import type { TestResult, LeaderboardEntry, TypingStats, Profile, Rank, Achievement, UserAchievement } from "./types";
import type { TypingEngineResult } from "./useTypingEngine";

export async function submitScore(
  result: TypingEngineResult,
  mode: string,
  difficulty: string,
  isDaily: boolean,
  challengeDate: string | null,
  rawText: string,
  sessionToken: string
): Promise<{ success: boolean; error?: string; result?: TestResult }> {
  const response = await fetch(`${EDGE_FUNCTION_URL}/submit-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      wpm: result.wpm,
      cpm: result.cpm,
      accuracy: result.accuracy,
      score: result.score,
      correct_chars: result.correctChars,
      incorrect_chars: result.incorrectChars,
      total_chars: result.totalChars,
      errors: result.errors,
      duration_seconds: result.durationSeconds,
      words_typed: result.wordsTyped,
      mode,
      difficulty,
      is_daily: isDaily,
      challenge_date: challengeDate,
      raw_text: rawText,
      typed_text: result.typedText,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error || "Submission failed" };
  }
  return { success: true, result: data.result };
}

export async function getGlobalLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("test_results")
    .select(`
      user_id,
      wpm,
      accuracy,
      score,
      profiles!inner(username, avatar_url)
    `)
    .not("user_id", "is", null);

  if (error || !data) return [];

  // Aggregate client-side
  const userMap = new Map<string, LeaderboardEntry>();
  for (const row of data) {
    const userId = row.user_id;
    const profile = row.profiles as any;
    if (!profile) continue;
    const existing = userMap.get(userId);
    if (existing) {
      existing.best_wpm = Math.max(existing.best_wpm, Number(row.wpm));
      existing.best_score = Math.max(existing.best_score, Number(row.score));
      existing.total_tests += 1;
      existing.avg_accuracy = (existing.avg_accuracy * (existing.total_tests - 1) + Number(row.accuracy)) / existing.total_tests;
    } else {
      userMap.set(userId, {
        user_id: userId,
        username: profile.username,
        avatar_url: profile.avatar_url,
        best_wpm: Number(row.wpm),
        avg_accuracy: Number(row.accuracy),
        best_score: Number(row.score),
        total_tests: 1,
      });
    }
  }

  return Array.from(userMap.values())
    .sort((a, b) => b.best_score - a.best_score)
    .slice(0, limit);
}

export async function getUserStats(userId: string): Promise<TypingStats | null> {
  const { data, error } = await supabase
    .from("test_results")
    .select("wpm, accuracy, duration_seconds, words_typed, total_chars, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return null;

  const wpms = data.map((d) => Number(d.wpm));
  const accuracies = data.map((d) => Number(d.accuracy));
  const totalWords = data.reduce((s, d) => s + Number(d.words_typed), 0);
  const totalChars = data.reduce((s, d) => s + Number(d.total_chars), 0);
  const totalTime = data.reduce((s, d) => s + Number(d.duration_seconds), 0);

  // Calculate streak
  const dates = [...new Set(data.map((d) => new Date(d.created_at).toDateString()))];
  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let currentStreak = 0;
  let longestStreak = 0;
  let today = new Date();
  for (const d of dates) {
    const diff = Math.floor((today.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === currentStreak) {
      currentStreak++;
    } else if (diff > currentStreak) {
      break;
    }
  }
  // Calculate longest streak
  let streak = 0;
  let prevDate: Date | null = null;
  for (const d of dates.reverse()) {
    if (prevDate) {
      const diff = Math.floor((new Date(d).getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        streak++;
      } else {
        longestStreak = Math.max(longestStreak, streak);
        streak = 1;
      }
    } else {
      streak = 1;
    }
    prevDate = new Date(d);
  }
  longestStreak = Math.max(longestStreak, streak, currentStreak);

  return {
    bestWpm: Math.max(...wpms),
    avgWpm: Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length),
    bestAccuracy: Math.max(...accuracies),
    avgAccuracy: Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length * 10) / 10,
    totalTests: data.length,
    totalWords,
    totalChars,
    totalTime: Math.round(totalTime),
    currentStreak,
    longestStreak,
  };
}

export async function getUserTestHistory(userId: string, limit = 50): Promise<TestResult[]> {
  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as TestResult[];
}

export async function getWpmProgression(userId: string, limit = 50): Promise<{ date: string; wpm: number; accuracy: number }[]> {
  const { data, error } = await supabase
    .from("test_results")
    .select("created_at, wpm, accuracy")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data.map((d) => ({
    date: d.created_at,
    wpm: Number(d.wpm),
    accuracy: Number(d.accuracy),
  }));
}

export async function getRanks(): Promise<Rank[]> {
  const { data, error } = await supabase.from("ranks").select("*").order("min_score", { ascending: true });
  if (error || !data) return [];
  return data as Rank[];
}

export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase.from("achievements").select("*").order("category", { ascending: true });
  if (error || !data) return [];
  return data as Achievement[];
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });
  if (error || !data) return [];
  return data as UserAchievement[];
}

export async function getDailyLeaderboard(challengeDate: string): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("test_results")
    .select(`
      user_id,
      wpm,
      accuracy,
      score,
      profiles!inner(username, avatar_url)
    `)
    .eq("is_daily", true)
    .eq("challenge_date", challengeDate);

  if (error || !data) return [];

  const userMap = new Map<string, LeaderboardEntry>();
  for (const row of data) {
    const userId = row.user_id;
    const profile = row.profiles as any;
    if (!profile) continue;
    const existing = userMap.get(userId);
    if (existing) {
      if (Number(row.wpm) > existing.best_wpm) {
        existing.best_wpm = Number(row.wpm);
        existing.best_score = Number(row.score);
        existing.avg_accuracy = Number(row.accuracy);
      }
    } else {
      userMap.set(userId, {
        user_id: userId,
        username: profile.username,
        avatar_url: profile.avatar_url,
        best_wpm: Number(row.wpm),
        avg_accuracy: Number(row.accuracy),
        best_score: Number(row.score),
        total_tests: 1,
      });
    }
  }

  return Array.from(userMap.values())
    .sort((a, b) => b.best_wpm - a.best_wpm);
}

export async function getDailyChallenge() {
  const response = await fetch(`${EDGE_FUNCTION_URL}/generate-daily-challenge`, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
  });
  const data = await response.json();
  if (!response.ok) return null;
  return data;
}

export async function getUserRank(userId: string, leaderboard: LeaderboardEntry[]): Promise<{ rank: number; percentile: number }> {
  const idx = leaderboard.findIndex((e) => e.user_id === userId);
  if (idx === -1) return { rank: 0, percentile: 0 };
  return {
    rank: idx + 1,
    percentile: Math.round((1 - (idx + 1) / leaderboard.length) * 100),
  };
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as Profile[];
}

export async function getPassages() {
  const { data, error } = await supabase.from("passages").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}
