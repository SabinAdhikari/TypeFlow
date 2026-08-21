import { useState, useEffect } from "react";
import { Trophy, Medal, TrendingUp, Users } from "lucide-react";
import { getGlobalLeaderboard, getUserRank } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import type { LeaderboardEntry } from "@/lib/types";
import { getRankForScore, getRankColor } from "@/lib/ranks";

export function LeaderboardPage() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"score" | "wpm" | "accuracy">("score");

  useEffect(() => {
    getGlobalLeaderboard(100).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === "wpm") return b.best_wpm - a.best_wpm;
    if (sortBy === "accuracy") return b.avg_accuracy - a.avg_accuracy;
    return b.best_score - a.best_score;
  });

  const myRank = profile ? sorted.findIndex((e) => e.user_id === profile.id) : -1;

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "from-amber-400 to-amber-600";
    if (rank === 2) return "from-slate-300 to-slate-500";
    if (rank === 3) return "from-orange-400 to-orange-600";
    return "from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-800";
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium mb-3">
          <Trophy className="w-4 h-4" /> Global Leaderboard
        </div>
        <h1 className="text-3xl font-bold mb-2">Top Typists Worldwide</h1>
        <p className="text-slate-500 dark:text-slate-400">Compete with typists from around the globe</p>
      </div>

      {/* Sort tabs */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[
          { key: "score" as const, label: "Score", icon: Trophy },
          { key: "wpm" as const, label: "WPM", icon: TrendingUp },
          { key: "accuracy" as const, label: "Accuracy", icon: Medal },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sortBy === key
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                : "glass-card hover:scale-105"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Your position */}
      {profile && myRank >= 0 && (
        <div className="glass-card p-4 mb-6 flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getMedalColor(myRank + 1)} flex items-center justify-center font-bold text-white`}>
              {myRank + 1}
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Your Position</div>
              <div className="font-semibold">{profile.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-bold font-mono">{sorted[myRank]?.best_wpm}</div>
              <div className="text-xs text-slate-400">WPM</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono">{sorted[myRank]?.avg_accuracy.toFixed(1)}%</div>
              <div className="text-xs text-slate-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono">{sorted[myRank]?.best_score}</div>
              <div className="text-xs text-slate-400">Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1">
                  <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800 mb-2" />
                  <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-semibold mb-2">No results yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Be the first to take a typing test!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs text-slate-400 uppercase tracking-wide">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-right">WPM</div>
            <div className="col-span-2 text-right">Accuracy</div>
            <div className="col-span-2 text-right">Score</div>
            <div className="col-span-1 text-right">Tests</div>
          </div>

          {sorted.map((entry, i) => {
            const rank = getRankForScore(entry.best_score);
            const rankColor = getRankColor(rank.name);
            const isMe = profile?.id === entry.user_id;
            return (
              <div
                key={entry.user_id}
                className={`glass-card p-4 grid grid-cols-2 md:grid-cols-12 gap-4 items-center transition-all hover:scale-[1.01] hover:shadow-lg ${
                  isMe ? "ring-2 ring-brand-500" : ""
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getMedalColor(i + 1)} flex items-center justify-center font-bold text-white shrink-0`}>
                    {i + 1}
                  </div>
                </div>

                {/* User */}
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar username={entry.username} avatarUrl={entry.avatar_url} size="md" />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{entry.username}</div>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${rankColor.bg} ${rankColor.text}`}>
                      {rank.name}
                    </span>
                  </div>
                </div>

                {/* WPM */}
                <div className="col-span-2 text-right">
                  <div className="font-bold font-mono text-lg">{entry.best_wpm}</div>
                  <div className="text-xs text-slate-400 md:hidden">WPM</div>
                </div>

                {/* Accuracy */}
                <div className="col-span-2 text-right">
                  <div className="font-bold font-mono">{entry.avg_accuracy.toFixed(1)}%</div>
                  <div className="text-xs text-slate-400 md:hidden">Accuracy</div>
                </div>

                {/* Score */}
                <div className="col-span-2 text-right">
                  <div className="font-bold font-mono text-lg text-amber-500">{entry.best_score}</div>
                  <div className="text-xs text-slate-400 md:hidden">Score</div>
                </div>

                {/* Tests */}
                <div className="col-span-1 text-right text-sm text-slate-500 dark:text-slate-400 hidden md:block">
                  {entry.total_tests}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
