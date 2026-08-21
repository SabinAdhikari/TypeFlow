import { RotateCcw, BarChart3, Trophy, Keyboard, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import type { TypingEngineResult } from "@/lib/useTypingEngine";
import type { Difficulty } from "@/lib/types";
import { DIFFICULTY_LABELS, MODE_LABELS } from "@/lib/content";
import { getRankForScore, getRankColor, getNextRank } from "@/lib/ranks";

interface ResultsScreenProps {
  result: TypingEngineResult;
  mode: string;
  difficulty: Difficulty;
  isDaily: boolean;
  submitError: string | null;
  submitting: boolean;
  isLoggedIn: boolean;
  onRetry: () => void;
  onChangeMode: () => void;
}

export function ResultsScreen({
  result,
  mode,
  difficulty,
  isDaily,
  submitError,
  submitting,
  isLoggedIn,
  onRetry,
  onChangeMode,
  textLength,
}: ResultsScreenProps) {
  const rank = getRankForScore(result.score);
  const nextRank = getNextRank(result.score);
  const rankColor = getRankColor(rank.name);

  const stats = [
    { label: "WPM", value: result.wpm, color: "text-brand-500" },
    { label: "CPM", value: result.cpm, color: "text-slate-700 dark:text-slate-300" },
    { label: "Accuracy", value: `${result.accuracy}%`, color: "text-emerald-500" },
    { label: "Score", value: result.score, color: "text-amber-500" },
    { label: "Correct", value: result.correctChars, color: "text-slate-600 dark:text-slate-400" },
    { label: "Incorrect", value: result.incorrectChars, color: "text-rose-500" },
    { label: "Errors", value: result.errors, color: "text-rose-400" },
    { label: "Time", value: `${result.durationSeconds}s`, color: "text-slate-600 dark:text-slate-400" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      <div className="glass-card p-8 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-sm font-medium mb-3">
            {isDaily ? "Daily Challenge Complete" : `${MODE_LABELS[mode] || mode} • ${DIFFICULTY_LABELS[difficulty]}`}
          </div>
          <h2 className="text-4xl font-bold mb-2">Test Complete</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {result.wpm} words per minute with {result.accuracy}% accuracy
          </p>
        </div>

        {/* Main WPM display */}
        <div className="flex flex-col items-center mb-8">
          <div className="text-7xl font-bold font-mono tabular-nums gradient-text">
            {result.wpm}
          </div>
          <div className="text-sm text-slate-500 uppercase tracking-widest mt-1">WPM</div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card text-center">
              <div className={`text-2xl font-bold font-mono tabular-nums ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Rank display */}
        {isLoggedIn && (
          <div className={`rounded-xl p-4 mb-6 ${rankColor.bg} border ${rankColor.border}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${rankColor.gradient} flex items-center justify-center`}>
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Your Rank</div>
                  <div className={`text-lg font-bold ${rankColor.text}`}>{rank.name}</div>
                </div>
              </div>
              {nextRank && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Next: {nextRank.name}</div>
                  <div className="text-sm font-medium">{nextRank.min_score - result.score} points to go</div>
                </div>
              )}
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${rankColor.gradient} rounded-full transition-all duration-500`}
                style={{
                  width: nextRank
                    ? `${((result.score - rank.min_score) / (nextRank.min_score - rank.min_score)) * 100}%`
                    : "100%",
                }}
              />
            </div>
          </div>
        )}

        {/* Submit status */}
        {submitting && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
            <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            Saving your result...
          </div>
        )}
        {submitError && (
          <div className="flex items-center gap-2 text-sm text-rose-500 mb-4 p-3 rounded-lg bg-rose-500/10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {submitError}
          </div>
        )}
        {!isLoggedIn && (
          <div className="flex items-center gap-2 text-sm text-amber-500 mb-4 p-3 rounded-lg bg-amber-500/10">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Sign in to save your result and appear on the leaderboard
          </div>
        )}
        {isLoggedIn && !submitError && !submitting && (
          <div className="flex items-center gap-2 text-sm text-emerald-500 mb-4 p-3 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Result saved! Your stats have been updated.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onRetry} className="btn-primary flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button onClick={onChangeMode} className="btn-outline flex items-center gap-2">
            <Keyboard className="w-4 h-4" /> Change Mode
          </button>
          {isLoggedIn && (
            <a href="/stats" className="btn-ghost flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> View Statistics
            </a>
          )}
          <a href="/leaderboard" className="btn-ghost flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Leaderboard
          </a>
        </div>
      </div>

      {/* WPM calculation info */}
      <div className="mt-4 text-center text-xs text-slate-400">
        <p>
          <TrendingUp className="w-3 h-3 inline mr-1" />
          WPM = (Correct Characters / 5) / Time in Minutes = ({result.correctChars} / 5) / ({result.durationSeconds} / 60) = {result.wpm}
        </p>
      </div>
    </div>
  );
}
