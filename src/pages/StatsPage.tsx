import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Target, Clock, Hash, Flame, Award, Zap } from "lucide-react";
import { getUserStats, getUserTestHistory, getWpmProgression } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TypingStats, TestResult } from "@/lib/types";
import { WpmChart } from "@/components/WpmChart";

export function StatsPage() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [history, setHistory] = useState<TestResult[]>([]);
  const [progression, setProgression] = useState<{ date: string; wpm: number; accuracy: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "wpm" | "accuracy">("date");
  const [filterMode, setFilterMode] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      getUserStats(user.id),
      getUserTestHistory(user.id, 50),
      getWpmProgression(user.id, 50),
    ]).then(([s, h, p]) => {
      setStats(s);
      setHistory(h);
      setProgression(p);
      setLoading(false);
    });
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your statistics</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Track your progress, see your history, and climb the ranks.</p>
        <a href="/login" className="btn-primary inline-block">Sign In</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800 mb-3" />
            <div className="h-4 w-60 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-semibold mb-2">No tests yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Take your first typing test to start tracking your progress!</p>
        <a href="/" className="btn-primary inline-block">Take a Test</a>
      </div>
    );
  }

  const statCards = [
    { label: "Best WPM", value: stats.bestWpm, icon: Zap, color: "text-brand-500" },
    { label: "Average WPM", value: stats.avgWpm, icon: TrendingUp, color: "text-slate-700 dark:text-slate-300" },
    { label: "Best Accuracy", value: `${stats.bestAccuracy}%`, icon: Target, color: "text-emerald-500" },
    { label: "Average Accuracy", value: `${stats.avgAccuracy}%`, icon: Target, color: "text-slate-600 dark:text-slate-400" },
    { label: "Total Tests", value: stats.totalTests, icon: Hash, color: "text-amber-500" },
    { label: "Total Words", value: stats.totalWords.toLocaleString(), icon: Hash, color: "text-slate-600 dark:text-slate-400" },
    { label: "Total Time", value: formatTime(stats.totalTime), icon: Clock, color: "text-slate-600 dark:text-slate-400" },
    { label: "Current Streak", value: `${stats.currentStreak} days`, icon: Flame, color: "text-orange-500" },
  ];

  const filteredHistory = history
    .filter((h) => filterMode === "all" || h.mode === filterMode)
    .sort((a, b) => {
      if (sortBy === "wpm") return Number(b.wpm) - Number(a.wpm);
      if (sortBy === "accuracy") return Number(b.accuracy) - Number(a.accuracy);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Statistics</h1>
        <p className="text-slate-500 dark:text-slate-400">Track your typing progress over time</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className={`text-2xl font-bold font-mono tabular-nums ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Longest streak */}
      <div className="glass-card p-4 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Longest Streak</div>
          <div className="text-lg font-bold">{stats.longestStreak} days</div>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          Current: <span className="font-bold text-orange-500">{stats.currentStreak} days</span>
        </div>
      </div>

      {/* WPM Progression Chart */}
      {progression.length > 1 && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-500" /> WPM Progression
          </h2>
          <WpmChart data={progression} />
        </div>
      )}

      {/* Test History */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Test History
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 outline-none"
            >
              <option value="all">All Modes</option>
              <option value="standard">Standard</option>
              <option value="time">Time</option>
              <option value="words">Words</option>
              <option value="quote">Quote</option>
              <option value="custom">Custom</option>
              <option value="practice">Practice</option>
              <option value="daily">Daily</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm border border-slate-200 dark:border-slate-700 outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="wpm">Sort by WPM</option>
              <option value="accuracy">Sort by Accuracy</option>
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No tests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-right py-2 px-2">WPM</th>
                  <th className="text-right py-2 px-2 hidden sm:table-cell">CPM</th>
                  <th className="text-right py-2 px-2">Accuracy</th>
                  <th className="text-right py-2 px-2 hidden sm:table-cell">Score</th>
                  <th className="text-right py-2 px-2 hidden md:table-cell">Duration</th>
                  <th className="text-right py-2 px-2">Mode</th>
                  <th className="text-right py-2 px-2 hidden md:table-cell">Difficulty</th>
                  <th className="text-right py-2 px-2 hidden lg:table-cell">Errors</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((test) => (
                  <tr key={test.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-2 text-slate-500">{new Date(test.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                    <td className="py-2 px-2 text-right font-bold font-mono text-brand-500">{test.wpm}</td>
                    <td className="py-2 px-2 text-right font-mono hidden sm:table-cell">{test.cpm}</td>
                    <td className="py-2 px-2 text-right font-mono">{Number(test.accuracy).toFixed(1)}%</td>
                    <td className="py-2 px-2 text-right font-mono text-amber-500 hidden sm:table-cell">{test.score}</td>
                    <td className="py-2 px-2 text-right text-slate-500 hidden md:table-cell">{test.duration_seconds}s</td>
                    <td className="py-2 px-2 text-right capitalize">{test.mode}</td>
                    <td className="py-2 px-2 text-right capitalize hidden md:table-cell">{test.difficulty}</td>
                    <td className="py-2 px-2 text-right text-rose-400 hidden lg:table-cell">{test.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
