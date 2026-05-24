/**
 * Path: apps/web/app/lib/recommend-engine.ts
 *
 * The recommender: turns a LearnerProfile (from Placement v2) +
 * the user's SM-2 skill-state + the global ASU pool into a queue
 * of N skills to study right now.
 *
 * The algorithm has THREE phases, in order:
 *
 *   1. CANDIDATE POOL  — Filter the global ASU pool by tags the
 *      profile demands (cefr range, goal-derived tags, weakness
 *      tags). Reject anything blocked by unsatisfied prerequisites.
 *
 *   2. SCORE EACH      — Weighted sum across 5 dimensions:
 *      - level match (does ASU.level == profile.cefr?)
 *      - tag overlap with goal_context
 *      - urgency (how overdue is the SR review?)
 *      - error-pattern targeting (does ASU.tags include any
 *        `targets:<pattern>` for a detected weakness?)
 *      - novelty (boost never-seen skills over already-mastered ones)
 *
 *   3. PICK TOP N      — With diversity guard so a queue isn't all
 *      vocab or all grammar. Mix types.
 *
 * No machine learning. Deterministic, fast (O(P log N) where P is
 * candidate pool size, N is queue size).
 */

import {
  filterSkillsByTags,
  type SkillTag,
  type SkillType,
  type SkillUnit,
} from "./skill-units";
import {
  decayedStrength,
  getSkillState,
  loadAllSkillStates,
  newSkillState,
  type SkillState,
} from "./user-skill-state";

/* ────────────────────────────────────────────────────────────────────
   Profile shape consumed by the engine
   We model only what the engine needs — keeps it decoupled from
   Placement v2's full LearnerProfile.
   ──────────────────────────────────────────────────────────────────── */

export interface RecommenderProfile {
  cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  primaryGoal: "work" | "exam" | "foundation" | "travel" | "other";
  /** Tags derived from goal_context (industry, exam, weaknesses, focuses). */
  goalTags: SkillTag[];
  /** Detected error-pattern tags like "targets:articles", "targets:verb_tense". */
  errorPatternTags: SkillTag[];
  /** How many skills the user can comfortably do in one session. */
  sessionSize: number;
}

/* ────────────────────────────────────────────────────────────────────
   Helpers — derive RecommenderProfile from Placement v2 storage
   ──────────────────────────────────────────────────────────────────── */

const STORAGE_KEY_PROFILE_V2 = "lumalang.placement.v2";

interface PlacementV2Snapshot {
  version: 2;
  cefr: RecommenderProfile["cefr"];
  primaryGoal: RecommenderProfile["primaryGoal"];
  goalContext: any;
  dailyMinutes: 10 | 20 | 30 | 60;
  errorPatterns: string[];
}

/**
 * Pull the latest Placement v2 snapshot from localStorage and turn it
 * into a RecommenderProfile. Returns null if there's no v2 snapshot
 * (user hasn't done placement yet).
 */
export function loadProfileFromStorage(): RecommenderProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE_V2);
    if (!raw) return null;
    const snap = JSON.parse(raw) as PlacementV2Snapshot;
    if (snap.version !== 2) return null;
    return buildProfile(snap);
  } catch {
    return null;
  }
}

/** Build the engine-shaped profile from a v2 snapshot. */
export function buildProfile(snap: PlacementV2Snapshot): RecommenderProfile {
  const goalTags: SkillTag[] = [`goal:${snap.primaryGoal}` as SkillTag];

  switch (snap.goalContext?.kind) {
    case "work":
      if (snap.goalContext.industry) {
        goalTags.push(`industry:${snap.goalContext.industry}` as SkillTag);
      }
      break;
    case "exam":
      if (snap.goalContext.exam) {
        goalTags.push(`exam:${snap.goalContext.exam}` as SkillTag);
      }
      break;
    case "foundation":
      for (const w of snap.goalContext.weaknesses ?? []) {
        goalTags.push(`weakness:${w}` as SkillTag);
      }
      break;
    case "travel":
      for (const f of snap.goalContext.focuses ?? []) {
        goalTags.push(`travel:${f}` as SkillTag);
      }
      break;
  }

  const errorPatternTags: SkillTag[] = (snap.errorPatterns ?? []).map(
    (p) => `targets:${p}` as SkillTag,
  );

  // Session size — pulled from time budget.
  const sessionSizeByMinutes: Record<number, number> = {
    10: 3,
    20: 5,
    30: 7,
    60: 12,
  };
  const sessionSize = sessionSizeByMinutes[snap.dailyMinutes] ?? 5;

  return {
    cefr: snap.cefr,
    primaryGoal: snap.primaryGoal,
    goalTags,
    errorPatternTags,
    sessionSize,
  };
}

/* ────────────────────────────────────────────────────────────────────
   CEFR neighborhood — used to widen the candidate pool slightly
   ──────────────────────────────────────────────────────────────────── */

const CEFR_ORDER: RecommenderProfile["cefr"][] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function cefrNeighborhood(level: RecommenderProfile["cefr"]): RecommenderProfile["cefr"][] {
  const idx = CEFR_ORDER.indexOf(level);
  const result: RecommenderProfile["cefr"][] = [];
  if (idx - 1 >= 0) result.push(CEFR_ORDER[idx - 1]);
  result.push(level);
  if (idx + 1 < CEFR_ORDER.length) result.push(CEFR_ORDER[idx + 1]);
  return result;
}

/* ────────────────────────────────────────────────────────────────────
   Phase 1 — CANDIDATE POOL
   ──────────────────────────────────────────────────────────────────── */

export function buildCandidatePool(
  allSkills: SkillUnit[],
  profile: RecommenderProfile,
): SkillUnit[] {
  // Allow current level ± 1 so the queue has room to challenge
  // (stretch) and to consolidate (review at lower level).
  const allowedLevels = new Set(cefrNeighborhood(profile.cefr));

  return allSkills.filter((s) => {
    if (!allowedLevels.has(s.level)) return false;
    return true; // profile-tag matching happens during scoring,
                 // not as a hard filter — keeps the pool rich.
  });
}

/* ────────────────────────────────────────────────────────────────────
   Phase 2 — SCORING
   ──────────────────────────────────────────────────────────────────── */

/**
 * Tunable weights. Sum doesn't have to be 1 — higher weights just
 * mean that dimension dominates ties. These are starting values;
 * tune from real session telemetry later.
 */
const W = {
  levelMatch: 1.0,
  goalTagOverlap: 1.2,
  errorPatternMatch: 1.5,
  urgency: 1.8,
  novelty: 0.9,
} as const;

function levelMatchScore(skill: SkillUnit, profile: RecommenderProfile): number {
  if (skill.level === profile.cefr) return 1.0;
  // adjacent levels = half credit
  const idxS = CEFR_ORDER.indexOf(skill.level as any);
  const idxP = CEFR_ORDER.indexOf(profile.cefr);
  return Math.abs(idxS - idxP) === 1 ? 0.5 : 0;
}

function tagOverlapScore(skillTags: readonly string[], targetTags: SkillTag[]): number {
  if (targetTags.length === 0) return 0;
  const set = new Set(skillTags);
  let hits = 0;
  for (const t of targetTags) {
    if (set.has(t)) hits++;
  }
  return hits / targetTags.length; // normalized 0..1
}

function urgencyScore(state: SkillState | null, nowMs: number): number {
  if (!state) return 1.0; // never seen → urgent in 'novel' sense
  const reviewMs = new Date(state.nextReviewISO).getTime();
  if (reviewMs > nowMs) return 0; // not yet due
  const overdueDays = (nowMs - reviewMs) / (24 * 60 * 60 * 1000);
  // Cap at 7 days — anything more is equally "very overdue"
  return Math.min(1.0, overdueDays / 7);
}

function noveltyScore(state: SkillState | null, nowMs: number): number {
  if (!state) return 1.0;
  const strength = decayedStrength(state, new Date(nowMs).toISOString());
  // Less mastered = more novel
  return 1.0 - strength;
}

export function scoreSkill(
  skill: SkillUnit,
  profile: RecommenderProfile,
  state: SkillState | null,
  nowMs: number,
): number {
  const sLevel = levelMatchScore(skill, profile);
  const sGoal = tagOverlapScore(skill.tags, profile.goalTags);
  const sError = tagOverlapScore(skill.tags, profile.errorPatternTags);
  const sUrgent = urgencyScore(state, nowMs);
  const sNovel = noveltyScore(state, nowMs);

  return (
    W.levelMatch * sLevel +
    W.goalTagOverlap * sGoal +
    W.errorPatternMatch * sError +
    W.urgency * sUrgent +
    W.novelty * sNovel
  );
}

/* ────────────────────────────────────────────────────────────────────
   Phase 3 — PICK TOP N with diversity
   ──────────────────────────────────────────────────────────────────── */

interface ScoredSkill {
  skill: SkillUnit;
  score: number;
}

/**
 * Maximum skills of the same type to include in one session. Prevents
 * a queue full of vocab when there are 25 vocab cards due.
 */
const MAX_PER_TYPE = 3;

/**
 * Main public entry. Pass the full ASU pool + the profile and get
 * back N skills to study, in study order.
 */
export function recommendDaily(
  allSkills: SkillUnit[],
  profile: RecommenderProfile,
  options: { now?: Date; n?: number } = {},
): SkillUnit[] {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  const n = options.n ?? profile.sessionSize;

  // Phase 1
  const pool = buildCandidatePool(allSkills, profile);

  // Phase 2 — score + sort
  const stateMap = loadAllSkillStates();
  const scored: ScoredSkill[] = pool.map((skill) => ({
    skill,
    score: scoreSkill(skill, profile, stateMap[skill.id] ?? null, nowMs),
  }));

  // Filter out zero-score items (truly nothing matched)
  const ranked = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Phase 3 — pick with diversity guard
  return diversePick(ranked, n);
}

function diversePick(ranked: ScoredSkill[], n: number): SkillUnit[] {
  const result: SkillUnit[] = [];
  const typeCount: Record<string, number> = {};

  for (const r of ranked) {
    if (result.length >= n) break;
    const t = r.skill.payload.type;
    const c = typeCount[t] ?? 0;
    if (c >= MAX_PER_TYPE) continue;
    result.push(r.skill);
    typeCount[t] = c + 1;
  }

  // If we couldn't fill via diversity (small pool), fall back to top
  // raw scores ignoring the per-type cap.
  if (result.length < n) {
    const seen = new Set(result.map((s) => s.id));
    for (const r of ranked) {
      if (result.length >= n) break;
      if (!seen.has(r.skill.id)) {
        result.push(r.skill);
        seen.add(r.skill.id);
      }
    }
  }

  return result;
}

/* ────────────────────────────────────────────────────────────────────
   Debug helper — explain why a skill scored what it did
   Useful for the upcoming admin panel & for tuning weights.
   ──────────────────────────────────────────────────────────────────── */

export interface ScoreBreakdown {
  total: number;
  levelMatch: number;
  goalTagOverlap: number;
  errorPatternMatch: number;
  urgency: number;
  novelty: number;
}

export function scoreBreakdown(
  skill: SkillUnit,
  profile: RecommenderProfile,
  state: SkillState | null = null,
  nowMs: number = Date.now(),
): ScoreBreakdown {
  const levelMatch = W.levelMatch * levelMatchScore(skill, profile);
  const goalTagOverlap = W.goalTagOverlap * tagOverlapScore(skill.tags, profile.goalTags);
  const errorPatternMatch = W.errorPatternMatch * tagOverlapScore(skill.tags, profile.errorPatternTags);
  const urgency = W.urgency * urgencyScore(state, nowMs);
  const novelty = W.novelty * noveltyScore(state, nowMs);
  return {
    levelMatch,
    goalTagOverlap,
    errorPatternMatch,
    urgency,
    novelty,
    total: levelMatch + goalTagOverlap + errorPatternMatch + urgency + novelty,
  };
}

/* ────────────────────────────────────────────────────────────────────
   Convenience — full-stack recommend from storage
   ──────────────────────────────────────────────────────────────────── */

export function recommendFromStorage(
  allSkills: SkillUnit[],
  options: { now?: Date; n?: number } = {},
): { profile: RecommenderProfile | null; queue: SkillUnit[] } {
  const profile = loadProfileFromStorage();
  if (!profile) return { profile: null, queue: [] };
  const queue = recommendDaily(allSkills, profile, options);
  return { profile, queue };
}

/* ────────────────────────────────────────────────────────────────────
   Re-exports so callers only need to import from this file
   ──────────────────────────────────────────────────────────────────── */

export { filterSkillsByTags };
export type { SkillUnit, SkillTag, SkillType };
