/**
 * Path: apps/web/app/lib/user-skill-state.ts
 *
 * Per-user spaced-repetition state for ASUs (Atomic Skill Units).
 *
 * Each user has a sparse map: only ASUs they've actually seen get a
 * row. New users start empty. A user at B1 might have ~200 rows after
 * a month of practice, not 5,000.
 *
 * Storage: localStorage key `lumalang.skill-state.v1`. When we wire
 * Prisma later (next sprint), the in-memory cache + the localStorage
 * shape will both stay — the only change is that `loadAll()` will
 * hit /api/skill-state instead of localStorage.
 *
 * Algorithm: simplified SM-2 (SuperMemo-2). Each correct answer
 * pushes the next review further out; each wrong answer brings it
 * close again. Strength is a 0..1 confidence float.
 */

const STORAGE_KEY = "lumalang.skill-state.v1";

/**
 * One row of skill state per (user, ASU). The user_id is implicit
 * in the storage key because we're single-user per device for the
 * PoC. When we add real auth, we'll prefix with `user:{id}.`.
 */
export interface SkillState {
  /** ASU id, e.g. "vocab.foundation.hello.v1" */
  skillId: string;
  /** 0.0 = unknown, 1.0 = mastered. Decays over time. */
  strength: number;
  /** ISO timestamp of last seen */
  lastSeenISO: string | null;
  /** ISO timestamp of next scheduled review */
  nextReviewISO: string;
  /** How many times the user has answered correctly */
  timesCorrect: number;
  /** How many times wrong */
  timesWrong: number;
  /** SM-2 ease factor. Starts at 2.5, grows with success. */
  easeFactor: number;
  /** Interval (days) until next review */
  intervalDays: number;
}

/* ────────────────────────────────────────────────────────────────────
   Storage I/O
   ──────────────────────────────────────────────────────────────────── */

/** Load the entire skill-state map for the current user (sparse). */
export function loadAllSkillStates(): Record<string, SkillState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Record<string, SkillState>;
  } catch {
    return {};
  }
}

/** Persist the whole map back to localStorage. */
export function saveAllSkillStates(map: Record<string, SkillState>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    // Quota exceeded or storage disabled — log but don't throw.
    // The recommender still works in-memory for the current session.
    console.warn("[skill-state] could not persist", e);
  }
}

/** Read one state row, or null if the user hasn't seen this skill. */
export function getSkillState(skillId: string): SkillState | null {
  const map = loadAllSkillStates();
  return map[skillId] ?? null;
}

/** Write one row back. */
export function setSkillState(state: SkillState): void {
  const map = loadAllSkillStates();
  map[state.skillId] = state;
  saveAllSkillStates(map);
}

/* ────────────────────────────────────────────────────────────────────
   SM-2 (simplified)
   ──────────────────────────────────────────────────────────────────── */

/**
 * Create the initial state for a skill the user has never seen.
 * `nextReviewISO` is set to now() so it's eligible to appear
 * immediately in the next recommendation queue.
 */
export function newSkillState(skillId: string): SkillState {
  return {
    skillId,
    strength: 0,
    lastSeenISO: null,
    nextReviewISO: new Date().toISOString(),
    timesCorrect: 0,
    timesWrong: 0,
    easeFactor: 2.5,
    intervalDays: 0,
  };
}

/**
 * Given the current state + the result of the latest attempt,
 * compute the next state. This is the SM-2 update step.
 *
 * `quality` is 0-5 (SuperMemo grading scale):
 *   0 = blackout, complete blank
 *   1 = wrong but recognized correct on reveal
 *   2 = wrong, easy recall
 *   3 = correct but with serious difficulty
 *   4 = correct with hesitation
 *   5 = perfect, instant
 *
 * For our PoC we map a binary correct/wrong onto quality:
 *   correct + fast (<5s)  → 5
 *   correct + medium      → 4
 *   correct + slow (>15s) → 3
 *   wrong                 → 1
 */
export function applySm2(
  prev: SkillState,
  quality: number,
  nowISO?: string,
): SkillState {
  const now = nowISO ? new Date(nowISO) : new Date();
  const next: SkillState = { ...prev };
  next.lastSeenISO = now.toISOString();

  if (quality < 3) {
    // Wrong: reset interval but keep ease factor decay
    next.timesWrong = prev.timesWrong + 1;
    next.intervalDays = 0;
    next.strength = Math.max(0, prev.strength - 0.3);
    // Schedule for ~10 minutes from now
    const t = new Date(now.getTime() + 10 * 60 * 1000);
    next.nextReviewISO = t.toISOString();
  } else {
    // Correct: grow ease factor, push next review out
    next.timesCorrect = prev.timesCorrect + 1;
    // SM-2 ease factor formula:
    //   EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const ef = prev.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    next.easeFactor = Math.max(1.3, ef);

    // Interval growth:
    //   1st correct  →  1 day
    //   2nd correct  →  6 days
    //   3rd+         →  prev * EF
    if (prev.intervalDays === 0) {
      next.intervalDays = 1;
    } else if (prev.intervalDays < 6) {
      next.intervalDays = 6;
    } else {
      next.intervalDays = Math.round(prev.intervalDays * next.easeFactor);
    }

    next.strength = Math.min(1.0, prev.strength + 0.15);
    const t = new Date(now.getTime() + next.intervalDays * 24 * 60 * 60 * 1000);
    next.nextReviewISO = t.toISOString();
  }

  return next;
}

/**
 * Apply the natural forgetting curve. If the user hasn't seen a skill
 * in a while, strength decays. Call this when computing the
 * recommendation queue — it doesn't write back to storage; it just
 * gives a fresher strength for ranking.
 */
export function decayedStrength(state: SkillState, nowISO?: string): number {
  if (!state.lastSeenISO) return state.strength;
  const now = nowISO ? new Date(nowISO).getTime() : Date.now();
  const last = new Date(state.lastSeenISO).getTime();
  const daysSince = (now - last) / (24 * 60 * 60 * 1000);
  // Decay rate: 5% per day of strength. Mild — keeps mastered skills
  // around for ~20 days before they look 'cold'.
  const decay = Math.exp(-0.05 * daysSince);
  return Math.max(0, state.strength * decay);
}

/**
 * Convert a raw correctness + elapsed time into SM-2 quality.
 */
export function gradeAttempt(correct: boolean, elapsedMs: number): number {
  if (!correct) return 1;
  if (elapsedMs < 5000) return 5;
  if (elapsedMs < 15000) return 4;
  return 3;
}

/* ────────────────────────────────────────────────────────────────────
   Bulk operations (used by recommender)
   ──────────────────────────────────────────────────────────────────── */

/** Get all skills due for review (nextReviewISO <= now). */
export function getDueSkillIds(nowISO?: string): string[] {
  const map = loadAllSkillStates();
  const now = nowISO ? new Date(nowISO).getTime() : Date.now();
  return Object.values(map)
    .filter((s) => new Date(s.nextReviewISO).getTime() <= now)
    .map((s) => s.skillId);
}

/** Clear all state — used by 'Reset progress' button and tests. */
export function clearAllSkillStates(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
