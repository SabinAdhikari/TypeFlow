import type { Difficulty, PassageCategory } from "./types";

const WORD_BANK: Record<Difficulty, string[]> = {
  easy: [
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "near", "river",
    "bank", "every", "morning", "young", "child", "plays", "park", "while", "birds",
    "sing", "tall", "green", "trees", "above", "she", "walked", "store", "buy",
    "fresh", "bread", "milk", "family", "dinner", "tonight", "sun", "rises", "east",
    "sets", "west", "bringing", "light", "each", "new", "day", "small", "boat",
    "floats", "gently", "calm", "lake", "wind", "blows", "softly", "through",
    "old", "man", "sat", "fire", "told", "stories", "youth", "children", "gathered",
    "around", "laughed", "played", "games", "garden", "afternoon", "until", "went",
    "down", "way", "do", "great", "work", "love", "what", "never", "stop", "learning",
  ],
  medium: [
    "ability", "communicate", "effectively", "valuable", "skills", "person", "develop",
    "opening", "doors", "countless", "opportunities", "technology", "continues", "evolve",
    "unprecedented", "pace", "transforming", "interact", "world", "around", "writing",
    "requires", "patience", "practice", "willingness", "revise", "until", "sentence",
    "carries", "intended", "meaning", "reading", "regularly", "expands", "vocabulary",
    "improves", "focus", "exposes", "ideas", "change", "perspective", "journey",
    "thousand", "miles", "begins", "single", "step", "achievement", "starts", "decision",
    "success", "final", "failure", "fatal", "courage", "continue", "truly", "counts",
    "middle", "difficulty", "lies", "waiting", "discovered", "those", "willing", "beyond",
    "surface", "best", "plant", "tree", "twenty", "years", "second", "right", "now",
  ],
  hard: [
    "quantum", "entanglement", "phenomenon", "Einstein", "spooky", "action", "distance",
    "particles", "correlated", "regardless", "separation", "Apollo", "lunar", "module",
    "Eagle", "touched", "20:17:40", "UTC", "Armstrong's", "step", "watched", "650M",
    "49", "countries", "Mariana", "Trench", "10,994m", "pressure", "1,086", "atmospheres",
    "15,750", "psi", "crush", "submarines", "descents", "reached", "bottom", "DNA",
    "3", "billion", "base", "pairs", "humans", "share", "98.8%", "chimpanzees", "85%",
    "mice", "60%", "bananas", "gram", "store", "215", "petabytes", "data", "ARPANET",
    "1969", "connected", "nodes", "UCLA", "SRI", "UCSB", "Utah", "5.3B", "humanity",
    "online", "generating", "328.77", "million", "terabytes", "daily", "unprecedented",
  ],
  expert: [
    "const", "async", "await", "fetch", "res.ok", "throw", "Error", "HTTP", "status",
    "json()", "catch", "console.error", "null", "function", "quickSort", "arr.length",
    "pivot", "rest", "filter", "return", "import", "React", "useState", "useEffect",
    "useCallback", "export", "useDebounce", "debounced", "setDebounced", "setTimeout",
    "clearTimeout", "delay", "class", "Node<T>", "constructor", "public", "val", "next",
    "LinkedList<T>", "private", "head", "size", "length", "add", "curr", "SELECT",
    "COUNT", "LEFT", "JOIN", "WHERE", "created_at", "INTERVAL", "GROUP", "HAVING",
    "ORDER", "DESC", "LIMIT", "docker", "run", "--name", "POSTGRES_USER", "POSTGRES_PASSWORD",
    "5432", "volume", "alpine", "psql", "CREATE", "TABLE", "SERIAL", "PRIMARY", "KEY",
    "UNIQUE", "NOT", "NULL", "=>", "{}", "[]", "&&", "||", "!==", "===", "async/await",
  ],
};

const QUOTES: Record<Difficulty, string[]> = {
  easy: [
    "The only way to do great work is to love what you do and never stop learning.",
    "Life is what happens when you are busy making other plans for the future ahead.",
    "The best preparation for tomorrow is doing your best work today with full effort.",
    "Success is not about being the best but about being better than you were yesterday.",
  ],
  medium: [
    "Success is not final, failure is not fatal: it is the courage to continue that truly counts in the long run.",
    "In the middle of difficulty lies opportunity, waiting to be discovered by those who are willing to look beyond the surface.",
    "The best time to plant a tree was twenty years ago; the second best time is right now, today, without any hesitation.",
    "The journey of a thousand miles begins with a single step, and every great achievement starts with the decision to try.",
  ],
  hard: [
    'The quantum entanglement phenomenon, first described by Einstein as "spooky action at a distance," occurs when 2 particles become correlated & remain so regardless of separation distance (up to 10^8 meters).',
    "In 1969, Apollo 11's lunar module Eagle touched down at 20:17:40 UTC; Armstrong's famous step followed at 02:56:15 — watched by ~650M people across 49 countries worldwide!",
    "The Mariana Trench reaches 10,994m deep; pressure there equals 1,086 atmospheres (15,750 psi) — enough to crush standard submarines. Only 3 manned descents have ever reached the bottom.",
  ],
  expert: [
    'const fetchData = async (url) => { try { const res = await fetch(url); if (!res.ok) throw new Error(`HTTP ${res.status}`); return await res.json(); } catch (e) { console.error(e); return null; } };',
    "function quickSort(arr) { if (arr.length <= 1) return arr; const [pivot, ...rest] = arr; const left = rest.filter(x => x < pivot); const right = rest.filter(x => x >= pivot); return [...quickSort(left), pivot, ...quickSort(right)]; }",
    'SELECT u.id, u.username, COUNT(r.id) AS tests, MAX(r.wpm) AS best_wpm FROM profiles u LEFT JOIN test_results r ON r.user_id = u.id WHERE r.created_at >= NOW() - INTERVAL \'30 days\' GROUP BY u.id HAVING COUNT(r.id) > 0 ORDER BY best_wpm DESC LIMIT 100;',
  ],
};

const PROGRAMMING: Record<Difficulty, string[]> = {
  easy: [
    "const add = (a, b) => a + b; const result = add(3, 5); console.log(result);",
    "let count = 0; for (let i = 0; i < 10; i++) { count++; } console.log(count);",
    "const greet = (name) => `Hello, ${name}!`; console.log(greet('World'));",
  ],
  medium: [
    "const fetchData = async (url) => { try { const res = await fetch(url); if (!res.ok) throw new Error(`HTTP ${res.status}`); return await res.json(); } catch (e) { console.error(e); return null; } };",
    "import React, { useState } from 'react'; export const Counter = () => { const [n, setN] = useState(0); return <button onClick={() => setN(n + 1)}>{n}</button>; };",
  ],
  hard: [
    "class Node<T> { constructor(public val: T, public next: Node<T> | null = null) {} } class LinkedList<T> { private head: Node<T> | null = null; private size = 0; get length() { return this.size; } }",
    'SELECT u.id, u.username, COUNT(r.id) AS tests, MAX(r.wpm) AS best_wpm FROM profiles u LEFT JOIN test_results r ON r.user_id = u.id WHERE r.created_at >= NOW() - INTERVAL \'30 days\' GROUP BY u.id ORDER BY best_wpm DESC;',
  ],
  expert: [
    "function quickSort(arr) { if (arr.length <= 1) return arr; const [pivot, ...rest] = arr; const left = rest.filter(x => x < pivot); const right = rest.filter(x => x >= pivot); return [...quickSort(left), pivot, ...quickSort(right)]; }",
    "import React, { useState, useEffect, useCallback } from 'react'; export const useDebounce = (value, delay = 300) => { const [d, setD] = useState(value); useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]); return d; };",
    'docker run -d --name postgres -e POSTGRES_USER=admin -e POSTGRES_PASSWORD=s3cr3t -p 5432:5432 -v $HOME/pgdata:/var/lib/postgresql/data postgres:16-alpine && psql -h localhost -U admin -c "CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL);"',
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateWords(difficulty: Difficulty, wordCount: number): string {
  const bank = WORD_BANK[difficulty];
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(bank[Math.floor(Math.random() * bank.length)]);
  }
  return words.join(" ");
}

export function generateQuote(difficulty: Difficulty): string {
  const quotes = QUOTES[difficulty];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function generateProgramming(difficulty: Difficulty): string {
  const snippets = PROGRAMMING[difficulty];
  return snippets[Math.floor(Math.random() * snippets.length)];
}

export function generatePassage(
  difficulty: Difficulty,
  mode: string,
  category?: PassageCategory,
  wordCount?: number
): string {
  if (mode === "quote") {
    return generateQuote(difficulty);
  }
  if (mode === "custom") {
    return "";
  }
  if (category === "programming" || difficulty === "expert") {
    return generateProgramming(difficulty);
  }
  if (mode === "words" && wordCount) {
    return generateWords(difficulty, wordCount);
  }
  // For time mode, generate enough words for the duration
  const count = wordCount || 60;
  return generateWords(difficulty, count);
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  expert: "Expert",
};

export const MODE_LABELS: Record<string, string> = {
  standard: "Standard",
  time: "Time",
  words: "Words",
  quote: "Quote",
  custom: "Custom",
  practice: "Practice",
  daily: "Daily Challenge",
};
