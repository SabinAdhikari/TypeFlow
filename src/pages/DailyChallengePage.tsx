import { useState, useEffect } from "react";
import { Calendar, Clock, Users, Trophy, Flame } from "lucide-react";
import { TypingTest } from "@/components/TypingTest";
import { getDailyChallenge, getDailyLeaderboard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/Avatar";
import type { LeaderboardEntry } from "@/lib/types";

export function DailyChallengePage() {
  const { profile } = useAuth();
  const [challenge, setChallenge] = useState<{ challenge: any; passage: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeUntilTomorrow, setTimeUntilTomorrow] = useState("");

  useEffect(() => {
    getDailyChallenge().then((data) => {
      setChallenge(data);
      setLoading(false);
      if (data?.challenge?.date) {
        getDailyLeaderboard(data.challenge.date).then(setLeaderboard);
      }
    });
  }, []);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilTomorrow(`${h}h ${m}m ${s}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="glass-card p-8 animate-pulse">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 mb-4" />
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="glass-card p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-semibold mb-2">No challenge available</h3>
          <p className="text-slate-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  const myRank = profile ? leaderboard.findIndex((e) => e.user_id === profile.id) : -1;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium mb-3">
          <Flame className="w-4 h-4" /> Daily Challenge
        </div>
        <h1 className="text-3xl font-bold mb-2">Today's Typing Challenge</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Same text for everyone. Can you top the daily leaderboard?
        </p>
      </div>

      {/* Challenge info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card text-center">
          <Calendar className="w-5 h-5 mx-auto mb-2 text-brand-500" />
          <div className="text-xs text-slate-400 uppercase tracking-wide">Date</div>
          <div className="font-semibold">{new Date(challenge.challenge.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
        </div>
        <div className="stat-card text-center">
          <Clock className="w-5 h-5 mx-auto mb-2 text-brand-500" />
          <div className="text-xs text-slate-400 uppercase tracking-wide">Duration</div>
          <div className="font-semibold">{challenge.challenge.duration_seconds}s</div>
        </div>
        <div className="stat-card text-center">
          <Users className="w-5 h-5 mx-auto mb-2 text-brand-500" />
          <div className="text-xs text-slate-400 uppercase tracking-wide">Participants</div>
          <div className="font-semibold">{leaderboard.length}</div>
        </div>
      </div>

      {/* Countdown */}
      <div className="glass-card p-4 mb-8 text-center">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Next Challenge In</div>
        <div className="text-2xl font-bold font-mono text-brand-500">{timeUntilTomorrow}</div>
      </div>

      {/* Typing test */}
      <div className="mb-8">
        <TypingTest
          isDaily
          challengeDate={challenge.challenge.date}
          dailyPassage={challenge.passage.content}
          difficulty={challenge.challenge.difficulty}
          duration={challenge.challenge.duration_seconds}
        />
      </div>

      {/* Daily leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Daily Leaderboard
          </h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 20).map((entry, i) => {
              const isMe = profile?.id === entry.user_id;
              return (
                <div
                  key={entry.user_id}
                  className={`glass-card p-4 flex items-center justify-between transition-all hover:scale-[1.01] ${
                    isMe ? "ring-2 ring-brand-500" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-orange-500 text-white" : "bg-slate-200 dark:bg-slate-800"
                    }`}>
                      {i + 1}
                    </div>
                    <Avatar username={entry.username} avatarUrl={entry.avatar_url} size="sm" />
                    <span className="font-medium">{entry.username}</span>
                    {isMe && <span className="text-xs text-brand-500 font-medium">(You)</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold font-mono">{entry.best_wpm} WPM</span>
                    <span className="text-slate-400">{entry.avg_accuracy.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {myRank >= 0 && (
        <div className="glass-card p-4 mt-4 text-center">
          <div className="text-sm text-slate-500">
            Your daily rank: <span className="font-bold text-brand-500">#{myRank + 1}</span> of {leaderboard.length}
          </div>
        </div>
      )}
    </div>
  );
}
