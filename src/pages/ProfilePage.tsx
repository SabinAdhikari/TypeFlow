import { useState, useEffect } from "react";
import { User, Trophy, Zap, Target, Hash, Clock, Flame, Award, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getUserStats, getUserAchievements, getAchievements, getGlobalLeaderboard } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { DynamicIcon } from "@/components/DynamicIcon";
import { getRankForScore, getRankColor, getNextRank } from "@/lib/ranks";
import type { TypingStats, Achievement, UserAchievement, LeaderboardEntry } from "@/lib/types";

export function ProfilePage() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      getUserStats(user.id),
      getAchievements(),
      getUserAchievements(user.id),
      getGlobalLeaderboard(200),
    ]).then(([s, a, u, lb]) => {
      setStats(s);
      setAchievements(a);
      setUnlocked(u);
      setLeaderboard(lb);
      setLoading(false);
    });
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <User className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-semibold mb-2">Sign in to view your profile</h2>
        <a href="/login" className="btn-primary inline-block mt-4">Sign In</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  const totalScore = stats ? Math.round(stats.bestWpm * Math.pow(stats.avgAccuracy / 100, 2) * 10) : 0;
  const rank = getRankForScore(totalScore);
  const nextRank = getNextRank(totalScore);
  const rankColor = getRankColor(rank.name);
  const myRankIdx = leaderboard.findIndex((e) => e.user_id === profile.id);
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : 0;
  const percentile = myRank > 0 && leaderboard.length > 0 ? Math.round((1 - myRank / leaderboard.length) * 100) : 0;

  const unlockedKeys = new Set(unlocked.map((u) => u.achievement_key));
  const unlockedAchievements = achievements.filter((a) => unlockedKeys.has(a.key));

  const statItems = stats ? [
    { label: "Best WPM", value: stats.bestWpm, icon: Zap, color: "text-brand-500" },
    { label: "Average WPM", value: stats.avgWpm, icon: TrendingUp, color: "text-slate-700 dark:text-slate-300" },
    { label: "Best Accuracy", value: `${stats.bestAccuracy}%`, icon: Target, color: "text-emerald-500" },
    { label: "Total Tests", value: stats.totalTests, icon: Hash, color: "text-amber-500" },
    { label: "Total Time", value: formatTime(stats.totalTime), icon: Clock, color: "text-slate-600 dark:text-slate-400" },
    { label: "Current Streak", value: `${stats.currentStreak}d`, icon: Flame, color: "text-orange-500" },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Profile header */}
      <div className="glass-card p-6 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar username={profile.username} avatarUrl={profile.avatar_url} size="xl" />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold">{profile.username}</h1>
            {profile.bio && <p className="text-slate-500 dark:text-slate-400 mt-1">{profile.bio}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-3 justify-center sm:justify-start">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${rankColor.bg} ${rankColor.text}`}>
                <Trophy className="w-4 h-4" /> {rank.name}
              </span>
              {myRank > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-brand-500/10 text-brand-500">
                  <TrendingUp className="w-4 h-4" /> Rank #{myRank}
                </span>
              )}
              {profile.is_admin && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-rose-500/10 text-rose-500">
                  Admin
                </span>
              )}
            </div>
          </div>
          <a href="/settings" className="btn-outline text-sm">Edit Profile</a>
        </div>
      </div>

      {/* Rank progress */}
      <div className={`glass-card p-5 mb-6 ${rankColor.bg} border ${rankColor.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">Current Tier</div>
            <div className={`text-xl font-bold ${rankColor.text}`}>{rank.name}</div>
          </div>
          {nextRank ? (
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Next Tier</div>
              <div className="text-sm font-medium">{nextRank.name}</div>
              <div className="text-xs text-slate-400">{nextRank.min_score - totalScore} points to go</div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wide">Status</div>
              <div className="text-sm font-medium">Highest tier reached</div>
            </div>
          )}
        </div>
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${rankColor.gradient} rounded-full transition-all duration-500`}
            style={{
              width: nextRank
                ? `${((totalScore - rank.min_score) / (nextRank.min_score - rank.min_score)) * 100}%`
                : "100%",
            }}
          />
        </div>
      </div>

      {/* Position summary */}
      {myRank > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-brand-500">#{myRank}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Global Rank</div>
          </div>
          <div className="stat-card text-center">
            <div className="text-2xl font-bold text-emerald-500">{percentile}%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Percentile</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {statItems.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold font-mono tabular-nums ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Unlocked Achievements
            <span className="text-sm text-slate-400">({unlockedAchievements.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {unlockedAchievements.map((ach) => (
              <div key={ach.id} className="flex flex-col items-center text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-2">
                  <DynamicIcon name={ach.icon} className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-medium">{ach.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!stats && (
        <div className="glass-card p-8 text-center">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
          <h3 className="font-semibold mb-1">No tests yet</h3>
          <p className="text-sm text-slate-500 mb-4">Take your first typing test to start building your profile!</p>
          <a href="/" className="btn-primary inline-block">Take a Test</a>
        </div>
      )}
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
