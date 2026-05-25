/**
 * Path: apps/web/app/lib/shadowing-topics.ts
 *
 * Topic library for the Shadowing feature.
 *
 * Each topic maps to:
 *   - A search query that biases YouTube toward useful clips
 *   - A target CEFR range (so we don't surface C1 lectures to A1 users)
 *   - A primary goal (foundation / work / exam / travel / other)
 *   - Tag overlap with the ASU recommender (`shadowing:<topic_id>` tags
 *     get added to the user's recommender profile when they practice)
 *
 * Why this exists (this file fixes the previous shadowing screen):
 *   Before — Antigravity hardcoded 4 topics (Business / Job Interview
 *   / TED / Daily) regardless of who you are. A user that picked "mất
 *   gốc / căn bản" in placement v2 would see "TED Talks" as a suggestion
 *   and immediately drown. After — we filter the topic list to ones
 *   appropriate for the user's primaryGoal AND cefr, then we surface
 *   the right ones.
 */

import type { CEFRLevel, PrimaryGoal } from "../placement/_lib/types";

export interface ShadowingTopic {
  id: string;
  /** Vietnamese label shown to user */
  labelVi: string;
  /** Short helper line under the title */
  descVi: string;
  /** Emoji shown on the card */
  emoji: string;
  /** Which primaryGoals this topic is for. ["*"] = all */
  goals: Array<PrimaryGoal | "*">;
  /** CEFR levels this topic fits. ["A1","A2"] etc */
  levels: CEFRLevel[];
  /** YouTube search query — keep it tight (3-5 words) */
  searchQuery: string;
  /** ASU tags added to recommender profile when used */
  asuTags: string[];
}

export const SHADOWING_TOPICS: ShadowingTopic[] = [
  // ─── Foundation (mất gốc / căn bản) ────────────────────────────
  {
    id: "intro-greetings",
    labelVi: "Chào hỏi & giới thiệu",
    descVi: "Hello, How are you, Nice to meet you",
    emoji: "👋",
    goals: ["foundation"],
    levels: ["A1", "A2"],
    searchQuery: "english greetings beginner conversation slow",
    asuTags: ["goal:foundation", "weakness:speaking"],
  },
  {
    id: "daily-routine",
    labelVi: "Sinh hoạt hàng ngày",
    descVi: "Wake up, eat, work, sleep — câu thường gặp",
    emoji: "☀️",
    goals: ["foundation"],
    levels: ["A1", "A2"],
    searchQuery: "daily routine english A1 beginner",
    asuTags: ["goal:foundation"],
  },
  {
    id: "numbers-time",
    labelVi: "Số đếm, giờ giấc",
    descVi: "Numbers, time, dates, prices",
    emoji: "🔢",
    goals: ["foundation"],
    levels: ["A1", "A2"],
    searchQuery: "english numbers time beginner",
    asuTags: ["goal:foundation"],
  },
  {
    id: "small-talk",
    labelVi: "Trò chuyện ngắn",
    descVi: "Weather, weekend plans, simple questions",
    emoji: "💬",
    goals: ["foundation", "travel"],
    levels: ["A2", "B1"],
    searchQuery: "english small talk easy conversation",
    asuTags: ["goal:foundation", "travel:small_talk"],
  },

  // ─── Travel ──────────────────────────────────────────────────
  {
    id: "restaurant-ordering",
    labelVi: "Order món ở nhà hàng",
    descVi: "Menu, hỏi giá, gọi đồ ăn nước uống",
    emoji: "🍜",
    goals: ["travel", "foundation"],
    levels: ["A2", "B1"],
    searchQuery: "ordering food restaurant english conversation",
    asuTags: ["travel:food"],
  },
  {
    id: "asking-directions",
    labelVi: "Hỏi đường",
    descVi: "Excuse me, where is..., turn left/right",
    emoji: "🗺️",
    goals: ["travel", "foundation"],
    levels: ["A2", "B1"],
    searchQuery: "asking directions english travel conversation",
    asuTags: ["travel:directions"],
  },
  {
    id: "hotel-checkin",
    labelVi: "Nhận phòng khách sạn",
    descVi: "Reservation, check-in, ask for help",
    emoji: "🏨",
    goals: ["travel"],
    levels: ["A2", "B1", "B2"],
    searchQuery: "hotel check in english conversation",
    asuTags: ["travel:hotel"],
  },
  {
    id: "shopping-haggling",
    labelVi: "Mua sắm, hỏi giá",
    descVi: "How much, discount, sizes, payment",
    emoji: "🛒",
    goals: ["travel"],
    levels: ["A2", "B1"],
    searchQuery: "shopping english conversation",
    asuTags: ["travel:shopping"],
  },

  // ─── Work ────────────────────────────────────────────────────
  {
    id: "office-meetings",
    labelVi: "Họp công ty",
    descVi: "Status updates, opinions, scheduling",
    emoji: "💼",
    goals: ["work"],
    levels: ["B1", "B2", "C1"],
    searchQuery: "business english meeting conversation",
    asuTags: ["goal:work"],
  },
  {
    id: "job-interview",
    labelVi: "Phỏng vấn xin việc",
    descVi: "Tell me about yourself, strengths, salary",
    emoji: "🤝",
    goals: ["work"],
    levels: ["B1", "B2", "C1"],
    searchQuery: "job interview english questions answers",
    asuTags: ["goal:work"],
  },
  {
    id: "code-review-it",
    labelVi: "Code review (IT)",
    descVi: "Stand-up, PR comments, debugging",
    emoji: "💻",
    goals: ["work"],
    levels: ["B1", "B2"],
    searchQuery: "software engineer stand up meeting english",
    asuTags: ["goal:work", "industry:it_software"],
  },

  // ─── Exam ────────────────────────────────────────────────────
  {
    id: "ielts-speaking",
    labelVi: "IELTS Speaking Part 2",
    descVi: "Long turn 2-phút theo cue card",
    emoji: "🎓",
    goals: ["exam"],
    levels: ["B1", "B2", "C1"],
    searchQuery: "ielts speaking part 2 sample answer",
    asuTags: ["exam:ielts"],
  },
  {
    id: "ielts-listening",
    labelVi: "Luyện nghe theo IELTS",
    descVi: "Native accents, academic vocab",
    emoji: "🎧",
    goals: ["exam"],
    levels: ["B1", "B2", "C1"],
    searchQuery: "ielts listening practice slow",
    asuTags: ["exam:ielts", "weakness:listening"],
  },
  {
    id: "ted-talks",
    labelVi: "TED Talks ngắn",
    descVi: "Bài thuyết trình hay với phụ đề",
    emoji: "🎤",
    goals: ["exam", "*"],
    levels: ["B2", "C1", "C2"],
    searchQuery: "ted talk short english subtitles",
    asuTags: ["weakness:listening"],
  },
];

/**
 * Filter topics for a given user profile. Returns the most appropriate
 * topics, sorted by goal-match first, then by level-match.
 *
 * If the profile is null (user not signed in OR placement not done),
 * we fall back to a safe foundation+travel mix at A2.
 */
export function recommendTopicsFor(opts: {
  primaryGoal: PrimaryGoal | null;
  cefr: CEFRLevel | null;
  maxResults?: number;
}): ShadowingTopic[] {
  const goal = opts.primaryGoal ?? "foundation";
  const level = opts.cefr ?? "A2";
  const max = opts.maxResults ?? 6;

  // Score each topic. Higher = better fit.
  const scored = SHADOWING_TOPICS.map((t) => {
    const goalMatch = t.goals.includes(goal) ? 2 : t.goals.includes("*") ? 1 : 0;
    const levelMatch = t.levels.includes(level) ? 2 : 0;
    return { topic: t, score: goalMatch * 10 + levelMatch };
  });

  // Drop totally-irrelevant ones
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.topic);
}

/**
 * Estimate the CEFR of a clip from its transcript text.
 *
 * Simple heuristic (no ML):
 *   - avg word length
 *   - sentence length
 *   - share of words OUTSIDE Oxford 3000 (proxy: word length > 7)
 *
 * Returns CEFR label. Not perfect but good enough to gate "this is too
 * hard for A1 users" warnings.
 */
export function estimateClipCefr(
  segments: Array<{ text_en: string }>,
): CEFRLevel {
  const allText = segments.map((s) => s.text_en).join(" ");
  const words = allText.toLowerCase().match(/[a-z]+/g) ?? [];
  if (words.length < 8) return "A2";

  const avgWordLen = words.reduce((a, w) => a + w.length, 0) / words.length;
  const longWordShare =
    words.filter((w) => w.length >= 8).length / words.length;
  const sentenceCount = (allText.match(/[.!?]+/g) ?? []).length || 1;
  const avgSentenceLen = words.length / sentenceCount;

  // Composite difficulty score 0..100
  const difficulty =
    avgWordLen * 6 + longWordShare * 100 + avgSentenceLen * 1.2;

  if (difficulty < 40) return "A1";
  if (difficulty < 55) return "A2";
  if (difficulty < 70) return "B1";
  if (difficulty < 85) return "B2";
  if (difficulty < 100) return "C1";
  return "C2";
}

/**
 * Map a topic id back to ASU tags so when a user finishes a shadowing
 * session, the recommender knows what skills they practiced.
 */
export function getAsuTagsForTopic(topicId: string): string[] {
  return SHADOWING_TOPICS.find((t) => t.id === topicId)?.asuTags ?? [];
}
