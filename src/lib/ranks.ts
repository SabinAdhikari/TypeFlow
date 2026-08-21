import type { Rank } from "./types";

export const DEFAULT_RANKS: Rank[] = [
  { id: "1", name: "Bronze", min_score: 0, display_order: 1 },
  { id: "2", name: "Silver", min_score: 500, display_order: 2 },
  { id: "3", name: "Gold", min_score: 1200, display_order: 3 },
  { id: "4", name: "Platinum", min_score: 2500, display_order: 4 },
  { id: "5", name: "Diamond", min_score: 4500, display_order: 5 },
  { id: "6", name: "Master", min_score: 7000, display_order: 6 },
  { id: "7", name: "Grandmaster", min_score: 10000, display_order: 7 },
];

export function getRankForScore(score: number, ranks: Rank[] = DEFAULT_RANKS): Rank {
  const sorted = [...ranks].sort((a, b) => b.min_score - a.min_score);
  for (const rank of sorted) {
    if (score >= rank.min_score) return rank;
  }
  return sorted[sorted.length - 1];
}

export function getNextRank(score: number, ranks: Rank[] = DEFAULT_RANKS): Rank | null {
  const sorted = [...ranks].sort((a, b) => a.min_score - b.min_score);
  for (const rank of sorted) {
    if (score < rank.min_score) return rank;
  }
  return null;
}

export function getRankProgress(score: number, ranks: Rank[] = DEFAULT_RANKS): number {
  const current = getRankForScore(score, ranks);
  const next = getNextRank(score, ranks);
  if (!next) return 100;
  const range = next.min_score - current.min_score;
  if (range <= 0) return 100;
  return Math.min(100, ((score - current.min_score) / range) * 100);
}

export const RANK_COLORS: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  Bronze: { bg: "bg-amber-700/20", text: "text-amber-500", border: "border-amber-600/30", gradient: "from-amber-700 to-amber-900" },
  Silver: { bg: "bg-slate-400/20", text: "text-slate-300", border: "border-slate-400/30", gradient: "from-slate-400 to-slate-600" },
  Gold: { bg: "bg-yellow-500/20", text: "text-yellow-500", border: "border-yellow-500/30", gradient: "from-yellow-400 to-yellow-600" },
  Platinum: { bg: "bg-cyan-400/20", text: "text-cyan-400", border: "border-cyan-400/30", gradient: "from-cyan-300 to-cyan-500" },
  Diamond: { bg: "bg-sky-500/20", text: "text-sky-400", border: "border-sky-500/30", gradient: "from-sky-400 to-blue-600" },
  Master: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/30", gradient: "from-violet-400 to-purple-600" },
  Grandmaster: { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/30", gradient: "from-rose-400 to-red-600" },
};

export function getRankColor(rankName: string) {
  return RANK_COLORS[rankName] || RANK_COLORS.Bronze;
}
