/**
 * Path: apps/web/app/lib/skill-units.ts
 *
 * Atomic Skill Units (ASU) — the building blocks of the lesson system.
 *
 * Why ASU instead of fixed Lessons?
 *  - 1 ASU can appear in many "courses" without duplication. Example:
 *    the phrase "Could we schedule a follow-up?" can serve a
 *    business-meeting playlist, an IELTS Speaking Part 1 playlist,
 *    and a polite-request foundation playlist.
 *  - The recommender (PR-C) picks N ASUs per session based on the
 *    user's profile (cefr + goal + context + weakness + time) and
 *    their spaced-repetition state. No "lesson 1 → lesson 2" coupling.
 *  - Database scale: ~5,000 ASUs cover everything. With fixed lessons
 *    per (track × level × user), you'd need millions.
 *
 * What a "course" is now:
 *  - A track template = ordered list of TAGS (not skill IDs). The
 *    recommender filters the global ASU pool by these tags. Different
 *    users on the same template get different ASU sequences because
 *    their profile + state diverge.
 */

import type {
  CEFRLevel,
  ErrorPattern,
  FoundationWeakness,
  Industry,
  PrimaryGoal,
  TravelFocus,
} from "../placement/_lib/types";

/* ────────────────────────────────────────────────────────────────────
   Skill types — the verb the ASU asks the learner to do
   ──────────────────────────────────────────────────────────────────── */

export type SkillType =
  | "vocab"           // memorize a word with meaning + example
  | "phrase"          // memorize a multi-word chunk
  | "grammar"         // explain + drill a grammar point
  | "listening"       // hear audio, pick / type what was said
  | "pronunciation"  // model audio, learner repeats (no auto-grading in v1)
  | "reading"         // read passage, comprehension question
  | "writing";        // produce a short written response (graded by AI in future)

export const SKILL_TYPE_LABELS: Record<SkillType, { vi: string; emoji: string }> = {
  vocab:         { vi: "Từ vựng",     emoji: "🧠" },
  phrase:        { vi: "Cụm từ",      emoji: "💬" },
  grammar:       { vi: "Ngữ pháp",    emoji: "📐" },
  listening:     { vi: "Nghe",        emoji: "👂" },
  pronunciation: { vi: "Phát âm",     emoji: "🗣️" },
  reading:       { vi: "Đọc hiểu",    emoji: "📖" },
  writing:       { vi: "Viết",        emoji: "✍️" },
};

/* ────────────────────────────────────────────────────────────────────
   Tags — the discriminator that lets one ASU appear in many tracks
   ──────────────────────────────────────────────────────────────────── */

/**
 * A tag is a structured label. We use string literals so the type
 * system can autocomplete known tags, but ASUs may also carry free-form
 * topic tags as plain strings.
 */
export type SkillTag =
  // CEFR
  | `level:${CEFRLevel}`
  // Goal alignment
  | `goal:${PrimaryGoal}`
  // Industry (work goal)
  | `industry:${Industry}`
  // Foundation weakness
  | `weakness:${FoundationWeakness}`
  // Travel focus
  | `travel:${TravelFocus}`
  // Error patterns this ASU TRAINS (recommender boosts these for users
  // with matching patterns in their profile)
  | `targets:${ErrorPattern}`
  // Free-form (topic, register, etc) — escape hatch for content authors
  | string;

/* ────────────────────────────────────────────────────────────────────
   The ASU shape
   ──────────────────────────────────────────────────────────────────── */

/**
 * Per-skill-type payloads. We use a discriminated union so consumers
 * (renderers, validators) can switch on `type` and get the right
 * fields without optional sprinkling.
 */
export type SkillPayload =
  | {
      type: "vocab";
      word: string;            // "schedule"
      pos: string;             // "verb"
      pronunciation_ipa?: string; // "/ˈʃed.juːl/"
      audio_url?: string;
      definition_en: string;
      definition_vi: string;
      example_en: string;
      example_vi: string;
    }
  | {
      type: "phrase";
      phrase_en: string;
      phrase_vi: string;
      audio_url?: string;
      context: string;          // when to use
      example_en: string;
      example_vi: string;
    }
  | {
      type: "grammar";
      rule_title_vi: string;    // "Thì hiện tại đơn"
      pattern: string;          // "S + V(s/es)"
      explain_vi: string;
      examples: Array<{ en: string; vi: string }>;
      common_mistakes_vi?: string[];
    }
  | {
      type: "listening";
      audio_url: string;
      transcript_en: string;
      transcript_vi?: string;
      question_vi: string;
      options: string[];
      answer_index: number;
    }
  | {
      type: "pronunciation";
      target_text_en: string;
      target_audio_url?: string;
      ipa?: string;
      tip_vi: string;
    }
  | {
      type: "reading";
      passage_en: string;
      passage_vi?: string;
      question_vi: string;
      options: string[];
      answer_index: number;
    }
  | {
      type: "writing";
      prompt_vi: string;
      target_word_count: number;
      example_answer_en: string;
    };

/**
 * The atomic skill unit. This is what gets stored in the content
 * database and what the recommender returns to the lesson player.
 *
 * NEVER mutate one of these in client code. They're treated as
 * immutable content. User progress lives in `user-skill-state.ts`
 * (PR-C).
 */
export interface SkillUnit {
  /** Stable id, format `<type>.<topic>.<n>` e.g. "vocab.greetings.001" */
  id: string;

  /** CEFR level — same as the level tag, hoisted for fast filtering */
  level: CEFRLevel;

  /** Tags drive playlist filtering AND scoring weights. */
  tags: SkillTag[];

  /** Other ASU ids that should be completed first. Empty = no deps. */
  prerequisites: string[];

  /** Estimated time to complete one pass, in seconds. */
  estimated_seconds: number;

  /** The actual content, discriminated by `type`. */
  payload: SkillPayload;

  /** Author note for the admin CMS. Optional. */
  author_note?: string;
}

/* ────────────────────────────────────────────────────────────────────
   Track templates — what users see as "courses"
   ──────────────────────────────────────────────────────────────────── */

/**
 * A track template is a filter recipe. It doesn't enumerate ASU ids;
 * it says "give me ASUs matching these tags". The recommender then
 * picks N per session.
 */
export interface TrackTemplate {
  id: string;
  name_vi: string;
  description_vi: string;
  cefr_range: [CEFRLevel, CEFRLevel];
  /** Tags that ALL matched ASUs must carry. */
  required_tags: SkillTag[];
  /** Tags that BOOST the score (any match adds weight). */
  preferred_tags?: SkillTag[];
  /** Match against the user's primary_goal. */
  goal: PrimaryGoal;
  /** Estimated total hours to complete the track (advisory). */
  estimated_hours: number;
}

/* ────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

export function isSkillTag(s: string): s is SkillTag {
  return typeof s === "string" && s.length > 0;
}

/**
 * Find ASUs that contain ALL of `required` tags and any of `preferred`
 * (preferred is just for compatibility — actual scoring uses preferred).
 */
export function filterSkillsByTags(
  pool: SkillUnit[],
  required: SkillTag[],
): SkillUnit[] {
  if (required.length === 0) return pool;
  return pool.filter((s) => required.every((t) => s.tags.includes(t)));
}

/**
 * Lookup a skill by id. Returns undefined if not found. Caller decides
 * whether to error.
 */
export function getSkillById(
  pool: SkillUnit[],
  id: string,
): SkillUnit | undefined {
  return pool.find((s) => s.id === id);
}

/**
 * Check whether all prerequisites of `skill` are in `completedIds`.
 * Used by the recommender to gate skills behind their deps.
 */
export function arePrerequisitesSatisfied(
  skill: SkillUnit,
  completedIds: ReadonlySet<string>,
): boolean {
  return skill.prerequisites.every((id) => completedIds.has(id));
}

/**
 * Count how many of a skill's tags match a list. Used by the scorer.
 */
export function tagOverlapCount(
  skill: SkillUnit,
  tags: ReadonlyArray<SkillTag>,
): number {
  let n = 0;
  for (const t of tags) {
    if (skill.tags.includes(t)) n++;
  }
  return n;
}
