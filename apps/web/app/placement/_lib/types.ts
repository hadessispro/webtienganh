/**
 * Path: apps/web/app/placement/_lib/types.ts
 */

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Skill = "grammar" | "listening" | "vocab" | "speaking";

export type QuestionType = "grammar" | "vocab" | "listening" | "fill_blank" | "natural";

export interface PlacementQuestion {
  id: string;
  level: CEFRLevel;
  type: QuestionType;
  skill: Skill;
  prompt: string;
  /** Optional audio src for listening questions (Web Speech TTS in MVP). */
  audioText?: string;
  options: string[];
  /** Index of correct option. */
  answerIndex: number;
  /** Vietnamese short explanation shown after answering. */
  explainVi: string;
}

export interface PlacementAnswer {
  questionId: string;
  level: CEFRLevel;
  skill: Skill;
  selectedIndex: number;
  correct: boolean;
  timeMs: number;
}

export interface SkillScores {
  grammar: number;
  listening: number;
  vocab: number;
  speaking: number;
}

export type PlacementStage = "splash" | "picker" | "quiz" | "result";

export interface PlacementState {
  stage: PlacementStage;
  selectedLevel: CEFRLevel | null;
  testedLevel: CEFRLevel | null;
  answers: PlacementAnswer[];
  skillScores: SkillScores;
}

export type PlacementAction =
  | { type: "SPLASH_DONE" }
  | { type: "PICK_LEVEL"; level: CEFRLevel }
  | { type: "START_TEST" }
  | {
      type: "QUIZ_DONE";
      level: CEFRLevel;
      answers: PlacementAnswer[];
      skillScores: SkillScores;
    }
  | { type: "RESTART" };

export const CEFR_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const CEFR_LABELS: Record<CEFRLevel, { vi: string; en: string }> = {
  A1: { vi: "Mới bắt đầu", en: "Beginner" },
  A2: { vi: "Cơ bản", en: "Elementary" },
  B1: { vi: "Trung cấp", en: "Intermediate" },
  B2: { vi: "Khá", en: "Upper-Int." },
  C1: { vi: "Thành thạo", en: "Advanced" },
  C2: { vi: "Bậc thầy", en: "Mastery" },
};

/** Adaptive helpers */
export function levelUp(level: CEFRLevel): CEFRLevel {
  const idx = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER[Math.min(idx + 1, CEFR_ORDER.length - 1)];
}

export function levelDown(level: CEFRLevel): CEFRLevel {
  const idx = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER[Math.max(idx - 1, 0)];
}
