import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Pause, Play, Settings, Keyboard, Clock, Hash, Quote, Type, Pencil } from "lucide-react";
import { useTypingEngine, type TypingEngineResult, type CharState } from "@/lib/useTypingEngine";
import type { Difficulty, TestMode } from "@/lib/types";
import { generatePassage, DIFFICULTY_LABELS, MODE_LABELS } from "@/lib/content";
import { submitScore } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ResultsScreen } from "./ResultsScreen";
import { TestSettings } from "./TestSettings";

interface TypingTestProps {
  mode?: TestMode;
  difficulty?: Difficulty;
  duration?: number;
  wordCount?: number;
  customText?: string;
  isDaily?: boolean;
  challengeDate?: string | null;
  dailyPassage?: string;
  onModeChange?: (mode: TestMode) => void;
}

const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];

export function TypingTest({
  mode: initialMode = "standard",
  difficulty: initialDifficulty = "medium",
  duration: initialDuration = 30,
  wordCount: initialWordCount = 25,
  customText: initialCustomText = "",
  isDaily = false,
  challengeDate = null,
  dailyPassage,
  onModeChange,
}: TypingTestProps) {
  const { session, profile } = useAuth();
  const [mode, setMode] = useState<TestMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [duration, setDuration] = useState(initialDuration);
  const [wordCount, setWordCount] = useState(initialWordCount);
  const [customText, setCustomText] = useState(initialCustomText);
  const [showSettings, setShowSettings] = useState(false);
  const [result, setResult] = useState<TypingEngineResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedText, setSavedText] = useState("");

  // Generate text based on mode
  const generateText = useCallback((): string => {
    if (isDaily && dailyPassage) return dailyPassage;
    if (mode === "custom" && customText.trim()) return customText.trim();
    if (mode === "standard") return generatePassage(difficulty, "time", undefined, 80);
    if (mode === "time") return generatePassage(difficulty, "time", undefined, 120);
    if (mode === "words") return generatePassage(difficulty, "words", undefined, wordCount);
    if (mode === "quote") return generatePassage(difficulty, "quote");
    if (mode === "practice") return generatePassage(difficulty, "time", undefined, 80);
    return generatePassage(difficulty, "time", undefined, 80);
  }, [mode, difficulty, wordCount, customText, isDaily, dailyPassage]);

  const [text, setText] = useState(generateText);

  useEffect(() => {
    setText(generateText());
  }, [generateText]);

  const handleComplete = useCallback(async (res: TypingEngineResult) => {
    setResult(res);
    setSavedText(text);

    // Only submit to server if user is logged in and not practice mode
    if (session && profile && mode !== "practice" && !profile.is_suspended) {
      setSubmitting(true);
      const { success, error } = await submitScore(
        res,
        mode,
        difficulty,
        isDaily,
        challengeDate,
        text,
        session.access_token
      );
      setSubmitting(false);
      if (!success) {
        setSubmitError(error || "Failed to save result");
      }
    }
  }, [session, profile, mode, difficulty, isDaily, challengeDate, text]);

  const engine = useTypingEngine({
    text,
    durationSeconds: mode === "time" || mode === "standard" || isDaily ? duration : null,
    wordCount: mode === "words" ? wordCount : null,
    onComplete: handleComplete,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        engine.reset();
        setResult(null);
      }
      if (e.key === "Tab" || (e.ctrlKey && e.key === "r")) {
        e.preventDefault();
        engine.restart();
        setResult(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [engine]);

  const handleModeChange = (newMode: TestMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
    engine.reset();
    setResult(null);
  };

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    engine.reset();
    setResult(null);
  };

  const handleDurationChange = (d: number) => {
    setDuration(d);
    engine.reset();
    setResult(null);
  };

  const handleWordCountChange = (wc: number) => {
    setWordCount(wc);
    engine.reset();
    setResult(null);
  };

  const handleRestart = () => {
    engine.restart();
    setResult(null);
    setSubmitError(null);
  };

  const handleChangeText = () => {
    setText(generateText());
    engine.reset();
    setResult(null);
  };

  if (result) {
    return (
      <ResultsScreen
        result={result}
        mode={mode}
        difficulty={difficulty}
        isDaily={isDaily}
        submitError={submitError}
        submitting={submitting}
        isLoggedIn={!!session}
        onRetry={handleRestart}
        onChangeMode={() => {
          setResult(null);
          engine.reset();
        }}
        textLength={savedText.length}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Mode & Settings Bar */}
      {!isDaily && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {/* Mode selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50">
            {[
              { m: "standard" as TestMode, icon: Keyboard, label: "Standard" },
              { m: "time" as TestMode, icon: Clock, label: "Time" },
              { m: "words" as TestMode, icon: Hash, label: "Words" },
              { m: "quote" as TestMode, icon: Quote, label: "Quote" },
              { m: "custom" as TestMode, icon: Pencil, label: "Custom" },
              { m: "practice" as TestMode, icon: Type, label: "Practice" },
            ].map(({ m, icon: Icon, label }) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? "bg-white dark:bg-slate-700 text-brand-500 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duration / Word Count / Difficulty selectors */}
      {!isDaily && (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-sm">
          {mode === "time" || mode === "standard" ? (
            <div className="flex items-center gap-1.5">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => handleDurationChange(d)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    duration === d
                      ? "bg-brand-500 text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          ) : null}

          {mode === "words" ? (
            <div className="flex items-center gap-1.5">
              {WORD_COUNTS.map((wc) => (
                <button
                  key={wc}
                  onClick={() => handleWordCountChange(wc)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    wordCount === wc
                      ? "bg-brand-500 text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {wc}
                </button>
              ))}
            </div>
          ) : null}

          {/* Difficulty */}
          <div className="flex items-center gap-1.5">
            {(["easy", "medium", "hard", "expert"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  difficulty === d
                    ? "bg-brand-500 text-white"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Custom text input */}
      {mode === "custom" && !isDaily && (
        <div className="mb-6">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type or paste your custom text here..."
            className="w-full p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none font-mono text-sm min-h-[100px]"
            onFocus={() => engine.reset()}
          />
          <div className="flex justify-end mt-2">
            <button onClick={handleChangeText} className="btn-ghost text-sm">
              Apply Text
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono tabular-nums text-brand-500">
              {engine.remainingTime !== null ? engine.remainingTime.toFixed(0) : engine.liveWpm}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {engine.remainingTime !== null ? "seconds" : "wpm"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
              {engine.liveAccuracy}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">accuracy</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {engine.isActive && (
            <button
              onClick={engine.pause}
              className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title="Pause/Resume (Esc)"
            >
              {engine.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={handleRestart}
            className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="Restart (Tab)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-200"
          style={{ width: `${engine.progress}%` }}
        />
      </div>

      {/* Typing area */}
      <div
        className="relative glass-card p-8 md:p-10 min-h-[200px] cursor-text"
        onClick={engine.focus}
      >
        {/* Countdown overlay */}
        {engine.countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm rounded-2xl z-10">
            <div className="text-6xl font-bold text-brand-500 animate-bounce-in" key={engine.countdown}>
              {engine.countdown > 0 ? engine.countdown : "Go!"}
            </div>
          </div>
        )}

        {/* Paused overlay */}
        {engine.isPaused && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm rounded-2xl z-10">
            <div className="text-center">
              <Pause className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <div className="text-lg font-medium text-slate-500">Paused</div>
              <button onClick={engine.pause} className="btn-primary mt-4">
                Resume
              </button>
            </div>
          </div>
        )}

        {/* Hidden input for capturing keystrokes */}
        <input
          ref={engine.inputRef}
          type="text"
          value={engine.typed}
          onChange={engine.handleInputChange}
          onKeyDown={engine.handleKeyDown}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        {/* Text display */}
        <div className="font-mono text-xl md:text-2xl leading-relaxed tracking-wide select-none break-words">
          {text.split("").map((char, i) => {
            const state = engine.charStates[i];
            const isCurrent = i === engine.currentIndex && engine.isActive && !engine.isPaused;
            return (
              <span
                key={i}
                className={`typing-char ${
                  state === "correct"
                    ? "typing-correct"
                    : state === "incorrect"
                    ? "typing-incorrect"
                    : "typing-pending"
                } ${isCurrent ? "typing-current" : ""}`}
              >
                {char === " " && state === "incorrect" ? "\u00A0" : char}
              </span>
            );
          })}
        </div>

        {/* Start hint */}
        {!engine.isActive && !engine.isComplete && engine.countdown === null && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-slate-400 animate-pulse">
            Start typing to begin
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-400">
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Tab</kbd> Restart</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Esc</kbd> Reset</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">Ctrl+R</kbd> Restart</span>
      </div>

      {/* Settings modal */}
      <TestSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        mode={mode}
        duration={duration}
        wordCount={wordCount}
        difficulty={difficulty}
        onDurationChange={handleDurationChange}
        onWordCountChange={handleWordCountChange}
        onDifficultyChange={handleDifficultyChange}
      />
    </div>
  );
}
