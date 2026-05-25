"use client";

/**
 * Path: apps/web/app/lib/shadowing-link.ts
 *
 * Bridges the ASU/lesson side and the shadowing side. Two responsibilities:
 *
 *  1. extractRecentVocab() — walks the user's SkillState + the global
 *     skill pool to find vocab words they're currently studying. Returns
 *     a small list (3-5 words) that the ShadowingView can pass as a
 *     'boost' to the YouTube search query.
 *
 *  2. recordShadowingAsuTags() — after a clip is completed, calls
 *     /api/skill-state to nudge SkillState rows for matching ASUs upward
 *     (small strength bump). This way, practicing shadowing on a clip
 *     that contains 'budget' helps the recommender mark 'budget' vocab
 *     as more confident.
 *
 * No new schema needed. Uses existing PrismaClient routes from PR-E/F.
 */

import { FOUNDATION_SEED } from "./skill-seed-foundation";
import { loadAllSkillStates, decayedStrength } from "./user-skill-state";
import type { SkillUnit } from "./skill-units";

/**
 * Returns the user's CURRENTLY-LEARNING vocab words.
 * Definition: ASU has been seen at least once (state exists), but
 * decayed strength < 0.7 (not yet mastered). Caps at `limit`.
 *
 * Used to bias shadowing search: if user is learning "budget" + "schedule",
 * we prepend "budget schedule" to the YouTube query so clips containing
 * those words are favored.
 */
export function extractRecentVocab(limit = 5): string[] {
  const states = loadAllSkillStates();
  const ids = Object.keys(states);
  if (ids.length === 0) return [];

  const skillById = new Map<string, SkillUnit>(
    FOUNDATION_SEED.map((s) => [s.id, s] as const),
  );

  const now = new Date().toISOString();
  const candidates: Array<{ word: string; strength: number; updatedAt: string }> = [];

  for (const id of ids) {
    const state = states[id];
    if (!state) continue;
    const skill = skillById.get(id);
    if (!skill || skill.payload.type !== "vocab") continue;
    const decayed = decayedStrength(state, now);
    if (decayed >= 0.7) continue; // already mastered

    candidates.push({
      word: skill.payload.word,
      strength: decayed,
      updatedAt: state.lastSeenISO ?? state.nextReviewISO,
    });
  }

  // Prefer recent + weakest
  candidates.sort((a, b) => {
    if (a.updatedAt !== b.updatedAt) return b.updatedAt.localeCompare(a.updatedAt);
    return a.strength - b.strength;
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of candidates) {
    const w = c.word.toLowerCase();
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(c.word);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Build a search-query suffix that includes 1-2 vocab words the user
 * is studying. Empty string when nothing relevant.
 *
 * Used by ShadowingView when the user picks a topic — we append their
 * recent vocab so the YouTube result tends to contain those words.
 */
export function buildVocabBoost(): string {
  const words = extractRecentVocab(2);
  if (words.length === 0) return "";
  return words.join(" ");
}

/**
 * Called when a clip's shadowing session completes successfully.
 * Looks for vocab words from the user's ACTIVE skill set that appear
 * in the clip's transcript, and POSTs a tiny strength bump for them.
 *
 * Best-effort. If /api/skill-state fails or the user isn't logged in,
 * silently return.
 */
export async function recordShadowingCompletion(opts: {
  clipId: string;
  transcriptText: string;
  topicIds: string[];
}): Promise<void> {
  const states = loadAllSkillStates();
  const wordsInClip = new Set(
    opts.transcriptText.toLowerCase().match(/[a-z]+/g) ?? [],
  );
  if (wordsInClip.size === 0) return;

  // Find vocab ASUs whose word appears in the clip
  const matches: string[] = [];
  for (const skill of FOUNDATION_SEED) {
    if (skill.payload.type !== "vocab") continue;
    const w = skill.payload.word.toLowerCase();
    if (wordsInClip.has(w)) matches.push(skill.id);
  }

  if (matches.length === 0) return;

  // Send a bumped state. The API treats POST as upsert.
  const bumpedStates: Record<string, any> = {};
  for (const skillId of matches) {
    const existing = states[skillId];
    bumpedStates[skillId] = {
      strength: Math.min(1, (existing?.strength ?? 0) + 0.08),
      timesCorrect: (existing?.timesCorrect ?? 0) + 1,
      // we DON'T advance the SM-2 schedule heavily — shadowing is
      // exposure practice, not formal recall. Small nudge is enough.
    };
  }

  try {
    await fetch("/api/skill-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ states: bumpedStates }),
    });
  } catch {
    // ignore — local state still updated by the player's normal flow
  }
}
