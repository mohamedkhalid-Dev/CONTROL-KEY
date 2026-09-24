/**
 * discipline.ts — Discipline Score + streaks (Stage 6 gamification).
 * +10 when the user solves with hints ("I did it myself" signal),
 * streak counts consecutive days with at least one chat.
 * Local-only, no server, no pressure — encouragement only.
 */

const KEY = "ck_discipline";

export interface Discipline {
  score: number;
  streak: number;
  lastDay: string; // YYYY-MM-DD
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function getDiscipline(): Discipline {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.score === "number") return { score: p.score, streak: p.streak ?? 0, lastDay: p.lastDay ?? "" };
    }
  } catch {
    /* ignore */
  }
  return { score: 0, streak: 0, lastDay: "" };
}

function save(d: Discipline): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* ignore */
  }
}

/** Call on every sent message — extends streak when a new day starts. */
export function recordChatDay(): Discipline {
  const d = getDiscipline();
  const t = today();
  if (d.lastDay === t) return d;
  d.streak = d.lastDay === yesterday() ? d.streak + 1 : 1;
  d.lastDay = t;
  save(d);
  return d;
}

/** Student solved it themselves (heuristic on their words) → +10 score. */
export function awardSolve(): Discipline {
  const d = recordChatDay();
  d.score += 10;
  save(d);
  return d;
}

/** "I did it myself" detector — Grade 5-8 phrasing, EN + common AR. */
export function looksLikeSelfSolve(message: string): boolean {
  return /(i did it|i solved it|solved it myself|i got it|i figured it out|i understand now|thanks,? i (can|got)|عملتها|فهمت|حليتها)/i.test(
    message
  );
}

const CHEERS = [
  "Good call — you asked for a hint, not the answer. +10.",
  "That's the approach. Hints in, answers out.",
  "Self-control compounds. +10.",
  "Future you says thanks. Keep going.",
];

export function randomCheer(): string {
  return CHEERS[Math.floor(Math.random() * CHEERS.length)];
}
