import { useState, useEffect } from "react";
import { Award, Lock } from "lucide-react";
import { getAchievements, getUserAchievements, getUserStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { DynamicIcon } from "@/components/DynamicIcon";
import type { Achievement, UserAchievement, TypingStats } from "@/lib/types";

export function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [stats, setStats] = useState<TypingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements().then((ach) => {
      setAchievements(ach);
      if (user) {
        Promise.all([
          getUserAchievements(user.id),
          getUserStats(user.id),
        ]).then(([u, s]) => {
          setUnlocked(u);
          setStats(s);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [user]);

  const unlockedKeys = new Set(unlocked.map((u) => u.achievement_key));
  const unlockedCount = achievements.filter((a) => unlockedKeys.has(a.key)).length;

  // Group by category
  const categories = [...new Set(achievements.map((a) => a.category))];
  const categoryLabels: Record<string, string> = {
    speed: "Speed",
    accuracy: "Accuracy",
    volume: "Volume",
    time: "Time",
    streak: "Streaks",
    rank: "Ranking",
    daily: "Daily Challenges",
    general: "General",
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-6 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Achievements</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {user ? `${unlockedCount} of ${achievements.length} unlocked` : "Sign in to track your achievements"}
        </p>
      </div>

      {/* Progress bar */}
      {user && achievements.length > 0 && (
        <div className="glass-card p-4 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-slate-400">{Math.round((unlockedCount / achievements.length) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {categories.map((cat) => {
        const catAchievements = achievements.filter((a) => a.category === cat);
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{categoryLabels[cat] || cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {catAchievements.map((ach) => {
                const isUnlocked = unlockedKeys.has(ach.key);
                return (
                  <div
                    key={ach.id}
                    className={`glass-card p-5 transition-all duration-300 ${
                      isUnlocked
                        ? "hover:scale-[1.02] hover:shadow-xl ring-1 ring-amber-500/20"
                        : "opacity-60 grayscale"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isUnlocked
                          ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                      }`}>
                        {isUnlocked ? <DynamicIcon name={ach.icon} className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold">{ach.name}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{ach.description}</div>
                        {isUnlocked && (
                          <div className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Unlocked
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
