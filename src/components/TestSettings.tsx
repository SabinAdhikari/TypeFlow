import { Modal } from "./Modal";
import { Clock, Hash } from "lucide-react";
import type { Difficulty, TestMode } from "@/lib/types";
import { DIFFICULTY_LABELS } from "@/lib/content";

interface TestSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TestMode;
  duration: number;
  wordCount: number;
  difficulty: Difficulty;
  onDurationChange: (d: number) => void;
  onWordCountChange: (wc: number) => void;
  onDifficultyChange: (d: Difficulty) => void;
}

export function TestSettings({
  isOpen,
  onClose,
  mode,
  duration,
  wordCount,
  difficulty,
  onDurationChange,
  onWordCountChange,
  onDifficultyChange,
}: TestSettingsProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test Settings">
      <div className="space-y-6">
        {/* Custom duration */}
        {mode === "time" || mode === "standard" ? (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Clock className="w-4 h-4" /> Custom Duration (seconds)
            </label>
            <input
              type="number"
              min={5}
              max={600}
              value={duration}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 5 && v <= 600) onDurationChange(v);
              }}
              className="input-field"
            />
            <div className="flex gap-2 mt-2">
              {[15, 30, 60, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => onDurationChange(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    duration === d ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Custom word count */}
        {mode === "words" ? (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Hash className="w-4 h-4" /> Custom Word Count
            </label>
            <input
              type="number"
              min={5}
              max={500}
              value={wordCount}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 5 && v <= 500) onWordCountChange(v);
              }}
              className="input-field"
            />
            <div className="flex gap-2 mt-2">
              {[10, 25, 50, 100].map((wc) => (
                <button
                  key={wc}
                  onClick={() => onWordCountChange(wc)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    wordCount === wc ? "bg-brand-500 text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {wc}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Difficulty */}
        <div>
          <label className="text-sm font-medium mb-3 block">Difficulty Level</label>
          <div className="grid grid-cols-2 gap-2">
            {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  difficulty === d
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-400 space-y-1">
            <p><strong>Easy:</strong> Common words, minimal punctuation</p>
            <p><strong>Medium:</strong> Longer sentences, basic punctuation</p>
            <p><strong>Hard:</strong> Complex vocabulary, numbers, capitalization</p>
            <p><strong>Expert:</strong> Programming terminology, symbols, code</p>
          </div>
        </div>

        <button onClick={onClose} className="btn-primary w-full">Done</button>
      </div>
    </Modal>
  );
}
