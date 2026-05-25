/**
 * Path: apps/web/app/lib/learning-paths.ts
 *
 * Hành trình học (learning paths) — the path-style view layer for
 * Khóa học and Bài học tabs.
 *
 * A "mạch" (path) is a series of CEFR-stepped courses on the same
 * theme: e.g. Giao tiếp công việc has Work Starter (A1) → Work A2 →
 * Meeting Fluency (B1) → Pro Business (B2) → Exec English (C1).
 *
 * Each Course inside a path maps to:
 *   - A CEFR level (its key constraint)
 *   - A set of ASU tags it owns from FOUNDATION_SEED
 *   - A lesson count derived dynamically from how many ASUs match
 *
 * Status is computed from user's profile + SkillState:
 *   - locked       → previous course in same path not done yet
 *   - active       → previous course done (or this is the first) and
 *                    not done yet
 *   - in-progress  → some ASUs have state > 0
 *   - done         → all matching ASUs have decayedStrength >= 0.7
 *
 * Reason this lives in its own file: both LessonsViewV2 (path-style
 * lessons within a course) and CoursesViewV2 (path of courses) read
 * the same definitions.
 */

import type { CEFRLevel, PrimaryGoal } from "../placement/_lib/types";

export interface PathCourse {
  /** Stable id for state */
  id: string;
  /** Display name, Vietnamese-friendly English */
  name: string;
  /** CEFR level this course gates */
  level: CEFRLevel;
  /** Tags any ASU MUST contain to count as part of this course */
  requiredTags: string[];
  /** Tags optional — bonus filter (not enforced) */
  preferredTags?: string[];
}

export interface LearningPath {
  /** Stable id */
  id: string;
  /** Vietnamese title shown above the row */
  nameVi: string;
  /** One-emoji icon */
  emoji: string;
  /** Which user primaryGoals this path is most relevant for */
  goals: PrimaryGoal[];
  /** Ordered courses from easiest to hardest */
  courses: PathCourse[];
}

/**
 * Three paths, designed so any placement profile (foundation / work /
 * exam / travel) has a primary path AND can see the others as
 * "ngoài lề" exploration.
 *
 * NOTE: ASU counts shown in UI come from filtering FOUNDATION_SEED at
 * render time; the names "22 bài học" etc. shown in the screenshot are
 * illustrative — actual counts will be computed live.
 */
export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "path.work",
    nameVi: "Giao tiếp công việc",
    emoji: "💼",
    goals: ["work"],
    courses: [
      {
        id: "course.work.a1",
        name: "Work Talk Starter",
        level: "A1",
        requiredTags: ["level:A1"],
        preferredTags: ["goal:foundation"],
      },
      {
        id: "course.work.a2",
        name: "Work Talk A2",
        level: "A2",
        requiredTags: ["level:A2"],
        preferredTags: ["goal:foundation"],
      },
      {
        id: "course.work.b1",
        name: "Meeting Fluency",
        level: "B1",
        requiredTags: ["level:B1"],
      },
      {
        id: "course.work.b2",
        name: "Pro Business",
        level: "B2",
        requiredTags: ["level:B2"],
      },
      {
        id: "course.work.c1",
        name: "Exec English",
        level: "C1",
        requiredTags: ["level:C1"],
      },
    ],
  },
  {
    id: "path.exam",
    nameVi: "Luyện thi (IELTS)",
    emoji: "🎯",
    goals: ["exam"],
    courses: [
      {
        id: "course.exam.a2",
        name: "Foundation A2",
        level: "A2",
        requiredTags: ["level:A2"],
      },
      {
        id: "course.exam.b1",
        name: "IELTS Foundation",
        level: "B1",
        requiredTags: ["level:B1"],
      },
      {
        id: "course.exam.b2",
        name: "IELTS Booster",
        level: "B2",
        requiredTags: ["level:B2"],
      },
      {
        id: "course.exam.c1",
        name: "IELTS Mastery",
        level: "C1",
        requiredTags: ["level:C1"],
      },
    ],
  },
  {
    id: "path.foundation",
    nameVi: "Nền tảng & Phản xạ",
    emoji: "🏗️",
    goals: ["foundation", "travel", "other"],
    courses: [
      {
        id: "course.found.a1",
        name: "English Starter",
        level: "A1",
        requiredTags: ["level:A1", "goal:foundation"],
      },
      {
        id: "course.found.a2",
        name: "Grammar Build",
        level: "A2",
        requiredTags: ["level:A2", "goal:foundation"],
      },
      {
        id: "course.found.b1",
        name: "Daily Fluency",
        level: "B1",
        requiredTags: ["level:B1"],
      },
      {
        id: "course.found.b2",
        name: "Smooth Conversation",
        level: "B2",
        requiredTags: ["level:B2"],
      },
    ],
  },
];

/**
 * Returns paths in display order:
 *   - User's primary-goal path first (always visible + most "open")
 *   - Other paths after (browseable but courses lock as usual)
 */
export function orderedPathsFor(goal: PrimaryGoal): LearningPath[] {
  const primary = LEARNING_PATHS.filter((p) => p.goals.includes(goal));
  const rest = LEARNING_PATHS.filter((p) => !p.goals.includes(goal));
  return [...primary, ...rest];
}
