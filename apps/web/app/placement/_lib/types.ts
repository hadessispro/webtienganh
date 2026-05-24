/**
 * Path: apps/web/app/placement/_lib/types.ts
 *
 * Placement v2 — multi-stage assessment.
 * Old flow (v1): splash → picker → quiz → result    (only collected CEFR)
 * New flow (v2): splash → why → goal-context → time → quiz → calibration → result
 *
 * Each stage answers ONE question the recommendation engine needs:
 *   why          → user.primary_goal  (work/exam/foundation/travel)
 *   goal-context → user.goal_context  (which industry/exam/weakness/etc)
 *   time         → user.daily_minutes (5/15/30/60)
 *   quiz         → user.cefr          (A1..C2)
 *   calibration  → user.error_patterns (3 sample skills that detect weakness)
 *
 * Result: a LearnerProfile rich enough for the recommender to pick
 * the right 5 ASUs out of a pool of ~5,000.
 */

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Skill = "grammar" | "listening" | "vocab" | "speaking";

export type QuestionType = "grammar" | "vocab" | "listening" | "fill_blank" | "natural";

/* ────────────────────────────────────────────────────────────────────
   STAGE 1 — Why are you learning?
   ──────────────────────────────────────────────────────────────────── */

export type PrimaryGoal = "work" | "exam" | "foundation" | "travel" | "other";

export const PRIMARY_GOALS: Array<{
  id: PrimaryGoal;
  emoji: string;
  vi: string;
  desc: string;
}> = [
  { id: "work",       emoji: "🏢", vi: "Cho công việc",         desc: "Email, meeting, đồng nghiệp nước ngoài" },
  { id: "exam",       emoji: "🎓", vi: "Thi / chứng chỉ",        desc: "IELTS, TOEIC, VSTEP, đại học" },
  { id: "foundation", emoji: "💪", vi: "Mất gốc / căn bản",      desc: "Quên hết, muốn học lại từ đầu" },
  { id: "travel",     emoji: "🌍", vi: "Du lịch / giao tiếp",    desc: "Order món, hỏi đường, chat với bạn" },
  { id: "other",      emoji: "✨", vi: "Lý do khác",             desc: "Tôi sẽ tự mô tả sau" },
];

/* ────────────────────────────────────────────────────────────────────
   STAGE 2 — Goal context (depends on Stage 1 choice)
   ──────────────────────────────────────────────────────────────────── */

export type Industry =
  | "it_software"
  | "finance"
  | "sales_marketing"
  | "healthcare"
  | "education"
  | "manufacturing"
  | "retail_fnb"
  | "logistics"
  | "creative_design"
  | "other_industry";

export const INDUSTRIES: Array<{ id: Industry; vi: string; emoji: string }> = [
  { id: "it_software",      vi: "IT / Lập trình",         emoji: "💻" },
  { id: "finance",          vi: "Tài chính / Kế toán",    emoji: "📊" },
  { id: "sales_marketing",  vi: "Sales / Marketing",      emoji: "📈" },
  { id: "healthcare",       vi: "Y tế",                   emoji: "⚕️" },
  { id: "education",        vi: "Giáo dục",               emoji: "📚" },
  { id: "manufacturing",    vi: "Sản xuất / Kỹ thuật",    emoji: "🏭" },
  { id: "retail_fnb",       vi: "Bán lẻ / F&B",           emoji: "🛍️" },
  { id: "logistics",        vi: "Logistics / Xuất nhập",  emoji: "📦" },
  { id: "creative_design",  vi: "Sáng tạo / Thiết kế",    emoji: "🎨" },
  { id: "other_industry",   vi: "Ngành khác",             emoji: "🌀" },
];

export type ExamType = "ielts" | "toeic" | "vstep" | "university_entrance" | "other_exam";

export const EXAMS: Array<{ id: ExamType; vi: string; max: number; defaultTarget: number }> = [
  { id: "ielts",                vi: "IELTS",              max: 9,    defaultTarget: 65   },
  { id: "toeic",                vi: "TOEIC",              max: 990,  defaultTarget: 750  },
  { id: "vstep",                vi: "VSTEP",              max: 10,   defaultTarget: 7    },
  { id: "university_entrance",  vi: "ĐH / THPT",          max: 10,   defaultTarget: 8    },
  { id: "other_exam",           vi: "Kỳ thi khác",        max: 100,  defaultTarget: 70   },
];

export type FoundationWeakness = "pronunciation" | "grammar" | "listening" | "vocab" | "speaking";

export const FOUNDATION_WEAKNESSES: Array<{ id: FoundationWeakness; vi: string; emoji: string }> = [
  { id: "pronunciation", vi: "Phát âm",       emoji: "🗣️" },
  { id: "grammar",       vi: "Ngữ pháp",      emoji: "📐" },
  { id: "listening",     vi: "Nghe hiểu",     emoji: "👂" },
  { id: "vocab",         vi: "Từ vựng",       emoji: "🧠" },
  { id: "speaking",      vi: "Nói / phản xạ", emoji: "💬" },
];

export type TravelFocus = "food" | "directions" | "shopping" | "hotel" | "small_talk";

export const TRAVEL_FOCUSES: Array<{ id: TravelFocus; vi: string; emoji: string }> = [
  { id: "food",        vi: "Order món ăn",       emoji: "🍜" },
  { id: "directions",  vi: "Hỏi đường",          emoji: "🗺️" },
  { id: "shopping",    vi: "Mua sắm",            emoji: "🛒" },
  { id: "hotel",       vi: "Khách sạn",          emoji: "🏨" },
  { id: "small_talk",  vi: "Chat làm quen",      emoji: "🤝" },
];

/**
 * The goal_context is a discriminated union — exactly ONE field is
 * filled, matching the primary_goal selected in stage 1.
 */
export type GoalContext =
  | { kind: "work";        industry: Industry; role?: string }
  | { kind: "exam";        exam: ExamType; targetScore: number; deadlineISO?: string }
  | { kind: "foundation";  weaknesses: FoundationWeakness[] }   // can pick multiple
  | { kind: "travel";      focuses: TravelFocus[] }
  | { kind: "other";       note?: string };

/* ────────────────────────────────────────────────────────────────────
   STAGE 3 — Time budget
   ──────────────────────────────────────────────────────────────────── */

export type DailyMinutes = 10 | 20 | 30 | 60;

export const DAILY_OPTIONS: Array<{
  id: DailyMinutes;
  vi: string;
  desc: string;
  emoji: string;
}> = [
  { id: 10, vi: "5–10 phút",    desc: "Lite · vài phút giờ giải lao",         emoji: "☕" },
  { id: 20, vi: "15–20 phút",   desc: "Regular · 1 session ngắn mỗi ngày",   emoji: "⏱️" },
  { id: 30, vi: "30 phút",      desc: "Focused · nghiêm túc nhưng vừa",       emoji: "🎯" },
  { id: 60, vi: "60+ phút",     desc: "Immersive · luyện chăm chỉ",           emoji: "🔥" },
];

/* ────────────────────────────────────────────────────────────────────
   STAGE 4 — Quiz (unchanged from v1)
   ──────────────────────────────────────────────────────────────────── */

export interface PlacementQuestion {
  id: string;
  level: CEFRLevel;
  type: QuestionType;
  skill: Skill;
  prompt: string;
  audioText?: string;
  options: string[];
  answerIndex: number;
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

/* ────────────────────────────────────────────────────────────────────
   STAGE 5 — Calibration (3 sample skills to detect error patterns)
   ──────────────────────────────────────────────────────────────────── */

/**
 * Error pattern tags. These match the tags on ASUs so the recommender
 * can boost ASUs targeting the user's weak spots.
 *
 * Inspired by Cambridge English Profile (CEP) error taxonomy.
 */
export type ErrorPattern =
  | "articles"           // "I went to a hospital" vs "to hospital"
  | "verb_tense"         // simple past vs present perfect
  | "prepositions"       // "depend of" vs "depend on"
  | "word_order"         // "always I go" vs "I always go"
  | "subject_verb_agree" // "he go" vs "he goes"
  | "plurals"            // "two child" vs "two children"
  | "phrasal_verbs"      // didn't recognize "put up with"
  | "false_friends"      // "actually" ≠ "thực ra"
  | "pronunciation_th"   // "tree" ≠ "three"
  | "pronunciation_endings" // missing -s, -ed endings
  | "listening_speed"    // slowed down → got it
  | "vocab_range";       // too narrow

export const ERROR_PATTERN_LABELS: Record<ErrorPattern, string> = {
  articles: "Mạo từ (a/an/the)",
  verb_tense: "Thì động từ",
  prepositions: "Giới từ",
  word_order: "Trật tự câu",
  subject_verb_agree: "Chủ ngữ - động từ",
  plurals: "Danh từ số nhiều",
  phrasal_verbs: "Cụm động từ (phrasal verbs)",
  false_friends: "Từ dễ nhầm nghĩa",
  pronunciation_th: "Âm /θ/ /ð/",
  pronunciation_endings: "Đuôi -s, -ed",
  listening_speed: "Tốc độ nghe",
  vocab_range: "Vốn từ vựng",
};

export interface CalibrationQuestion {
  id: string;
  level: CEFRLevel;
  prompt: string;
  options: string[];
  answerIndex: number;
  /** Which error pattern this question DETECTS if user gets wrong. */
  detectsIfWrong: ErrorPattern;
  explainVi: string;
}

export interface CalibrationAnswer {
  questionId: string;
  detectsIfWrong: ErrorPattern;
  correct: boolean;
}

/* ────────────────────────────────────────────────────────────────────
   STAGE machine
   ──────────────────────────────────────────────────────────────────── */

export type PlacementStage =
  | "splash"
  | "why"
  | "goal-context"
  | "time"
  | "picker"          // optional level picker (skip-quiz path)
  | "quiz"
  | "calibration"
  | "result";

export interface PlacementState {
  stage: PlacementStage;
  // Stage 1
  primaryGoal: PrimaryGoal | null;
  // Stage 2
  goalContext: GoalContext | null;
  // Stage 3
  dailyMinutes: DailyMinutes | null;
  // Stage 4 (quiz)
  selectedLevel: CEFRLevel | null;
  testedLevel: CEFRLevel | null;
  answers: PlacementAnswer[];
  skillScores: SkillScores;
  // Stage 5
  calibrationAnswers: CalibrationAnswer[];
  errorPatterns: ErrorPattern[];
}

export type PlacementAction =
  | { type: "SPLASH_DONE" }
  | { type: "WHY_PICK"; goal: PrimaryGoal }
  | { type: "WHY_BACK" }
  | { type: "GOAL_CTX_PICK"; context: GoalContext }
  | { type: "GOAL_CTX_BACK" }
  | { type: "TIME_PICK"; minutes: DailyMinutes }
  | { type: "TIME_BACK" }
  | { type: "PICK_LEVEL"; level: CEFRLevel }      // legacy skip-quiz path
  | { type: "START_TEST" }
  | {
      type: "QUIZ_DONE";
      level: CEFRLevel;
      answers: PlacementAnswer[];
      skillScores: SkillScores;
    }
  | {
      type: "CALIBRATION_DONE";
      answers: CalibrationAnswer[];
      patterns: ErrorPattern[];
    }
  | { type: "SKIP_CALIBRATION" }
  | { type: "RESTART" };

/* ────────────────────────────────────────────────────────────────────
   CEFR helpers (unchanged)
   ──────────────────────────────────────────────────────────────────── */

export const CEFR_ORDER: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const CEFR_LABELS: Record<CEFRLevel, { vi: string; en: string }> = {
  A1: { vi: "Mới bắt đầu",  en: "Beginner" },
  A2: { vi: "Cơ bản",        en: "Elementary" },
  B1: { vi: "Trung cấp",     en: "Intermediate" },
  B2: { vi: "Khá",           en: "Upper-Int." },
  C1: { vi: "Thành thạo",    en: "Advanced" },
  C2: { vi: "Bậc thầy",      en: "Mastery" },
};

export function levelUp(level: CEFRLevel): CEFRLevel {
  const idx = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER[Math.min(idx + 1, CEFR_ORDER.length - 1)];
}

export function levelDown(level: CEFRLevel): CEFRLevel {
  const idx = CEFR_ORDER.indexOf(level);
  return CEFR_ORDER[Math.max(idx - 1, 0)];
}
