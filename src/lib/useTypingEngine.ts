import { useState, useEffect, useRef, useCallback } from "react";

export type CharState = "pending" | "correct" | "incorrect" | "extra";

export interface TypingEngineResult {
  wpm: number;
  cpm: number;
  accuracy: number;
  score: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  errors: number;
  durationSeconds: number;
  wordsTyped: number;
  typedText: string;
}

export interface TypingEngineOptions {
  text: string;
  durationSeconds?: number | null;
  wordCount?: number | null;
  onComplete?: (result: TypingEngineResult) => void;
}

export function useTypingEngine({ text, durationSeconds, wordCount, onComplete }: TypingEngineOptions) {
  const [typed, setTyped] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [countdown, setCountdown] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completionRef = useRef(false);

  // Reset when text changes
  useEffect(() => {
    reset();
  }, [text]);

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused && startTime !== null) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const sec = (now - startTime) / 1000;
        setElapsed(sec);

        // Calculate live WPM
        const correct = countCorrectChars(typed, text);
        const wpm = sec > 0 ? (correct / 5) / (sec / 60) : 0;
        setLiveWpm(Math.round(wpm));

        const total = typed.length;
        const acc = total > 0 ? (correct / total) * 100 : 100;
        setLiveAccuracy(Math.round(acc * 10) / 10);

        // Check time-based completion
        if (durationSeconds && sec >= durationSeconds) {
          finishTest();
        }
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, isPaused, startTime, durationSeconds, typed, text]);

  const countCorrectChars = (typedStr: string, targetStr: string): number => {
    let count = 0;
    for (let i = 0; i < typedStr.length; i++) {
      if (typedStr[i] === targetStr[i]) count++;
    }
    return count;
  };

  const finishTest = useCallback(() => {
    if (completionRef.current) return;
    completionRef.current = true;

    setIsActive(false);
    setIsComplete(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const correctChars = countCorrectChars(typed, text);
    const incorrectChars = typed.length - correctChars;
    const totalChars = typed.length;
    const durationSec = elapsed || (startTime ? (Date.now() - startTime) / 1000 : 0);
    const wpm = durationSec > 0 ? (correctChars / 5) / (durationSec / 60) : 0;
    const cpm = durationSec > 0 ? (correctChars / (durationSec / 60)) : 0;
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 100;
    const errors = incorrectChars;

    // Score: rewards speed AND accuracy, penalizes errors
    const accuracyFactor = Math.pow(accuracy / 100, 2);
    const errorPenalty = Math.min(errors * 2, wpm * 0.5);
    const score = Math.max(0, Math.round(wpm * accuracyFactor * 10 - errorPenalty));

    const wordsTyped = typed.trim().split(/\s+/).filter(Boolean).length;

    const result: TypingEngineResult = {
      wpm: Math.round(wpm),
      cpm: Math.round(cpm),
      accuracy: Math.round(accuracy * 10) / 10,
      score,
      correctChars,
      incorrectChars,
      totalChars,
      errors,
      durationSeconds: Math.round(durationSec * 10) / 10,
      wordsTyped,
      typedText: typed,
    };

    onComplete?.(result);
  }, [typed, text, elapsed, startTime, onComplete]);

  // Word-count completion check
  useEffect(() => {
    if (isActive && wordCount && !durationSeconds) {
      const wordsTyped = typed.trim().split(/\s+/).filter(Boolean).length;
      if (wordsTyped >= wordCount && typed.length > 0) {
        finishTest();
      }
    }
    // Also complete if all text typed
    if (isActive && typed.length >= text.length && text.length > 0) {
      finishTest();
    }
  }, [typed, isActive, wordCount, durationSeconds, text, finishTest]);

  const startCountdown = useCallback(() => {
    setCountdown(3);
    let c = 3;
    const cdInterval = setInterval(() => {
      c--;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(cdInterval);
        setCountdown(null);
        setStartTime(Date.now());
        setIsActive(true);
        setIsComplete(false);
        completionRef.current = false;
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }, 1000);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive || isPaused || isComplete) return;
    const newValue = e.target.value;
    // Prevent typing beyond available text
    if (newValue.length > text.length) return;
    setTyped(newValue);
  }, [isActive, isPaused, isComplete, text]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent typing when not active
    if (!isActive && countdown === null && !isComplete) {
      if (e.key.length === 1) {
        startCountdown();
      }
    }
  }, [isActive, countdown, isComplete, startCountdown]);

  const pause = useCallback(() => {
    if (isActive && !isComplete) {
      setIsPaused((p) => !p);
    }
  }, [isActive, isComplete]);

  const reset = useCallback(() => {
    setTyped("");
    setIsActive(false);
    setIsPaused(false);
    setIsComplete(false);
    setStartTime(null);
    setElapsed(0);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setCountdown(null);
    completionRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const restart = useCallback(() => {
    reset();
    setTimeout(() => startCountdown(), 100);
  }, [reset, startCountdown]);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Compute character states for rendering
  const getCharStates = useCallback((): CharState[] => {
    return text.split("").map((char, i) => {
      if (i >= typed.length) return "pending";
      if (typed[i] === char) return "correct";
      return "incorrect";
    });
  }, [text, typed]);

  const currentIndex = typed.length;
  const remainingTime = durationSeconds ? Math.max(0, durationSeconds - elapsed) : null;

  return {
    typed,
    isActive,
    isPaused,
    isComplete,
    countdown,
    liveWpm,
    liveAccuracy,
    elapsed,
    remainingTime,
    currentIndex,
    charStates: getCharStates(),
    inputRef,
    startCountdown,
    handleInputChange,
    handleKeyDown,
    pause,
    reset,
    restart,
    focus,
    progress: durationSeconds ? Math.min(100, (elapsed / durationSeconds) * 100) : text.length > 0 ? (typed.length / text.length) * 100 : 0,
  };
}
