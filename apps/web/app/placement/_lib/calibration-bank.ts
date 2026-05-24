/**
 * Path: apps/web/app/placement/_lib/calibration-bank.ts
 *
 * Calibration questions: 3-question sample given AFTER the main quiz.
 * Each question is designed to DETECT a specific error pattern if the
 * user gets it wrong — not to assess level.
 *
 * Selection logic: pick 3 questions from this bank such that:
 *   1. Their level matches the testedLevel from quiz.
 *   2. They cover 3 different error patterns (so we detect breadth).
 *   3. If the user has primary_goal="exam", prefer pattern questions
 *      common on that exam (e.g. articles for IELTS Writing).
 *
 * For PoC, we just pick the first 3 at the user's level. Stage-2
 * personalization comes when we have a larger bank.
 */

import type { CalibrationQuestion, ErrorPattern, CEFRLevel } from "./types";

export const CALIBRATION_BANK: CalibrationQuestion[] = [
  // A1-A2 zone — basic detection
  {
    id: "cal-a1-articles",
    level: "A1",
    prompt: "I want to buy ___ apple.",
    options: ["a", "an", "the", "(nothing)"],
    answerIndex: 1,
    detectsIfWrong: "articles",
    explainVi: "Trước nguyên âm dùng 'an'. 'apple' bắt đầu bằng /æ/ → 'an apple'.",
  },
  {
    id: "cal-a1-svagree",
    level: "A1",
    prompt: "She ___ to school every day.",
    options: ["go", "goes", "going", "gone"],
    answerIndex: 1,
    detectsIfWrong: "subject_verb_agree",
    explainVi: "Chủ ngữ ngôi thứ 3 số ít (she/he/it) → động từ thêm -s/-es.",
  },
  {
    id: "cal-a2-tense",
    level: "A2",
    prompt: "Yesterday I ___ a movie with my friends.",
    options: ["watch", "watches", "watched", "watching"],
    answerIndex: 2,
    detectsIfWrong: "verb_tense",
    explainVi: "Yesterday = quá khứ → động từ thêm -ed (regular verbs).",
  },
  {
    id: "cal-a2-plural",
    level: "A2",
    prompt: "There are three ___ in my class.",
    options: ["child", "childs", "children", "childes"],
    answerIndex: 2,
    detectsIfWrong: "plurals",
    explainVi: "'child' là danh từ bất quy tắc → số nhiều là 'children'.",
  },

  // B1 zone
  {
    id: "cal-b1-prep",
    level: "B1",
    prompt: "Success depends ___ hard work.",
    options: ["of", "on", "with", "from"],
    answerIndex: 1,
    detectsIfWrong: "prepositions",
    explainVi: "'depend on' là cụm cố định. 'depend of' là lỗi rất phổ biến của người Việt.",
  },
  {
    id: "cal-b1-wordorder",
    level: "B1",
    prompt: "Choose the correct sentence:",
    options: [
      "Always I drink coffee in the morning.",
      "I always drink coffee in the morning.",
      "I drink always coffee in the morning.",
      "I drink coffee always in the morning.",
    ],
    answerIndex: 1,
    detectsIfWrong: "word_order",
    explainVi: "Trạng từ tần suất (always, often, never...) đứng giữa chủ ngữ và động từ chính.",
  },

  // B2+ zone
  {
    id: "cal-b2-phrasal",
    level: "B2",
    prompt: "I can't ___ his constant complaining anymore.",
    options: ["put off", "put on", "put up with", "put away"],
    answerIndex: 2,
    detectsIfWrong: "phrasal_verbs",
    explainVi: "'put up with' = chịu đựng. Phrasal verbs là điểm yếu phổ biến cấp B2+.",
  },
  {
    id: "cal-b2-falsefriend",
    level: "B2",
    prompt: "Trong câu 'I'm actually a doctor', 'actually' nghĩa là:",
    options: ["thực ra (đính chính)", "hiện tại", "tự động", "đang hoạt động"],
    answerIndex: 0,
    detectsIfWrong: "false_friends",
    explainVi: "'actually' KHÔNG phải 'hiện tại'. Đây là false friend gây hiểu nhầm.",
  },
];

/**
 * Pick 3 calibration questions appropriate for the user's tested CEFR.
 * Returns up to 3 questions. If fewer than 3 are available at that
 * level, falls back to one level below.
 */
export function pickCalibrationSet(level: CEFRLevel, count = 3): CalibrationQuestion[] {
  const atLevel = CALIBRATION_BANK.filter((q) => q.level === level);
  if (atLevel.length >= count) {
    return atLevel.slice(0, count);
  }
  // fall back to anything available, but prefer same or lower level
  const cefrOrder: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const targetIdx = cefrOrder.indexOf(level);
  const sorted = [...CALIBRATION_BANK].sort((a, b) => {
    const da = Math.abs(cefrOrder.indexOf(a.level) - targetIdx);
    const db = Math.abs(cefrOrder.indexOf(b.level) - targetIdx);
    return da - db;
  });
  return sorted.slice(0, count);
}

/**
 * Given calibration answers, produce a deduplicated list of error
 * patterns that were detected (= questions the user got wrong).
 */
export function detectErrorPatterns(
  answers: Array<{ detectsIfWrong: ErrorPattern; correct: boolean }>,
): ErrorPattern[] {
  const set = new Set<ErrorPattern>();
  for (const a of answers) {
    if (!a.correct) set.add(a.detectsIfWrong);
  }
  return Array.from(set);
}
