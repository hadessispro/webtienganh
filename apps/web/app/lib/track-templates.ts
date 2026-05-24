/**
 * Path: apps/web/app/lib/track-templates.ts
 *
 * Track templates — what 'a course' is now in the ASU world.
 *
 * In the old system, defaultCourses (in product-data.ts) had 13 hard-
 * coded courses with hardcoded lesson arrays. Each lesson was tied to
 * one course, no sharing.
 *
 * In the ASU system, a TrackTemplate is just:
 *   - a name + metadata
 *   - a set of required + preferred tags
 *
 * When the recommender runs for a user who 'enrolled in' a template,
 * it filters the global ASU pool by those tags first, then scores +
 * picks N skills.
 *
 * For PR-D (UI rebuild) we seed 4 templates covering the 4 primary
 * goals. Each user's primary goal in Placement v2 maps to one
 * 'default' template; they can also browse + start additional ones.
 */

import type { SkillTag, TrackTemplate } from "./skill-units";

export const TRACK_TEMPLATES: TrackTemplate[] = [
  /* ────────────────────────────────────────────────────────────────
     Foundation (mất gốc) — 60h, A1→A2
     The MVP track. We have 80 ASUs seeded for this in PR-B.
     ──────────────────────────────────────────────────────────────── */
  {
    id: "track.foundation.core",
    name_vi: "Nền tảng tiếng Anh từ A1 đến A2",
    description_vi:
      "Phát âm chuẩn, ngữ pháp cơ bản, từ vựng đời sống. Dành cho người mất gốc hoặc người mới bắt đầu.",
    cefr_range: ["A1", "A2"],
    goal: "foundation",
    required_tags: ["goal:foundation"] as SkillTag[],
    preferred_tags: [
      "weakness:pronunciation",
      "weakness:grammar",
      "weakness:vocab",
      "weakness:listening",
      "weakness:speaking",
    ] as SkillTag[],
    estimated_hours: 60,
  },

  /* ────────────────────────────────────────────────────────────────
     Work — placeholder for future content. ASUs not seeded yet.
     ──────────────────────────────────────────────────────────────── */
  {
    id: "track.work.it",
    name_vi: "Tiếng Anh công sở cho dân IT",
    description_vi:
      "Email, stand-up meeting, code review, ngôn ngữ kỹ thuật trong môi trường công ty.",
    cefr_range: ["B1", "B2"],
    goal: "work",
    required_tags: ["goal:work", "industry:it_software"] as SkillTag[],
    preferred_tags: [],
    estimated_hours: 80,
  },

  /* ────────────────────────────────────────────────────────────────
     Exam — placeholder
     ──────────────────────────────────────────────────────────────── */
  {
    id: "track.exam.ielts",
    name_vi: "Luyện IELTS từ 5.0 lên 6.5",
    description_vi:
      "4 kỹ năng Listening, Reading, Writing, Speaking với chiến lược làm bài và bộ từ vựng học thuật.",
    cefr_range: ["B1", "B2"],
    goal: "exam",
    required_tags: ["goal:exam", "exam:ielts"] as SkillTag[],
    preferred_tags: [],
    estimated_hours: 120,
  },

  /* ────────────────────────────────────────────────────────────────
     Travel — placeholder
     ──────────────────────────────────────────────────────────────── */
  {
    id: "track.travel.daily",
    name_vi: "Tiếng Anh giao tiếp du lịch",
    description_vi:
      "Order món, hỏi đường, nhận phòng khách sạn, chat làm quen với người nước ngoài.",
    cefr_range: ["A2", "B1"],
    goal: "travel",
    required_tags: ["goal:travel"] as SkillTag[],
    preferred_tags: [
      "travel:food",
      "travel:directions",
      "travel:shopping",
      "travel:hotel",
      "travel:small_talk",
    ] as SkillTag[],
    estimated_hours: 30,
  },
];

/**
 * Pick the default track for a primary goal. Used when we want to
 * auto-enroll the user after Placement v2.
 */
export function defaultTrackForGoal(
  goal: "work" | "exam" | "foundation" | "travel" | "other",
): TrackTemplate {
  switch (goal) {
    case "work":       return TRACK_TEMPLATES[1];
    case "exam":       return TRACK_TEMPLATES[2];
    case "foundation": return TRACK_TEMPLATES[0];
    case "travel":     return TRACK_TEMPLATES[3];
    default:           return TRACK_TEMPLATES[0]; // foundation as fallback
  }
}

/** Find a track by id. */
export function getTrackById(id: string): TrackTemplate | undefined {
  return TRACK_TEMPLATES.find((t) => t.id === id);
}

/** All tracks of a given goal (in case we want to show alternates). */
export function getTracksByGoal(
  goal: "work" | "exam" | "foundation" | "travel" | "other",
): TrackTemplate[] {
  return TRACK_TEMPLATES.filter((t) => t.goal === goal);
}
