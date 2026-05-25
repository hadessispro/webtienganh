"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCompletionPercent,
  generateLearningPath,
  generatePracticeTest,
  generateTodayTasks,
  type Goal
} from "../lib/learning-core";
import {
  COURSE_STORAGE_KEY,
  Course,
  LearnerProfile,
  PlacementBand,
  PlacementSkillMap,
  SESSION_STORAGE_KEY,
  createDemoProfile,
  defaultCourses,
  getRecommendedCourseId,
  goalLabels,
  providerLabels
} from "../lib/product-data";
import { CoursePathGrid } from "./CoursePathGrid";
import { CoursesViewV2 } from "./CoursesViewV2";
import { LearningPathsView } from "./LearningPathsView";
import { LessonsViewV2 } from "./LessonsViewV2";
import { PracticeViewV2 } from "./PracticeViewV2";
import { ExamHubV2 } from "./ExamHubV2";
import { PageTopbar } from "./PageTopbar";
import dynamic from "next/dynamic";

const ExamRoom = dynamic(() => import("./ExamRoom").then(mod => mod.ExamRoom), { ssr: false });
import { GroupsView } from "./GroupsView";
import { ShadowingView } from "./ShadowingView";
import { defaultStudyGroups as defaultStudyGroupsV2 } from "../lib/group-data";

gsap.registerPlugin(useGSAP);

type LearningView = "today" | "lesson" | "courses" | "practice" | "exams" | "flashcards" | "shadowing" | "schedule" | "group" | "profile";

type LineIconName =
  | LearningView
  | "play"
  | "search"
  | "audio"
  | "book"
  | "message"
  | "pen"
  | "brain"
  | "sun"
  | "briefcase"
  | "coffee"
  | "phone"
  | "mail"
  | "target"
  | "chart"
  | "folder"
  | "exams"
  | "users";

type ShadowingClip = {
  id: string;
  title: string;
  language: string;
  level: string;
  context: string;
  duration: string;
  icon: string;
  progress: number;
  status: "Đang luyện" | "Mới";
  transcript: string[];
};

type StudyGroup = {
  id: string;
  title: string;
  meta: string;
  tags: string[];
  avatars: string[];
  extraMembers?: number;
  bannerClass: string;
};

type GifOption = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  source: "giphy" | "fallback";
};

type FlashcardStatus = "new" | "learning" | "mastered";
type FlashcardDeckId = "due" | "personal" | "lesson" | "all";
type FlashcardDirection = "front" | "back";
type FlashcardMode = "review" | "speed" | "choice";
type FlashcardSession = {
  cardIds: string[];
  currentIndex: number;
  deckId: FlashcardDeckId;
  direction: FlashcardDirection;
  expiresAt?: string;
  mode: FlashcardMode;
  remembered: number;
  again: number;
  reviewed: number;
  startedAt: string;
  completed: boolean;
};

type PersonalFlashcard = {
  id: string;
  back: string;
  createdAt: string;
  dueAt: string;
  ease: number;
  front: string;
  intervalDays: number;
  level: string;
  note?: string;
  reviewCount: number;
  reviewedAt?: string;
  source: "personal" | "lesson" | "ai";
  status: FlashcardStatus;
  tag: string;
};

type FlashcardDraft = {
  back: string;
  front: string;
  note: string;
  tag: string;
};

type ScheduleStatus = "upcoming" | "done";

type ScheduleEvent = {
  id: string;
  date: string;
  duration: number;
  reminderMinutes: number;
  status: ScheduleStatus;
  sticker: string;
  time: string;
  title: string;
};

type ScheduleDraft = {
  date: string;
  duration: string;
  reminderMinutes: string;
  sticker: string;
  time: string;
  title: string;
};

type CalendarCell = {
  dateKey: string;
  dayNumber: number;
  events: ScheduleEvent[];
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
};

type PlacementSelfLevel = "fresh" | "some" | "confident";

type PlacementQuestion = {
  id: string;
  skill: keyof PlacementSkillMap;
  prompt: string;
  options: string[];
  answer: string;
};

type PlacementResult = {
  band: PlacementBand;
  courseId: string;
  dailyMinutes: number;
  goal: Goal;
  language: string;
  level: string;
  score: number;
  skillMap: PlacementSkillMap;
};

const placementLanguages = ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hàn"];

const placementGoalOptions: Array<{ id: Goal; label: string; detail: string }> = [
  { id: "work", label: "Công việc", detail: "Meeting, email, phản xạ nói" },
  { id: "exam", label: "Luyện thi", detail: "Reading, listening, từ vựng" },
  { id: "foundation", label: "Nền tảng", detail: "Ngữ pháp, nghe chậm, flashcard" }
];

const placementSelfLevels: Array<{ id: PlacementSelfLevel; label: string; detail: string; value: number }> = [
  { id: "fresh", label: "Mới bắt đầu", detail: "Cần học từ gốc", value: 0 },
  { id: "some", label: "Đã học qua", detail: "Hiểu câu ngắn", value: 1 },
  { id: "confident", label: "Tự tin cơ bản", detail: "Nói/đọc được tình huống quen", value: 2 }
];

const placementQuestions: PlacementQuestion[] = [
  {
    id: "grammar-agree",
    skill: "grammar",
    prompt: "Fix: 'I am agree with this plan.'",
    options: ["I agree with this plan.", "I am agreed this plan.", "I agreeing with this plan."],
    answer: "I agree with this plan."
  },
  {
    id: "vocab-deadline",
    skill: "vocabulary",
    prompt: "Deadline nghĩa gần nhất là gì?",
    options: ["Hạn chót", "Lịch họp", "Người phản hồi"],
    answer: "Hạn chót"
  },
  {
    id: "speaking-update",
    skill: "speaking",
    prompt: "Chọn câu trả lời tự nhiên: 'Can you give us a quick update?'",
    options: ["Sure. I finished the first part and I am checking the final details.", "Yes update quick now yesterday.", "I don't know all update."],
    answer: "Sure. I finished the first part and I am checking the final details."
  },
  {
    id: "listening-quarter",
    skill: "listening",
    prompt: "Transcript: 'The train leaves at quarter past nine.'",
    options: ["9:15", "9:45", "8:45"],
    answer: "9:15"
  },
  {
    id: "grammar-present",
    skill: "grammar",
    prompt: "Fill in: She ___ coffee every morning.",
    options: ["drinks", "drink", "is drink"],
    answer: "drinks"
  }
];

const placementBandLabels: Record<PlacementBand, string> = {
  starter: "Xây nền",
  building: "Đang lên nhịp",
  ready: "Sẵn sàng tăng tốc"
};

const navItems: Array<{ id: LearningView; label: string }> = [
  { id: "today", label: "Hôm nay" },
  { id: "lesson", label: "Bài học" },
  { id: "courses", label: "Khóa học" },
  { id: "practice", label: "Luyện phản xạ" },
  { id: "exams", label: "Kho đề thi" },
  { id: "flashcards", label: "Flashcard" },
  { id: "shadowing", label: "Shadowing" },
  { id: "schedule", label: "Lịch học" },
  { id: "group", label: "Nhóm" }
];

const FLASHCARD_STORAGE_KEY = "lumalang.flashcards.v1";
const SCHEDULE_STORAGE_KEY = "lumalang.schedule.v1";

const scheduleEmojiCategories = [
  {
    id: "smileys",
    label: "Mặt cười và hình người",
    icon: "😊",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "😐", "😑", "😶", "😌", "😔", "😪", "🤓"]
  },
  {
    id: "study",
    label: "Học tập",
    icon: "📘",
    emojis: ["📘", "📗", "📕", "📙", "📚", "📖", "📝", "✍️", "🖊️", "🖋️", "✏️", "📌", "📎", "🗂️", "📁", "🧠", "🎧", "🎙️", "🗣️", "💬", "🔤", "🔡", "🔠", "📊", "📈", "🧩", "🧪", "🧮", "💡", "🔎", "🏫", "🎓"]
  },
  {
    id: "time",
    label: "Thời gian và nhắc lịch",
    icon: "⏰",
    emojis: ["⏰", "⏱️", "⏲️", "🕰️", "⌛", "⏳", "📅", "📆", "🗓️", "🌅", "🌞", "🌙", "⭐", "✨", "🔥", "✅", "☑️", "🔔", "📍", "🚩", "🎯", "🏁", "🔁", "🟢", "🟡", "🔴", "💤", "⚡"]
  },
  {
    id: "places",
    label: "Địa điểm và hoạt động",
    icon: "📍",
    emojis: ["🏠", "🏢", "🏫", "☕", "🍵", "🥤", "🍽️", "🚶", "🏃", "🧘", "🎮", "🎬", "🎵", "🎤", "🛫", "🚆", "🚌", "🚕", "🗺️", "📍", "🧳", "💼", "🖥️", "💻", "📱", "🎒", "🪴", "🌳"]
  }
] as const;

const scheduleStickerOptions = scheduleEmojiCategories.flatMap((category) => category.emojis);
type ScheduleEmojiCategoryId = (typeof scheduleEmojiCategories)[number]["id"];

const courseJourneySkins = [
  {
    accent: "#2f8f4b",
    alt: "#8acb9a",
    emoji: "🌿",
    name: "Focus Grove",
    tone: "forest"
  },
  {
    accent: "#ef8f48",
    alt: "#ffbd77",
    emoji: "☕",
    name: "Meeting Camp",
    tone: "sunset"
  },
  {
    accent: "#4d9bc1",
    alt: "#a9d4e6",
    emoji: "🎧",
    name: "Listening Bay",
    tone: "blue"
  },
  {
    accent: "#9d61c8",
    alt: "#d4a8e9",
    emoji: "✨",
    name: "Fluency Ridge",
    tone: "violet"
  }
] as const;

const journeyLessonSteps = [
  { label: "Warm-up", detail: "3 phút khởi động", icon: "🌱" },
  { label: "Input", detail: "Nghe/đọc mẫu chuẩn", icon: "📘" },
  { label: "Practice", detail: "Roleplay hoặc quiz", icon: "🎙️" },
  { label: "Memory", detail: "Đẩy thẻ vào SRS", icon: "🧠" }
] as const;

const defaultFlashcards: PersonalFlashcard[] = [
  {
    id: "fc-deadline",
    front: "deadline",
    back: "hạn chót",
    note: "We need to finish before the deadline.",
    tag: "Work vocab",
    level: "A2",
    source: "lesson",
    status: "new",
    ease: 2.3,
    intervalDays: 0,
    reviewCount: 0,
    dueAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "fc-feedback",
    front: "feedback",
    back: "góp ý, phản hồi",
    note: "Could you give me feedback on this draft?",
    tag: "Work vocab",
    level: "A2",
    source: "lesson",
    status: "learning",
    ease: 2.5,
    intervalDays: 1,
    reviewCount: 1,
    dueAt: "2026-01-01T00:00:00.000Z",
    reviewedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "fc-follow-up",
    front: "follow up",
    back: "liên hệ/kiểm tra lại sau đó",
    note: "I will follow up after the meeting.",
    tag: "Meeting",
    level: "B1",
    source: "lesson",
    status: "new",
    ease: 2.4,
    intervalDays: 0,
    reviewCount: 0,
    dueAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z"
  }
];

const todayVocabularySeeds: Array<Pick<PersonalFlashcard, "back" | "front" | "note" | "tag">> = [
  { front: "catch up", back: "bắt kịp, cập nhật tình hình", note: "Let's catch up after lunch.", tag: "Meeting" },
  { front: "workload", back: "khối lượng công việc", note: "My workload is heavy this week.", tag: "Work vocab" },
  { front: "quick update", back: "cập nhật nhanh", note: "Can you give us a quick update?", tag: "Speaking" }
];

const flashcardDeckOptions: Array<{ id: FlashcardDeckId; label: string; detail: string }> = [
  { id: "due", label: "Ôn đến hạn", detail: "Chỉ lấy thẻ cần nhớ hôm nay" },
  { id: "personal", label: "Tủ riêng", detail: "Thẻ người học tự thêm" },
  { id: "lesson", label: "Từ bài học", detail: "Từ vựng lưu từ lộ trình" },
  { id: "all", label: "Trộn tất cả", detail: "Xáo toàn bộ thẻ chưa khóa" }
];

const flashcardModeOptions: Array<{ id: FlashcardMode; label: string; detail: string }> = [
  { id: "review", label: "Ghi nhớ tự do", detail: "Không giới hạn thời gian, lật thẻ và tự chấm nhớ" },
  { id: "speed", label: "Ôn nhanh", detail: "Đặt thời gian, bộ bài lặp liên tục đến khi hết giờ" },
  { id: "choice", label: "Chọn đáp án", detail: "Tách mặt chữ/nghĩa, xáo lựa chọn từ bộ gốc" }
];

const flashcardSessionSizeOptions = [10, 20, 0];
const flashcardSpeedMinuteOptions = [2, 5, 10];

const shadowingClips: ShadowingClip[] = [
  {
    id: "coffee-shop",
    title: "Coffee shop conversation",
    language: "Tiếng Anh",
    level: "A2",
    context: "Daily",
    duration: "32 giây",
    icon: "☕",
    progress: 78,
    status: "Đang luyện",
    transcript: [
      "Hi, can I get a large latte please?",
      "Yes, oat milk would be great.",
      "Thanks so much, have a nice day!"
    ]
  },
  {
    id: "taking-taxi",
    title: "Taking a taxi",
    language: "Tiếng Anh",
    level: "A2",
    context: "Daily",
    duration: "28 giây",
    icon: "🚕",
    progress: 0,
    status: "Mới",
    transcript: [
      "Could you take me to the station?",
      "How long will it take from here?",
      "Please stop near the main entrance."
    ]
  },
  {
    id: "hotel-check-in",
    title: "Hotel check-in",
    language: "Tiếng Anh",
    level: "B1",
    context: "Travel",
    duration: "45 giây",
    icon: "🏨",
    progress: 42,
    status: "Đang luyện",
    transcript: [
      "Hi, I have a reservation under Nguyen.",
      "Could I see your passport, please?",
      "Your room is ready on the fifth floor."
    ]
  }
];

const studyGroups: StudyGroup[] = [
  {
    id: "office-english-club",
    title: "Office English Club",
    meta: "8 thành viên · B1-B2 · Hoạt động",
    tags: ["Speaking", "Office"],
    avatars: ["LL", "MA", "TH"],
    extraMembers: 5,
    bannerClass: "tile-1"
  },
  {
    id: "ielts-70-buddies",
    title: "IELTS 7.0 Buddies",
    meta: "15 thành viên · B2 · Rất sôi nổi",
    tags: ["IELTS", "Writing"],
    avatars: ["LL", "NA", "PH"],
    extraMembers: 12,
    bannerClass: "tile-2"
  },
  {
    id: "morning-coffee-talk",
    title: "Morning Coffee Talk",
    meta: "4 thành viên · A2-B1 · Yên tĩnh",
    tags: ["Speaking", "Daily"],
    avatars: ["LL", "QU", "VI"],
    bannerClass: "tile-4"
  }
];

const leaderboardRows = [
  { rank: 1, name: "Minh Anh", initials: "MA", score: "94.2", tone: "orange", rankTone: "gold" },
  { rank: 2, name: "Thảo", initials: "TH", score: "91.0", tone: "blue", rankTone: "silver" },
  { rank: 3, name: "Nam", initials: "NA", score: "87.5", tone: "purple", rankTone: "bronze" },
  { rank: 4, name: "Bạn (Luma)", initials: "LL", score: "83.0", tone: "mint", current: true },
  { rank: 5, name: "Phương", initials: "PH", score: "78.8", tone: "yellow" }
];

const calendarDays = [
  { label: "27", state: "muted" },
  { label: "28", state: "muted" },
  { label: "29", state: "muted" },
  { label: "30", state: "muted" },
  { label: "1", state: "completed" },
  { label: "2", state: "completed" },
  { label: "3", state: "completed" },
  { label: "4", state: "completed" },
  { label: "5", state: "completed" },
  { label: "6", state: "completed" },
  { label: "7", state: "completed" },
  { label: "8", state: "completed" },
  { label: "9", state: "completed" },
  { label: "10", state: "completed" },
  { label: "11", state: "completed" },
  { label: "12", state: "today has-event" },
  { label: "13", state: "has-event" },
  { label: "14", state: "has-event" },
  { label: "15", state: "" },
  { label: "16", state: "has-event" },
  { label: "17", state: "" },
  { label: "18", state: "" },
  { label: "19", state: "has-event" },
  { label: "20", state: "" },
  { label: "21", state: "has-event" },
  { label: "22", state: "" },
  { label: "23", state: "has-event" },
  { label: "24", state: "" },
  { label: "25", state: "" },
  { label: "26", state: "" },
  { label: "27", state: "" },
  { label: "28", state: "" },
  { label: "29", state: "" },
  { label: "30", state: "" },
  { label: "31", state: "" }
];

const todayActivities = [
  { time: "09:00", title: "Warm-up", meta: "5 phút · Hoàn thành ✓" },
  { time: "14:30", title: "Quiz Listening", meta: "15 phút · Hoàn thành ✓" },
  { time: "20:30", title: "Shadowing", meta: "10 phút · Sắp tới" }
];

const recentQuizRows: Array<{ icon: LineIconName; name: string; meta: string; score: string }> = [
  { icon: "audio", name: "Listening Practice · Phỏng vấn", meta: "10 câu · 15 phút · Hôm nay 14:20", score: "9.0" },
  { icon: "book", name: "Reading · Email công việc", meta: "8 câu · 12 phút · Hôm qua", score: "7.5" },
  { icon: "message", name: "Speaking · Roleplay khách hàng", meta: "5 tình huống · 10 phút · 2 ngày trước", score: "8.2" },
  { icon: "pen", name: "Writing · Thư xin lỗi", meta: "1 đoạn 150 từ · 3 ngày trước", score: "7.0" },
  { icon: "brain", name: "Grammar · Mệnh đề quan hệ", meta: "20 câu · 18 phút · 4 ngày trước", score: "8.8" }
];

const lessonBadges = ["sun", "briefcase", "coffee", "phone", "mail", "target"] as const;
const quizBadges = ["audio", "book", "message", "pen", "brain"] as const;

function getPlacementCorrectCount(answers: Record<string, string>) {
  return placementQuestions.filter((question) => answers[question.id] === question.answer).length;
}

function getPlacementSkillMap(answers: Record<string, string>): PlacementSkillMap {
  const totals: PlacementSkillMap = { grammar: 0, listening: 0, speaking: 0, vocabulary: 0 };
  const correct: PlacementSkillMap = { grammar: 0, listening: 0, speaking: 0, vocabulary: 0 };

  placementQuestions.forEach((question) => {
    totals[question.skill] += 1;
    if (answers[question.id] === question.answer) {
      correct[question.skill] += 1;
    }
  });

  return {
    grammar: totals.grammar ? Math.round((correct.grammar / totals.grammar) * 100) : 50,
    listening: totals.listening ? Math.round((correct.listening / totals.listening) * 100) : 50,
    speaking: totals.speaking ? Math.round((correct.speaking / totals.speaking) * 100) : 50,
    vocabulary: totals.vocabulary ? Math.round((correct.vocabulary / totals.vocabulary) * 100) : 50
  };
}

function resolvePlacementBand(score: number): PlacementBand {
  if (score >= 6) {
    return "ready";
  }

  if (score >= 3) {
    return "building";
  }

  return "starter";
}

function resolvePlacementLevel(language: string, band: PlacementBand) {
  if (language === "Tiếng Nhật") {
    return band === "ready" ? "N4" : "N5";
  }

  if (language === "Tiếng Hàn") {
    return band === "ready" ? "A2" : "A1";
  }

  if (band === "ready") {
    return "B1";
  }

  return band === "building" ? "A2" : "A1";
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function fromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatClock(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function formatMonthLabel(date: Date) {
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

function formatShortDate(dateKey: string) {
  const date = fromDateKey(dateKey);
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

function getScheduleDateTime(event: ScheduleEvent) {
  return new Date(`${event.date}T${event.time}:00`);
}

function getScheduleComputedStatus(event: ScheduleEvent, now: Date) {
  if (event.status === "done") {
    return "done";
  }

  return getScheduleDateTime(event).getTime() < now.getTime() ? "missed" : "upcoming";
}

function createDefaultScheduleEvents(baseDateKey: string): ScheduleEvent[] {
  const baseDate = fromDateKey(baseDateKey);
  const tomorrowKey = toDateKey(addDays(baseDate, 1));
  const nextPracticeKey = toDateKey(addDays(baseDate, 3));

  return [
    {
      id: "schedule-warmup",
      date: baseDateKey,
      time: "09:00",
      title: "Warm-up",
      duration: 5,
      reminderMinutes: 10,
      sticker: "🌱",
      status: "done"
    },
    {
      id: "schedule-listening",
      date: baseDateKey,
      time: "14:30",
      title: "Quiz Listening",
      duration: 15,
      reminderMinutes: 15,
      sticker: "🎧",
      status: "done"
    },
    {
      id: "schedule-shadowing",
      date: baseDateKey,
      time: "20:30",
      title: "Shadowing",
      duration: 10,
      reminderMinutes: 20,
      sticker: "🗣️",
      status: "upcoming"
    },
    {
      id: "schedule-email",
      date: tomorrowKey,
      time: "20:30",
      title: "Email công việc",
      duration: 12,
      reminderMinutes: 20,
      sticker: "✍️",
      status: "upcoming"
    },
    {
      id: "schedule-review",
      date: nextPracticeKey,
      time: "19:45",
      title: "Ôn flashcard",
      duration: 8,
      reminderMinutes: 10,
      sticker: "📘",
      status: "upcoming"
    }
  ];
}

function buildCalendarCells(monthDate: Date, selectedDateKey: string, events: ScheduleEvent[], now: Date): CalendarCell[] {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = addDays(firstOfMonth, -firstOfMonth.getDay());
  const todayKey = toDateKey(now);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateKey = toDateKey(date);
    return {
      dateKey,
      dayNumber: date.getDate(),
      events: events.filter((event) => event.date === dateKey),
      inMonth: date.getMonth() === monthDate.getMonth(),
      isToday: dateKey === todayKey,
      isSelected: dateKey === selectedDateKey
    };
  });
}

function isFlashcardDue(card: PersonalFlashcard) {
  return card.status !== "mastered" && new Date(card.dueAt).getTime() <= Date.now();
}

function getFlashcardDueLabel(card: PersonalFlashcard) {
  if (isFlashcardDue(card)) {
    return "Đến hạn";
  }

  if (card.status === "mastered") {
    return "Đã nhớ";
  }

  const diffDays = Math.ceil((new Date(card.dueAt).getTime() - Date.now()) / 86_400_000);
  return diffDays <= 1 ? "Ngày mai" : `${diffDays} ngày nữa`;
}

function getFlashcardsForDeck(cards: PersonalFlashcard[], deckId: FlashcardDeckId) {
  if (deckId === "due") {
    return cards.filter(isFlashcardDue);
  }

  if (deckId === "personal") {
    return cards.filter((card) => card.source === "personal");
  }

  if (deckId === "lesson") {
    return cards.filter((card) => card.source === "lesson" || card.source === "ai");
  }

  return cards.filter((card) => card.status !== "mastered");
}

function shuffleFlashcardIds(cards: PersonalFlashcard[]) {
  return [...cards]
    .sort(() => Math.random() - 0.5)
    .map((card) => card.id);
}

function createFlashcard(input: {
  back: string;
  front: string;
  level: string;
  note?: string;
  source?: PersonalFlashcard["source"];
  tag?: string;
}): PersonalFlashcard {
  const now = new Date().toISOString();

  return {
    id: `fc-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    back: input.back.trim(),
    createdAt: now,
    dueAt: now,
    ease: 2.4,
    front: input.front.trim(),
    intervalDays: 0,
    level: input.level,
    note: input.note?.trim() || undefined,
    reviewCount: 0,
    source: input.source ?? "personal",
    status: "new",
    tag: input.tag?.trim() || "Cá nhân"
  };
}

function scheduleFlashcard(card: PersonalFlashcard, rating: "again" | "good" | "easy"): PersonalFlashcard {
  const now = new Date();
  let ease = card.ease;
  let intervalDays = card.intervalDays;
  let nextDue = now.getTime();

  if (rating === "again") {
    ease = Math.max(1.3, ease - 0.2);
    intervalDays = 0;
    nextDue = now.getTime() + 15 * 60_000;
  }

  if (rating === "good") {
    intervalDays = card.reviewCount === 0 ? 1 : Math.max(1, Math.round(Math.max(1, intervalDays) * ease));
    nextDue = now.getTime() + intervalDays * 86_400_000;
  }

  if (rating === "easy") {
    ease = Math.min(3.1, ease + 0.15);
    intervalDays = card.reviewCount === 0 ? 3 : Math.max(3, Math.round(Math.max(1, intervalDays) * (ease + 0.35)));
    nextDue = now.getTime() + intervalDays * 86_400_000;
  }

  return {
    ...card,
    dueAt: new Date(nextDue).toISOString(),
    ease,
    intervalDays,
    reviewedAt: now.toISOString(),
    reviewCount: card.reviewCount + 1,
    status: intervalDays >= 7 ? "mastered" : "learning"
  };
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function createFallbackProfile() {
  return createDemoProfile({
    provider: "gmail",
    name: "Luma Learner",
    email: "learner@gmail.com",
    token: "gmail-oauth-demo-token",
    language: "Tiếng Anh",
    level: "A2",
    goal: "work",
    dailyMinutes: 10
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AvatarContent({ initials, profile }: { initials: string; profile: LearnerProfile }) {
  if (profile.avatarUrl) {
    return <img alt={`Avatar của ${profile.name}`} src={profile.avatarUrl} />;
  }

  return <span>{initials}</span>;
}

function LineIcon({ name }: { name: LineIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.9 };
  const icons = {
    today: <path {...common} d="M3 11.5 12 4l9 7.5M5 10v10h14V10M10 20v-6h4v6" />,
    lesson: <path {...common} d="M4 6h16M4 12h16M4 18h10" />,
    courses: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" {...common} />
        <path {...common} d="M3 10h18" />
      </>
    ),
    practice: <path {...common} d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9zM12 7v5l3 3" />,
    flashcards: (
      <>
        <rect x="5" y="4" width="12" height="15" rx="2" {...common} />
        <path {...common} d="M8 8h6M8 12h5M10 19h7a2 2 0 0 0 2-2V7" />
      </>
    ),
    shadowing: <path {...common} d="m12 3 3 6 6 1-4.5 4.5L18 21l-6-3-6 3 1.5-6.5L3 10l6-1 3-6z" />,
    schedule: <path {...common} d="M8 4v4M16 4v4M4 10h16M6 6h12a2 2 0 0 1 2 2v12H4V8a2 2 0 0 1 2-2z" />,
    group: <path {...common} d="M16 19a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 18a3 3 0 0 0-3-3M18 11a2.5 2.5 0 1 0 0-5" />,
    profile: <path {...common} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0" />,
    play: <path {...common} d="M8 5v14l11-7z" />,
    search: <path {...common} d="m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4z" />,
    audio: <path {...common} d="M4 14v-4M8 17V7M12 19V5M16 17V7M20 14v-4" />,
    book: <path {...common} d="M6 4h9a3 3 0 0 1 3 3v13H8a2 2 0 0 1-2-2zM8 18h10" />,
    message: <path {...common} d="M5 6h14v10H8l-3 3z" />,
    pen: <path {...common} d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM14 7l3 3" />,
    brain: <path {...common} d="M9 5a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2.2M15 5a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-5 2.2M12 5v14" />,
    sun: <path {...common} d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />,
    briefcase: <path {...common} d="M4 8h16v10H4zM9 8V6h6v2M4 12h16" />,
    coffee: <path {...common} d="M6 8h10v5a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4zM16 9h1.5a2.5 2.5 0 0 1 0 5H16M7 20h10" />,
    phone: <path {...common} d="M7 5h4l1 4-2 1a10 10 0 0 0 4 4l1-2 4 1v4a2 2 0 0 1-2 2A14 14 0 0 1 5 7a2 2 0 0 1 2-2z" />,
    mail: <path {...common} d="M4 6h16v12H4zM4 7l8 6 8-6" />,
    target: <path {...common} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />,
    chart: <path {...common} d="M5 19V9M12 19V5M19 19v-7" />,
    folder: <path {...common} d="M4 7h6l2 2h8v9H4z" />,
    exams: <path {...common} d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />,
    users: <path {...common} d="M16 19a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 18a3 3 0 0 0-3-3" />
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  );
}

function IconBadge({ name }: { name: LineIconName }) {
  return (
    <span className="ll-icon-badge">
      <LineIcon name={name} />
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="ll-meter-bar" aria-hidden="true">
      <div className="ll-meter-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function MochiCatScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    let animationFrame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let resizeObserver: ResizeObserver | null = null;

    async function setupScene() {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");

      if (!active || !mountRef.current) {
        return;
      }

      const container = mountRef.current;
      scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 1.25, 4.6);

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.domElement.className = "ll-cat-3d-canvas";
      container.appendChild(renderer.domElement);
      container.dataset.ready = "true";

      const ambient = new THREE.HemisphereLight(0xf4fff7, 0x5a7b62, 2.5);
      scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 3.4);
      keyLight.position.set(3.2, 4.2, 4.8);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x9ed2ab, 1.3);
      fillLight.position.set(-3, 2.4, 2.4);
      scene.add(fillLight);

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(1.75, 96),
        new THREE.MeshStandardMaterial({
          color: 0x83c692,
          opacity: 0.38,
          transparent: true,
          roughness: 0.96
        })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.08;
      floor.receiveShadow = true;
      scene.add(floor);

      const modelRoot = new THREE.Group();
      scene.add(modelRoot);

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync("/models/oiiaioooooiai_cat.glb");

      if (!active) {
        return;
      }

      const model = gltf.scene;
      model.traverse((object) => {
        const mesh = object as import("three").Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);

      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      const scale = 3.35 / maxDimension;
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      const fittedBox = new THREE.Box3().setFromObject(model);
      model.position.y -= fittedBox.min.y + 0.08;
      model.rotation.y = -0.32;
      modelRoot.add(model);

      const mixer = gltf.animations.length ? new THREE.AnimationMixer(model) : null;
      gltf.animations.forEach((clip) => mixer?.clipAction(clip).play());

      const resize = () => {
        if (!renderer || !mountRef.current) {
          return;
        }
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(1, height);
        camera.updateProjectionMatrix();
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();

      const clock = new THREE.Clock();
      const animate = () => {
        const delta = clock.getDelta();
        mixer?.update(delta);
        modelRoot.rotation.y = Math.sin(clock.elapsedTime * 0.75) * 0.12;
        modelRoot.position.y = Math.sin(clock.elapsedTime * 1.4) * 0.035;
        renderer?.render(scene as import("three").Scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      };

      animate();
    }

    setupScene().catch(() => {
      if (mountRef.current) {
        mountRef.current.dataset.failed = "true";
      }
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      scene?.traverse((object) => {
        const mesh = object as import("three").Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as import("three").Material | import("three").Material[] | undefined;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material?.dispose();
        }
      });
      renderer?.domElement.remove();
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="ll-cat-3d-scene" ref={mountRef} role="img" aria-label="Mô hình mèo 3D Mochi">
      <div className="ll-cat-loading">Mochi 3D</div>
    </div>
  );
}

function MochiGardenScene() {
  return (
    <svg aria-hidden="true" viewBox="0 0 460 360" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ll-ground" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#8cc69b" stopOpacity="0.86" />
          <stop offset="62%" stopColor="#5bae6f" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#2f8f4b" stopOpacity="0.22" />
        </radialGradient>
        <radialGradient id="ll-leaves-a" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#a8d4b3" />
          <stop offset="58%" stopColor="#5bae6f" />
          <stop offset="100%" stopColor="#2f8f4b" />
        </radialGradient>
        <radialGradient id="ll-leaves-b" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#b8dcc1" />
          <stop offset="55%" stopColor="#6db77f" />
          <stop offset="100%" stopColor="#1f6f37" />
        </radialGradient>
        <linearGradient id="ll-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a3d28" />
          <stop offset="50%" stopColor="#7a5638" />
          <stop offset="100%" stopColor="#3d2818" />
        </linearGradient>
        <radialGradient id="ll-fox-body" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#ffb074" />
          <stop offset="60%" stopColor="#e88945" />
          <stop offset="100%" stopColor="#b35d20" />
        </radialGradient>
        <filter id="ll-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="6" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="230" cy="290" rx="180" ry="32" fill="url(#ll-ground)" />
      <ellipse cx="230" cy="285" rx="160" ry="22" fill="#7ac08c" opacity="0.7" />
      <path d="M90 285q3-8 6 0M100 282q3-10 6 0M380 285q3-8 6 0" stroke="#3d8a52" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g opacity="0.5">
        <rect x="60" y="220" width="6" height="40" fill="#5a3d28" rx="2" />
        <circle cx="63" cy="215" r="22" fill="url(#ll-leaves-b)" />
        <rect x="395" y="225" width="5" height="35" fill="#5a3d28" rx="2" />
        <circle cx="397" cy="220" r="18" fill="url(#ll-leaves-b)" />
      </g>
      <g className="ll-tree-leaves" filter="url(#ll-soft-shadow)">
        <path d="M180 290Q175 240 190 200L210 200Q225 240 220 290Z" fill="url(#ll-trunk)" />
        <path d="M185 285Q182 240 195 205" stroke="#9a7048" strokeWidth="2" fill="none" opacity="0.6" />
        <circle cx="200" cy="170" r="60" fill="url(#ll-leaves-a)" />
        <circle cx="160" cy="180" r="48" fill="url(#ll-leaves-b)" />
        <circle cx="240" cy="175" r="52" fill="url(#ll-leaves-b)" />
        <circle cx="200" cy="130" r="50" fill="url(#ll-leaves-a)" />
        <circle cx="170" cy="140" r="38" fill="url(#ll-leaves-a)" />
        <circle cx="230" cy="135" r="42" fill="url(#ll-leaves-b)" />
        <ellipse cx="185" cy="115" rx="22" ry="14" fill="#c9e3d0" opacity="0.5" />
        <ellipse cx="215" cy="155" rx="18" ry="10" fill="#d4ebd9" opacity="0.4" />
        <circle cx="155" cy="170" r="5" fill="#ff8a65" />
        <circle cx="245" cy="165" r="5" fill="#ffb074" />
        <circle cx="190" cy="115" r="4" fill="#ff8a65" />
      </g>
      <g className="ll-pet-group" filter="url(#ll-soft-shadow)">
        <path d="M295 250Q340 230 350 200Q355 195 350 215Q345 245 310 270Z" fill="url(#ll-fox-body)" />
        <path d="M340 215Q348 205 348 218Q343 232 330 245" fill="#fff5e8" />
        <ellipse cx="280" cy="260" rx="38" ry="32" fill="url(#ll-fox-body)" />
        <ellipse cx="278" cy="270" rx="22" ry="18" fill="#fff5e8" />
        <ellipse cx="265" cy="285" rx="8" ry="10" fill="#c66d28" />
        <ellipse cx="295" cy="285" rx="8" ry="10" fill="#c66d28" />
        <ellipse cx="275" cy="225" rx="32" ry="28" fill="url(#ll-fox-body)" />
        <ellipse cx="272" cy="235" rx="18" ry="14" fill="#fff5e8" />
        <path d="M250 205L245 180L262 198Z" fill="#c66d28" />
        <path d="M252 200L250 188L258 197Z" fill="#ff8a65" />
        <path d="M298 205L305 180L290 198Z" fill="#c66d28" />
        <path d="M296 200L300 188L292 197Z" fill="#ff8a65" />
        <g className="ll-pet-eye">
          <ellipse cx="262" cy="222" rx="3.5" ry="4.5" fill="#1f3a2c" />
          <ellipse cx="285" cy="222" rx="3.5" ry="4.5" fill="#1f3a2c" />
          <circle cx="263" cy="220" r="1.2" fill="white" />
          <circle cx="286" cy="220" r="1.2" fill="white" />
        </g>
        <ellipse cx="273" cy="232" rx="2.5" ry="2" fill="#1f3a2c" />
        <path d="M270 237Q273 240 276 237" stroke="#1f3a2c" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="257" cy="232" rx="4" ry="2.5" fill="#ff8a65" opacity="0.5" />
        <ellipse cx="293" cy="232" rx="4" ry="2.5" fill="#ff8a65" opacity="0.5" />
      </g>
      <g opacity="0.82">
        <circle cx="100" cy="100" r="2" fill="#ffd97a" />
        <circle cx="380" cy="120" r="2" fill="#ffd97a" />
        <circle cx="340" cy="80" r="1.5" fill="#fff5e8" />
        <circle cx="80" cy="180" r="1.5" fill="#fff5e8" />
      </g>
      <g opacity="0.95" transform="translate(310, 180)">
        <path d="M0 20Q0 0 25 0L70 0Q90 0 90 20L90 30Q90 45 75 45L35 45L20 55L25 45Q0 45 0 30Z" fill="white" stroke="rgba(91,174,111,0.3)" strokeWidth="1" />
        <text x="45" y="28" textAnchor="middle" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" fontSize="11" fontWeight="500" fill="#1f3a2c">
          Học cùng tớ?
        </text>
      </g>
    </svg>
  );
}

export function LumaUserDashboard() {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  const [activeView, setActiveView] = useState<LearningView>("today");
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourses[0]?.id ?? "");
  const [selectedClipId, setSelectedClipId] = useState(shadowingClips[0].id);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [dailyTime, setDailyTime] = useState("20:30");
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => toDateKey(new Date()));
  const [visibleScheduleMonth, setVisibleScheduleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(() => createDefaultScheduleEvents(toDateKey(new Date())));
  const [scheduleDraft, setScheduleDraft] = useState<ScheduleDraft>(() => ({
    date: toDateKey(new Date()),
    duration: "10",
    reminderMinutes: "15",
    sticker: scheduleStickerOptions[0],
    time: "20:30",
    title: "Buổi học mới"
  }));
  const [scheduleNotice, setScheduleNotice] = useState("");
  const [scheduleEmojiSearch, setScheduleEmojiSearch] = useState("");
  const [scheduleEmojiCategory, setScheduleEmojiCategory] = useState<ScheduleEmojiCategoryId>(scheduleEmojiCategories[0].id);
  const [scheduleEmojiPickerOpen, setScheduleEmojiPickerOpen] = useState(false);
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>(["office-english-club"]);
  const [placementRequired, setPlacementRequired] = useState(false);
  const [placementLanguage, setPlacementLanguage] = useState("Tiếng Anh");
  const [placementGoal, setPlacementGoal] = useState<Goal>("work");
  const [placementMinutes, setPlacementMinutes] = useState(10);
  const [placementSelfLevel, setPlacementSelfLevel] = useState<PlacementSelfLevel>("some");
  const [placementAnswers, setPlacementAnswers] = useState<Record<string, string>>({});
  const [avatarNotice, setAvatarNotice] = useState("");
  const [gifSearchTerm, setGifSearchTerm] = useState("study cat");
  const [gifResults, setGifResults] = useState<GifOption[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<PersonalFlashcard[]>(defaultFlashcards);
  const [flashcardDeckId, setFlashcardDeckId] = useState<FlashcardDeckId>("due");
  const [flashcardSessionSize, setFlashcardSessionSize] = useState(10);
  const [flashcardDirection, setFlashcardDirection] = useState<FlashcardDirection>("front");
  const [flashcardMode, setFlashcardMode] = useState<FlashcardMode>("review");
  const [flashcardSpeedMinutes, setFlashcardSpeedMinutes] = useState(5);
  const [flashcardTimerTick, setFlashcardTimerTick] = useState(0);
  const [flashcardSession, setFlashcardSession] = useState<FlashcardSession | null>(null);
  const [selectedFlashcardId, setSelectedFlashcardId] = useState(defaultFlashcards[0]?.id ?? "");
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardDraft, setFlashcardDraft] = useState<FlashcardDraft>({ front: "", back: "", note: "", tag: "Cá nhân" });
  const [flashcardNotice, setFlashcardNotice] = useState("");
  const flashcardDeckRef = useRef<HTMLButtonElement | null>(null);
  const courseJourneyRef = useRef<HTMLDivElement | null>(null);
  const [courseMotionHint, setCourseMotionHint] = useState("Sẵn sàng mở bài đầu tiên");

  useEffect(() => {
    const loadedCourses = readJson<Course[]>(COURSE_STORAGE_KEY, defaultCourses);
    const savedProfile = readJson<LearnerProfile | null>(SESSION_STORAGE_KEY, null);
    const loadedFlashcards = readJson<PersonalFlashcard[]>(FLASHCARD_STORAGE_KEY, defaultFlashcards);
    const scheduleNow = new Date();
    const scheduleTodayKey = toDateKey(scheduleNow);
    const defaultSchedule = createDefaultScheduleEvents(scheduleTodayKey);
    const loadedSchedule = readJson<ScheduleEvent[]>(SCHEDULE_STORAGE_KEY, defaultSchedule);
    const loadedProfile = savedProfile ?? createFallbackProfile();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loadedProfile));
    setProfile(loadedProfile);
    setCourses(loadedCourses.length ? loadedCourses : defaultCourses);
    setFlashcards(loadedFlashcards.length ? loadedFlashcards : defaultFlashcards);
    setScheduleEvents(loadedSchedule.length ? loadedSchedule : defaultSchedule);
    setCurrentTime(scheduleNow);
    setSelectedScheduleDate(scheduleTodayKey);
    setVisibleScheduleMonth(new Date(scheduleNow.getFullYear(), scheduleNow.getMonth(), 1));
    setScheduleDraft((draft) => ({ ...draft, date: scheduleTodayKey, time: dailyTime }));
    setSelectedFlashcardId((loadedFlashcards.length ? loadedFlashcards : defaultFlashcards)[0]?.id ?? "");
    setSelectedCourseId(loadedProfile.enrolledCourseIds[0] ?? loadedCourses[0]?.id ?? defaultCourses[0].id);
    setPlacementRequired(false);
    setPlacementLanguage(loadedProfile.language);
    setPlacementGoal(loadedProfile.goal);
    setPlacementMinutes(loadedProfile.dailyMinutes);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeView === "profile" && !gifResults.length && !gifLoading) {
      void searchGifAvatar("study cat");
    }
  }, [activeView]);

  const todayTasks = useMemo(() => {
    if (!profile) {
      return [];
    }

    return generateTodayTasks({
      goal: profile.goal,
      dailyMinutes: profile.dailyMinutes,
      language: profile.language
    });
  }, [profile]);

  const learningPath = useMemo(() => {
    if (!profile) {
      return [];
    }

    return generateLearningPath({
      goal: profile.goal,
      language: profile.language,
      level: profile.level,
      dailyMinutes: profile.dailyMinutes
    });
  }, [profile]);

  const practiceTest = useMemo(() => {
    if (!profile) {
      return [];
    }

    return generatePracticeTest({
      goal: profile.goal,
      level: profile.level,
      count: 5
    });
  }, [profile]);

  const dueFlashcards = useMemo(() => flashcards.filter(isFlashcardDue), [flashcards]);
  const deckFlashcards = useMemo(() => getFlashcardsForDeck(flashcards, flashcardDeckId), [flashcardDeckId, flashcards]);
  const flashcardDeckCounts = useMemo<Record<FlashcardDeckId, number>>(() => ({
    all: getFlashcardsForDeck(flashcards, "all").length,
    due: dueFlashcards.length,
    lesson: getFlashcardsForDeck(flashcards, "lesson").length,
    personal: getFlashcardsForDeck(flashcards, "personal").length
  }), [dueFlashcards.length, flashcards]);
  const sessionCardId = flashcardSession && !flashcardSession.completed ? flashcardSession.cardIds[flashcardSession.currentIndex] : "";
  const selectedFlashcard = sessionCardId
    ? flashcards.find((card) => card.id === sessionCardId)
    : deckFlashcards.find((card) => card.id === selectedFlashcardId) ?? deckFlashcards[0] ?? flashcards[0];
  const flashcardRecallRate = flashcardSession?.reviewed ? Math.round((flashcardSession.remembered / flashcardSession.reviewed) * 100) : 0;
  const activeFlashcardDirection = flashcardSession?.direction ?? flashcardDirection;
  const activeFlashcardMode = flashcardSession?.mode ?? flashcardMode;
  const flashcardPromptText = selectedFlashcard ? (activeFlashcardDirection === "front" ? selectedFlashcard.front : selectedFlashcard.back) : "";
  const flashcardAnswerText = selectedFlashcard ? (activeFlashcardDirection === "front" ? selectedFlashcard.back : selectedFlashcard.front) : "";
  const flashcardTimerNow = Date.now() + flashcardTimerTick * 0;
  const flashcardRemainingSeconds = flashcardSession?.expiresAt
    ? Math.max(0, Math.ceil((new Date(flashcardSession.expiresAt).getTime() - flashcardTimerNow) / 1000))
    : null;
  const flashcardChoiceOptions = useMemo(() => {
    if (!selectedFlashcard) {
      return [];
    }

    const answerSide = activeFlashcardDirection === "front" ? "back" : "front";
    const correctAnswer = selectedFlashcard[answerSide];
    const distractors = shuffleFlashcardIds(flashcards.filter((card) => card.id !== selectedFlashcard.id))
      .map((id) => flashcards.find((card) => card.id === id)?.[answerSide])
      .filter((answer): answer is string => Boolean(answer && answer !== correctAnswer))
      .slice(0, 3);

    return [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
  }, [activeFlashcardDirection, flashcards, selectedFlashcard]);
  const flashcardStats = useMemo(() => {
    const mastered = flashcards.filter((card) => card.status === "mastered").length;
    const learning = flashcards.filter((card) => card.status === "learning").length;
    return {
      due: dueFlashcards.length,
      learning,
      mastered,
      total: flashcards.length
    };
  }, [dueFlashcards.length, flashcards]);
  const todayDateKey = toDateKey(currentTime);
  const scheduleCalendarCells = useMemo(
    () => buildCalendarCells(visibleScheduleMonth, selectedScheduleDate, scheduleEvents, currentTime),
    [currentTime, scheduleEvents, selectedScheduleDate, visibleScheduleMonth]
  );
  const selectedScheduleEvents = useMemo(
    () => scheduleEvents
      .filter((event) => event.date === selectedScheduleDate)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [scheduleEvents, selectedScheduleDate]
  );
  const selectedScheduleDoneCount = selectedScheduleEvents.filter((event) => event.status === "done").length;
  const scheduleHistory = useMemo(
    () => [...scheduleEvents]
      .filter((event) => event.status === "done" || getScheduleDateTime(event).getTime() < currentTime.getTime())
      .sort((a, b) => getScheduleDateTime(b).getTime() - getScheduleDateTime(a).getTime())
      .slice(0, 5),
    [currentTime, scheduleEvents]
  );
  const activeScheduleReminder = useMemo(() => scheduleEvents
    .filter((event) => event.status !== "done")
    .map((event) => ({ event, delta: getScheduleDateTime(event).getTime() - currentTime.getTime() }))
    .filter(({ event, delta }) => delta >= 0 && delta <= event.reminderMinutes * 60_000)
    .sort((a, b) => a.delta - b.delta)[0]?.event, [currentTime, scheduleEvents]);
  const activeScheduleEmojiCategory = scheduleEmojiCategories.find((category) => category.id === scheduleEmojiCategory) ?? scheduleEmojiCategories[0];
  const visibleScheduleEmojis = useMemo(() => {
    const query = scheduleEmojiSearch.trim().toLowerCase();

    if (!query) {
      return activeScheduleEmojiCategory.emojis;
    }

    return scheduleEmojiCategories
      .flatMap((category) => category.emojis.map((emoji) => ({ emoji, label: category.label.toLowerCase(), id: category.id })))
      .filter((item) => item.emoji.includes(query) || item.label.includes(query) || item.id.includes(query))
      .map((item) => item.emoji);
  }, [activeScheduleEmojiCategory, scheduleEmojiCategory, scheduleEmojiSearch]);
  const recentScheduleStickers = useMemo(
    () => Array.from(new Set([scheduleDraft.sticker, ...scheduleEvents.map((event) => event.sticker), ...scheduleStickerOptions])).slice(0, 8),
    [scheduleDraft.sticker, scheduleEvents]
  );

  useEffect(() => {
    if (flashcardSession && !flashcardSession.completed) {
      return;
    }

    if (deckFlashcards[0] && selectedFlashcardId !== deckFlashcards[0].id) {
      setSelectedFlashcardId(deckFlashcards[0].id);
    }
  }, [deckFlashcards, flashcardSession, selectedFlashcardId]);

  useEffect(() => {
    if (!flashcardSession || flashcardSession.completed || flashcardSession.mode !== "speed" || !flashcardSession.expiresAt) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setFlashcardTimerTick((value) => value + 1);
      if (new Date(flashcardSession.expiresAt ?? "").getTime() <= Date.now()) {
        setFlashcardSession((session) => session ? { ...session, completed: true } : session);
        setFlashcardNotice("Hết giờ ôn nhanh. SRS đã lưu các thẻ vừa chấm.");
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [flashcardSession]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const selectedCourseIndex = Math.max(0, courses.findIndex((course) => course.id === selectedCourse?.id));
  const selectedCourseSkin = courseJourneySkins[selectedCourseIndex % courseJourneySkins.length];
  const journeyCourseSlots = [-1, 0, 1].map((offset) => {
    const index = (selectedCourseIndex + offset + courses.length) % courses.length;
    return {
      course: courses[index],
      index,
      offset,
      skin: courseJourneySkins[index % courseJourneySkins.length]
    };
  });
  const selectedClip = shadowingClips.find((clip) => clip.id === selectedClipId) ?? shadowingClips[0];
  const selectedClipLine = selectedClip.transcript.join(" ");
  const completedToday = profile ? todayTasks.filter((task) => profile.completedTaskIds.includes(task.id)).length : 0;
  const completion = calculateCompletionPercent(todayTasks.length, completedToday);
  const studyScore = Math.min(99, Math.round((72 + completion * 0.22) * 10) / 10);
  const learningStreak = 7 + completedToday;
  const tokenPercent = profile ? Math.min(100, Math.round((profile.aiTokenUsed / profile.aiTokenBudget) * 100)) : 0;
  const enrolledCourses = profile ? courses.filter((course) => profile.enrolledCourseIds.includes(course.id)) : [];
  const initials = profile ? getInitials(profile.name) || "LL" : "LL";
  const avatarHasMedia = Boolean(profile?.avatarUrl);
  const avatarClass = avatarHasMedia ? "has-media" : "";
  const avatarStatus = avatarHasMedia
    ? profile?.avatarMode === "gif"
      ? "GIF cá nhân đang dùng"
      : "Ảnh cá nhân đang dùng"
    : profile?.avatarMode === "gif"
      ? "GIF demo từ prompt"
      : "Đang dùng chữ viết tắt";

  useGSAP(
    () => {
      if (!flashcardDeckRef.current || activeView !== "flashcards") {
        return;
      }

      gsap.fromTo(
        flashcardDeckRef.current,
        { opacity: 0.82, rotateY: flashcardFlipped ? -8 : 8, y: 10 },
        { opacity: 1, rotateY: 0, y: 0, duration: 0.32, ease: "power2.out" }
      );
    },
    { dependencies: [activeView, flashcardFlipped, selectedFlashcard?.id], scope: flashcardDeckRef }
  );

  useGSAP(
    () => {
      if (!courseJourneyRef.current || activeView !== "courses") {
        return;
      }

      gsap.fromTo(
        ".ll-journey-card",
        { opacity: 0, y: 26, scale: 0.96, filter: "blur(8px)" },
        { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.58, ease: "power3.out", stagger: 0.08 }
      );
      gsap.fromTo(
        ".ll-journey-step",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.38, ease: "power2.out", stagger: 0.05, delay: 0.12 }
      );
    },
    { dependencies: [activeView, selectedCourseId], scope: courseJourneyRef }
  );

  function persistProfile(nextProfile: LearnerProfile) {
    setProfile(nextProfile);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextProfile));
      setAvatarNotice("");
    } catch {
      setAvatarNotice("File hơi lớn nên chỉ xem trước trong phiên này. Hãy chọn ảnh/GIF nhẹ hơn.");
    }
  }

  function persistFlashcards(nextCards: PersonalFlashcard[]) {
    setFlashcards(nextCards);
    try {
      localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(nextCards));
    } catch {
      setFlashcardNotice("Chưa lưu được flashcard vào trình duyệt. Hãy xóa bớt dữ liệu cũ rồi thử lại.");
    }
  }

  function persistScheduleEvents(nextEvents: ScheduleEvent[]) {
    setScheduleEvents(nextEvents);
    try {
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(nextEvents));
    } catch {
      setScheduleNotice("Chưa lưu được lịch học vào trình duyệt. Hãy xóa bớt dữ liệu cũ rồi thử lại.");
    }
  }

  function addScheduleEvent() {
    const title = scheduleDraft.title.trim();
    if (!title) {
      setScheduleNotice("Cần nhập tên hoạt động học.");
      return;
    }

    const nextEvent: ScheduleEvent = {
      id: `schedule-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
      date: scheduleDraft.date,
      time: scheduleDraft.time,
      title,
      duration: Math.max(1, Number(scheduleDraft.duration) || 10),
      reminderMinutes: Math.max(0, Number(scheduleDraft.reminderMinutes) || 0),
      sticker: scheduleDraft.sticker,
      status: "upcoming"
    };
    persistScheduleEvents([...scheduleEvents, nextEvent]);
    setSelectedScheduleDate(nextEvent.date);
    setVisibleScheduleMonth(new Date(fromDateKey(nextEvent.date).getFullYear(), fromDateKey(nextEvent.date).getMonth(), 1));
    setScheduleDraft((draft) => ({ ...draft, title: "Buổi học mới" }));
    setScheduleNotice(`Đã thêm "${nextEvent.title}" vào ${formatShortDate(nextEvent.date)} lúc ${nextEvent.time}.`);
  }

  function toggleScheduleEventDone(eventId: string) {
    const nextEvents = scheduleEvents.map((event) => event.id === eventId
      ? { ...event, status: (event.status === "done" ? "upcoming" : "done") as ScheduleStatus }
      : event);
    persistScheduleEvents(nextEvents);
    setScheduleNotice("Đã cập nhật trạng thái lịch học.");
  }

  function selectScheduleDate(dateKey: string) {
    setSelectedScheduleDate(dateKey);
    setScheduleDraft((draft) => ({ ...draft, date: dateKey }));
  }

  function shiftScheduleMonth(delta: number) {
    setVisibleScheduleMonth((month) => new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }

  function goToTodaySchedule() {
    const today = new Date();
    const todayKey = toDateKey(today);
    setVisibleScheduleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    selectScheduleDate(todayKey);
  }

  function updateDailyStudyTime(time: string) {
    setDailyTime(time);
    setScheduleDraft((draft) => ({ ...draft, time }));
    setScheduleNotice(`Giờ học mặc định đã đổi sang ${time}.`);
  }

  function requestScheduleReminderPermission() {
    if (typeof Notification === "undefined") {
      setScheduleNotice("Trình duyệt này chưa hỗ trợ thông báo hệ thống, mình vẫn giữ nhắc lịch trong app.");
      return;
    }

    void Notification.requestPermission().then((permission) => {
      setScheduleNotice(permission === "granted" ? "Đã bật quyền thông báo. Nhắc lịch trong app vẫn hiển thị ở panel." : "Chưa bật thông báo hệ thống. Nhắc lịch trong app vẫn hoạt động.");
    });
  }

  function addFlashcardFromDraft() {
    if (!profile) {
      return;
    }

    if (!flashcardDraft.front.trim() || !flashcardDraft.back.trim()) {
      setFlashcardNotice("Cần nhập cả mặt trước và mặt sau.");
      return;
    }

    const nextCard = createFlashcard({
      back: flashcardDraft.back,
      front: flashcardDraft.front,
      level: profile.level,
      note: flashcardDraft.note,
      tag: flashcardDraft.tag,
      source: "personal"
    });
    const nextCards = [nextCard, ...flashcards];
    persistFlashcards(nextCards);
    setSelectedFlashcardId(nextCard.id);
    setFlashcardDeckId("personal");
    setFlashcardSession(null);
    setFlashcardFlipped(false);
    setFlashcardDraft({ front: "", back: "", note: "", tag: "Cá nhân" });
    setFlashcardNotice("Đã thêm vào tủ flashcard riêng.");
  }

  function addSeedFlashcard(seed: Pick<PersonalFlashcard, "back" | "front" | "note" | "tag">) {
    if (!profile) {
      return;
    }

    const duplicated = flashcards.some((card) => card.front.toLowerCase() === seed.front.toLowerCase());
    if (duplicated) {
      setFlashcardNotice(`"${seed.front}" đã có trong hộp thẻ.`);
      return;
    }

    const nextCard = createFlashcard({
      ...seed,
      level: profile.level,
      source: "lesson"
    });
    persistFlashcards([nextCard, ...flashcards]);
    setSelectedFlashcardId(nextCard.id);
    setFlashcardDeckId("lesson");
    setFlashcardSession(null);
    setFlashcardFlipped(false);
    setFlashcardNotice(`Đã lưu "${seed.front}" vào bộ từ bài học.`);
  }

  function startFlashcardSession() {
    const sessionCards = deckFlashcards.length ? deckFlashcards : flashcards.filter((card) => card.status !== "mastered");

    if (!sessionCards.length) {
      setFlashcardNotice("Chưa có thẻ để bắt đầu phiên ghi nhớ.");
      return;
    }

    const shuffledIds = shuffleFlashcardIds(sessionCards);
    const cardIds = flashcardMode === "speed" || flashcardSessionSize === 0
      ? shuffledIds
      : shuffledIds.slice(0, Math.min(flashcardSessionSize, shuffledIds.length));
    const now = Date.now();
    setFlashcardSession({
      cardIds,
      currentIndex: 0,
      deckId: flashcardDeckId,
      direction: flashcardDirection,
      expiresAt: flashcardMode === "speed" ? new Date(now + flashcardSpeedMinutes * 60_000).toISOString() : undefined,
      mode: flashcardMode,
      remembered: 0,
      again: 0,
      reviewed: 0,
      startedAt: new Date(now).toISOString(),
      completed: false
    });
    setSelectedFlashcardId(cardIds[0]);
    setFlashcardFlipped(false);
    setFlashcardTimerTick(0);
    setFlashcardNotice(flashcardMode === "speed" ? "Đã bật ôn nhanh. Bộ bài sẽ lặp đến khi hết giờ." : "Đã xáo bộ thẻ. Bắt đầu phiên ghi nhớ riêng của bạn.");
  }

  function stopFlashcardSession() {
    setFlashcardSession(null);
    setFlashcardFlipped(false);
    setFlashcardNotice("Đã thoát phiên học. Lịch SRS vẫn được giữ lại.");
  }

  function reviewFlashcard(cardId: string, rating: "again" | "good" | "easy") {
    const nextCards = flashcards.map((card) => (card.id === cardId ? scheduleFlashcard(card, rating) : card));

    persistFlashcards(nextCards);
    setFlashcardFlipped(false);

    if (flashcardSession && !flashcardSession.completed) {
      const reviewed = flashcardSession.reviewed + 1;
      const remembered = flashcardSession.remembered + (rating === "again" ? 0 : 1);
      const again = flashcardSession.again + (rating === "again" ? 1 : 0);
      const hasNext = flashcardSession.currentIndex < flashcardSession.cardIds.length - 1;

      if (hasNext) {
        const nextSession = {
          ...flashcardSession,
          currentIndex: flashcardSession.currentIndex + 1,
          reviewed,
          remembered,
          again
        };
        setFlashcardSession(nextSession);
        setSelectedFlashcardId(nextSession.cardIds[nextSession.currentIndex]);
        setFlashcardNotice(`Đã nhớ ${remembered} · Cần ôn lại ${again}`);
        return;
      }

      if (flashcardSession.mode === "speed" && (!flashcardSession.expiresAt || new Date(flashcardSession.expiresAt).getTime() > Date.now())) {
        const nextDeck = getFlashcardsForDeck(nextCards, flashcardSession.deckId);
        const nextLoopIds = shuffleFlashcardIds(nextDeck.length ? nextDeck : nextCards.filter((card) => card.status !== "mastered"));
        if (nextLoopIds.length) {
          setFlashcardSession({
            ...flashcardSession,
            cardIds: nextLoopIds,
            currentIndex: 0,
            reviewed,
            remembered,
            again
          });
          setSelectedFlashcardId(nextLoopIds[0]);
          setFlashcardNotice(`Đang lặp bộ bài · Đã nhớ ${remembered} · Cần ôn lại ${again}`);
          return;
        }
      }

      setFlashcardSession({
        ...flashcardSession,
        completed: true,
        reviewed,
        remembered,
        again
      });
      setFlashcardNotice(`Phiên hoàn thành: ${remembered} thẻ nhớ, ${again} thẻ cần ôn lại.`);
      return;
    }

    const nextSelected = getFlashcardsForDeck(nextCards, flashcardDeckId).find((card) => card.id !== cardId) ?? nextCards.find((card) => card.id !== cardId);
    setSelectedFlashcardId(nextSelected?.id ?? cardId);
    setFlashcardNotice(rating === "again" ? "Đã đưa thẻ quay lại ôn sớm." : rating === "easy" ? "Tuyệt, thẻ được giãn lịch xa hơn." : "Đã cập nhật lịch ôn.");
  }

  function answerFlashcardChoice(answer: string) {
    if (!selectedFlashcard) {
      return;
    }

    const correct = answer === flashcardAnswerText;
    setFlashcardNotice(correct ? "Đúng, thẻ được ghi nhận là đã nhớ." : `Chưa đúng. Đáp án là "${flashcardAnswerText}".`);
    reviewFlashcard(selectedFlashcard.id, correct ? "good" : "again");
  }

  function selectFlashcard(cardId: string) {
    setSelectedFlashcardId(cardId);
    setFlashcardFlipped(false);
  }

  function toggleTask(taskId: string) {
    if (!profile) {
      return;
    }

    const completedTaskIds = profile.completedTaskIds.includes(taskId)
      ? profile.completedTaskIds.filter((id) => id !== taskId)
      : [...profile.completedTaskIds, taskId];
    persistProfile({ ...profile, completedTaskIds });
  }

  function enrollCourse(courseId: string) {
    if (!profile) {
      return;
    }

    const enrolledCourseIds = profile.enrolledCourseIds.includes(courseId)
      ? profile.enrolledCourseIds
      : [...profile.enrolledCourseIds, courseId];
    persistProfile({ ...profile, enrolledCourseIds });
    setSelectedCourseId(courseId);
  }

  function selectJourneyCourse(courseId: string) {
    setSelectedCourseId(courseId);
    setCourseMotionHint("Đang sắp xếp lại lộ trình");
    window.setTimeout(() => setCourseMotionHint("Sẵn sàng mở bài đầu tiên"), 420);
  }

  function launchJourneyCourse(courseId: string) {
    enrollCourse(courseId);
    setCourseMotionHint("Đang mở bài học theo lộ trình");

    const root = courseJourneyRef.current;
    if (root) {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(root.querySelector(".ll-journey-card.is-center"), { scale: 1.035, y: -8, duration: 0.22 })
        .to(root.querySelector(".ll-journey-card.is-center"), { scale: 1, y: 0, duration: 0.28 })
        .to(root.querySelectorAll(".ll-journey-step"), { backgroundColor: "rgba(197, 234, 211, 0.82)", stagger: 0.04, duration: 0.18 }, 0);
    }

    window.setTimeout(() => {
      setActiveView("lesson");
      setCourseMotionHint("Sẵn sàng mở bài đầu tiên");
    }, 560);
  }

  function updateDailyMinutes(minutes: number) {
    if (!profile) {
      return;
    }

    persistProfile({ ...profile, dailyMinutes: minutes });
  }

  function getPlacementResult(): PlacementResult {
    const selfLevel = placementSelfLevels.find((option) => option.id === placementSelfLevel) ?? placementSelfLevels[1];
    const correctCount = getPlacementCorrectCount(placementAnswers);
    const score = correctCount + selfLevel.value;
    const band = resolvePlacementBand(score);
    const level = resolvePlacementLevel(placementLanguage, band);
    const courseId = getRecommendedCourseId(courses, { goal: placementGoal, language: placementLanguage, level });

    return {
      band,
      courseId,
      dailyMinutes: placementMinutes,
      goal: placementGoal,
      language: placementLanguage,
      level,
      score,
      skillMap: getPlacementSkillMap(placementAnswers)
    };
  }

  function completePlacement() {
    if (!profile) {
      return;
    }

    const result = getPlacementResult();
    const nextProfile: LearnerProfile = {
      ...profile,
      language: result.language,
      level: result.level,
      goal: result.goal,
      dailyMinutes: result.dailyMinutes,
      placementBand: result.band,
      placementCompletedAt: new Date().toISOString(),
      placementScore: result.score,
      skillMap: result.skillMap,
      enrolledCourseIds: [result.courseId],
      completedTaskIds: []
    };

    persistProfile(nextProfile);
    setSelectedCourseId(result.courseId);
    setPlacementRequired(false);
    setActiveView("today");
  }

  function restartPlacement() {
    if (!profile) {
      return;
    }

    setPlacementLanguage(profile.language);
    setPlacementGoal(profile.goal);
    setPlacementMinutes(profile.dailyMinutes);
    setPlacementAnswers({});
    setPlacementRequired(true);
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarNotice("Chỉ nhận file ảnh hoặc GIF.");
      event.target.value = "";
      return;
    }

    if (file.size > 3.8 * 1024 * 1024) {
      setAvatarNotice("Ảnh/GIF nên dưới 3.8MB để lưu ổn định trong trình duyệt.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      persistProfile({
        ...profile,
        avatarMode: file.type === "image/gif" ? "gif" : "image",
        avatarUrl: String(reader.result)
      });
      setAvatarNotice(file.type === "image/gif" ? "Đã dùng GIF cá nhân." : "Đã dùng ảnh cá nhân.");
      event.target.value = "";
    });
    reader.readAsDataURL(file);
  }

  function resetAvatar() {
    if (!profile) {
      return;
    }

    persistProfile({
      ...profile,
      avatarMode: "initial",
      avatarUrl: undefined,
      gifPrompt: undefined
    });
    setAvatarNotice("Đã quay về chữ viết tắt.");
  }

  async function searchGifAvatar(nextTerm = gifSearchTerm) {
    const query = nextTerm.trim() || "study cat";
    setGifSearchTerm(query);
    setGifLoading(true);
    setAvatarNotice("");

    try {
      const response = await fetch(`/api/gifs/search?q=${encodeURIComponent(query)}&limit=10`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("GIF API failed");
      }

      const payload = (await response.json()) as {
        message?: string;
        results?: GifOption[];
        source?: "giphy" | "fallback";
      };
      setGifResults(payload.results ?? []);
      setAvatarNotice(payload.message ?? (payload.source === "giphy" ? "Đã tải GIF từ GIPHY." : ""));
    } catch {
      setGifResults([]);
      setAvatarNotice("Chưa tải được GIF API. Kiểm tra key hoặc mạng rồi thử lại.");
    } finally {
      setGifLoading(false);
    }
  }

  function selectGifAvatar(gif: GifOption) {
    if (!profile) {
      return;
    }

    persistProfile({
      ...profile,
      avatarMode: "gif",
      avatarUrl: gif.url,
      gifPrompt: gif.title
    });
    setAvatarNotice(gif.source === "giphy" ? "Đã chọn GIF từ GIPHY." : "Đã chọn GIF fallback.");
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedClip.language === "Tiếng Nhật" ? "ja-JP" : selectedClip.language === "Tiếng Hàn" ? "ko-KR" : "en-US";
    utterance.rate = 0.86;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function toggleGroup(groupId: string) {
    setJoinedGroupIds((current) => (current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]));
  }

  if (!profile) {
    return null;
  }

  const placementResult = getPlacementResult();
  const placementCourse = courses.find((course) => course.id === placementResult.courseId) ?? defaultCourses[0];
  const placementAnswerCount = placementQuestions.filter((question) => placementAnswers[question.id]).length;
  const placementReady = placementAnswerCount === placementQuestions.length;

  if (placementRequired) {
    return (
      <section className="ll-placement-page" aria-label="Đánh giá đầu vào LumaLang">
        <header className="ll-placement-hero ll-glass">
          <div className="ll-placement-brand">
            <span className="brand-logo-frame">
              <img alt="" src="/images/lumalang-logo.png" />
            </span>
            <span>LumaLang</span>
          </div>
          <div>
            <div className="ll-label">New learner · Placement</div>
            <h1>Bắt đầu đúng <span className="ll-accent">trình độ</span></h1>
            <p>Trả lời nhanh vài câu để LumaLang mở đúng bài đầu tiên, thay vì bắt bạn mò giữa cả dashboard.</p>
          </div>
          <div className="ll-placement-result-card">
            <span>Gợi ý hiện tại</span>
            <strong>{placementResult.level}</strong>
            <small>{placementBandLabels[placementResult.band]} · {placementCourse.title}</small>
          </div>
        </header>

        <div className="ll-placement-grid">
          <section className="ll-placement-panel ll-glass">
            <div className="ll-metric-label">Thiết lập lộ trình</div>
            <h2>Mục tiêu học</h2>
            <div className="ll-choice-grid">
              {placementGoalOptions.map((option) => (
                <button
                  className={placementGoal === option.id ? "active" : undefined}
                  key={option.id}
                  onClick={() => setPlacementGoal(option.id)}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>

            <h2>Ngôn ngữ</h2>
            <div className="ll-segment-row">
              {placementLanguages.map((language) => (
                <button
                  className={placementLanguage === language ? "active" : undefined}
                  key={language}
                  onClick={() => setPlacementLanguage(language)}
                  type="button"
                >
                  {language}
                </button>
              ))}
            </div>

            <h2>Bạn đang ở đâu?</h2>
            <div className="ll-choice-grid compact">
              {placementSelfLevels.map((option) => (
                <button
                  className={placementSelfLevel === option.id ? "active" : undefined}
                  key={option.id}
                  onClick={() => setPlacementSelfLevel(option.id)}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <span>{option.detail}</span>
                </button>
              ))}
            </div>

            <h2>Thời lượng mỗi ngày</h2>
            <div className="ll-segment-row">
              {[5, 10, 15, 20].map((minutes) => (
                <button
                  className={placementMinutes === minutes ? "active" : undefined}
                  key={minutes}
                  onClick={() => setPlacementMinutes(minutes)}
                  type="button"
                >
                  {minutes} phút
                </button>
              ))}
            </div>
          </section>

          <section className="ll-placement-panel ll-glass">
            <div className="ll-placement-panel-head">
              <div>
                <div className="ll-metric-label">Mini placement</div>
                <h2>{placementAnswerCount}/{placementQuestions.length} câu</h2>
              </div>
              <span>{placementReady ? "Đủ dữ liệu" : "Cần trả lời hết"}</span>
            </div>
            <div className="ll-placement-questions">
              {placementQuestions.map((question, index) => (
                <article key={question.id}>
                  <div className="ll-question-title">
                    <span>{index + 1}</span>
                    <strong>{question.prompt}</strong>
                  </div>
                  <div className="ll-answer-grid">
                    {question.options.map((option) => (
                      <button
                        className={placementAnswers[question.id] === option ? "active" : undefined}
                        key={option}
                        onClick={() => setPlacementAnswers((current) => ({ ...current, [question.id]: option }))}
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ll-placement-panel ll-placement-summary ll-glass">
            <div>
              <div className="ll-metric-label">Kết quả sẽ mở khóa</div>
              <h2>{placementCourse.title}</h2>
              <p>{placementCourse.objective}</p>
            </div>
            <div className="ll-skill-map">
              {Object.entries(placementResult.skillMap).map(([skill, value]) => (
                <div key={skill}>
                  <span>{skill}</span>
                  <strong>{value}%</strong>
                  <ProgressBar value={value} />
                </div>
              ))}
            </div>
            <button className="ll-btn primary" disabled={!placementReady} onClick={completePlacement} type="button">
              Mở dashboard học
            </button>
          </section>
        </div>
      </section>
    );
  }

  if (activeExamId) {
    return <ExamRoom examId={activeExamId} onExit={() => setActiveExamId(null)} />;
  }

  return (
    <section className="ll-dashboard" aria-label="Dashboard học tiếng Anh">
      <aside className="ll-nav ll-glass" aria-label="Điều hướng học">
        <button className="ll-logo" onClick={() => setActiveView("today")} type="button" aria-label="LumaLang">
          <img alt="" src="/images/lumalang-logo.png" />
        </button>
        {navItems.map((item) => (
          <button
            aria-current={activeView === item.id ? "page" : undefined}
            className={activeView === item.id ? "ll-nav-item active" : "ll-nav-item"}
            key={item.id}
            onClick={() => setActiveView(item.id)}
            type="button"
          >
            <LineIcon name={item.id} />
            <span>{item.label}</span>
          </button>
        ))}
        <button
          className={`ll-nav-avatar ${avatarClass}`}
          data-mode={profile.avatarMode}
          onClick={() => setActiveView("profile")}
          type="button"
        >
          <AvatarContent initials={initials} profile={profile} />
        </button>
      </aside>

      <aside className="ll-context ll-glass">
        <div className="ll-traffic" aria-hidden="true"><span /><span /><span /></div>
        <div className="ll-profile">
          <div className={`ll-profile-avatar ${avatarClass}`} data-mode={profile.avatarMode}>
            <AvatarContent initials={initials} profile={profile} />
          </div>
          <div>
            <div className="ll-profile-name">{profile.name}</div>
            <div className="ll-profile-email">{profile.email}</div>
          </div>
        </div>

        <div>
          <div className="ll-section-label">Khóa đang học</div>
          {enrolledCourses.length ? (
            enrolledCourses.map((course) => (
              <button
                className={selectedCourseId === course.id ? "ll-ctx-card active" : "ll-ctx-card"}
                key={course.id}
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setActiveView("courses");
                }}
                type="button"
              >
                <span className="ll-ctx-card-title">{course.title}</span>
                <span className="ll-ctx-card-meta">{course.language} · {course.level} · {course.lessons} bài</span>
              </button>
            ))
          ) : (
            <div className="ll-ctx-card">Chưa ghi danh khóa nào.</div>
          )}
        </div>

        <div>
          <div className="ll-section-label">Lịch hôm nay</div>
          <div className="ll-ctx-card">
            <div className="ll-ctx-card-title accent">{dailyTime}</div>
            <div className="ll-ctx-card-meta">{profile.dailyMinutes} phút · {goalLabels[profile.goal]}</div>
          </div>
        </div>

        <div>
          <div className="ll-section-label">AI Token</div>
          <div className="ll-ctx-card">
            <div className="ll-ctx-card-title small">{profile.aiTokenUsed} / {profile.aiTokenBudget}</div>
            <ProgressBar value={tokenPercent} />
          </div>
        </div>

        <div>
          <div className="ll-section-label">Linh vật</div>
          <button className="ll-ctx-card" onClick={() => setActiveView("profile")} type="button">
            <span className="ll-pet-title"><span className="ll-pet-emoji">🦊</span> Mochi</span>
            <span className="ll-ctx-card-meta">Lv. 3 · Vui vẻ · Đói nhẹ</span>
          </button>
        </div>
      </aside>

      <main className="ll-main">
        {activeView === "today" ? (
          <div className="ll-page">
            <PageTopbar
              eyebrow="User · 12/05/2026"
              title="Hôm nay, "
              titleAccent="nhẹ nhàng thôi"
              actions={
                <>
                  <button className="ll-btn ghost" onClick={() => setActiveView("shadowing")} type="button">Shadowing</button>
                  <button className="ll-btn primary" onClick={() => setActiveView("lesson")} type="button">Vào bài học</button>
                </>
              }
            />

            <div className="ll-card-grid ll-grid-hero">
              <div className="ll-stack">
                <section className="ll-study-score-card ll-glass">
                  <div className="ll-study-score-label">Study Score</div>
                  <div className="ll-study-score-value">{studyScore.toFixed(1)}</div>
                  <div className="ll-study-score-sub">
                    {profile.level} · trung bình {completion}% hôm nay
                    <span>{completion >= 50 ? "Tốt hơn hôm qua" : "Mochi đang chờ bạn"}</span>
                  </div>
                  <ProgressBar value={studyScore} />
                </section>

                <section className="ll-soft-card ll-glass">
                  <div className="ll-metric-label">Bài kế tiếp</div>
                  <h2>{todayTasks[0]?.title ?? "Standup họp sáng"}</h2>
                  <p>{profile.dailyMinutes} phút · Roleplay với AI · {goalLabels[profile.goal]}</p>
                  <div className="ll-tags">
                    <span className="ll-tag">Speaking</span>
                    <span className="ll-tag">{profile.level}</span>
                    <span className="ll-tag">Office</span>
                  </div>
                </section>
              </div>

              <section className="ll-scene-card ll-glass">
                <div className="ll-scene-header">
                  <div>
                    <div className="ll-metric-label">Cây tri thức · Khu vườn</div>
                    <h2>Hôm nay <span className="ll-accent">Mochi</span> đang chờ</h2>
                  </div>
                  <div className="ll-scene-pill"><strong>{completedToday}/{todayTasks.length}</strong> nhiệm vụ</div>
                </div>
                <div className="ll-model-stage">
                  <div className="ll-level-ring">
                    <div className="ll-level-ring-circle">3</div>
                    <div>Mochi · <strong>Lv. 3</strong></div>
                  </div>
                  <div className="ll-model-3d-container">
                    <div className="ll-model-floor" />
                    <MochiCatScene />
                    <div className="ll-cat-speech">Học cùng tớ?</div>
                  </div>
                  <div className="ll-unlock-track" aria-label="Tiến hóa linh vật">
                    {[1, 2, 3, 4, 5, 6].map((level) => (
                      <span className={level < 3 ? "unlocked" : level === 3 ? "current" : undefined} key={level} />
                    ))}
                  </div>
                </div>
                <div className="ll-scene-actions">
                  <button onClick={() => setActiveView("lesson")} type="button">Warm-up</button>
                  <button className="primary" onClick={() => setActiveView("shadowing")} type="button">Roleplay với Mochi</button>
                  <button onClick={() => setActiveView("practice")} type="button">Review</button>
                </div>
              </section>

              <div className="ll-metrics-col">
                <section className="ll-metric-card ll-glass">
                  <div className="ll-metric-label">Hoàn thành hôm nay</div>
                  <div className="ll-metric-row">
                    <span>{completedToday}/{todayTasks.length} bài đã xong</span>
                    <strong className="green">{completion}%</strong>
                  </div>
                </section>
                <section className="ll-metric-card ll-glass">
                  <div className="ll-metric-label">Streak học</div>
                  <div className="ll-metric-row">
                    <span>ngày giữ nhịp</span>
                    <strong>{learningStreak}</strong>
                  </div>
                  <div className="ll-metric-delta">Kỷ lục cá nhân: 12 ngày</div>
                </section>
                <section className="ll-metric-card ll-glass">
                  <div className="ll-metric-label">Nhiệm vụ mới</div>
                  <div className="ll-metric-row">
                    <span>nói, nghe, phản xạ</span>
                    <strong>{todayTasks.length}</strong>
                  </div>
                </section>
                <section className="ll-promises-card ll-glass">
                  <div className="ll-promises-title">Từ vựng hôm nay</div>
                  {["deadline · hạn chót", "feedback · góp ý", "catch up · bắt kịp", "workload · khối lượng việc"].map((item) => (
                    <div className="ll-promise" key={item}><span />{item}</div>
                  ))}
                </section>
              </div>
            </div>
          </div>
        ) : null}

        {activeView === "lesson" ? (
          <div className="ll-page">
            <PageTopbar
              eyebrow="HỌC TẬP · BÀI HỌC THEO LỘ TRÌNH"
              title="Bài học của "
              titleAccent="bạn"
            />
            <LessonsViewV2 />
          </div>
        ) : null}

        {activeView === "courses" ? (
          <div className="ll-page">
            <PageTopbar
              eyebrow="KHÓA HỌC · LỘ TRÌNH CÁ NHÂN HÓA"
              title="Hành trình của "
              titleAccent="bạn"
            />
            <LearningPathsView />
          </div>
        ) : null}

        {activeView === "practice" ? (
          <div className="ll-page ll-practice-page">
            <PageTopbar
              eyebrow="ĐỀ LUYỆN · TỰ SINH TỪ LỘ TRÌNH CỦA BẠN"
              title="Luyện "
              titleAccent="phản xạ"
            />
            <PracticeViewV2 />
          </div>
        ) : null}

        {activeView === "flashcards" ? (
          <div className={flashcardSession && !flashcardSession.completed ? "ll-page ll-flashcard-page study-mode" : "ll-page ll-flashcard-page"}>
            <PageTopbar
              eyebrow={`FLASHCARD RIÊNG TƯ · FSRS-LITE · ${flashcardStats.due} THẺ ĐẾN HẠN`}
              title="Học "
              titleAccent="ghi nhớ"
              actions={
                flashcardSession && !flashcardSession.completed ? (
                  <button className="ll-btn ghost" onClick={stopFlashcardSession} type="button">Thoát phiên</button>
                ) : (
                  <button className="ll-btn primary" onClick={startFlashcardSession} type="button">Bắt đầu học</button>
                )
              }
            />

            {flashcardSession && !flashcardSession.completed && selectedFlashcard ? (
              <div className="ll-flashcard-session-grid">
                <section className="ll-flashcard-focus ll-glass">
                  <div className="ll-flashcard-progress-row">
                    <span>{flashcardSession.currentIndex + 1}/{flashcardSession.cardIds.length}</span>
                    <div><i style={{ width: `${((flashcardSession.currentIndex + 1) / flashcardSession.cardIds.length) * 100}%` }} /></div>
                    <strong>{flashcardSession.mode === "speed" && flashcardRemainingSeconds !== null ? `${Math.floor(flashcardRemainingSeconds / 60)}:${String(flashcardRemainingSeconds % 60).padStart(2, "0")}` : `${flashcardSession.remembered} nhớ`}</strong>
                  </div>
                  {activeFlashcardMode === "choice" ? (
                    <>
                      <div className="ll-flashcard-choice-card">
                        <small>{activeFlashcardDirection === "front" ? "Chọn nghĩa đúng" : "Chọn mặt chữ đúng"} · {selectedFlashcard.tag}</small>
                        <strong>{flashcardPromptText}</strong>
                      </div>
                      <div className="ll-flashcard-choice-grid">
                        {flashcardChoiceOptions.map((option) => (
                          <button key={option} onClick={() => answerFlashcardChoice(option)} type="button">{option}</button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        aria-label={flashcardFlipped ? "Xem mặt hỏi flashcard" : "Xem mặt đáp flashcard"}
                        className={flashcardFlipped ? "ll-flashcard-deck flipped" : "ll-flashcard-deck"}
                        onClick={() => setFlashcardFlipped((value) => !value)}
                        ref={flashcardDeckRef}
                        type="button"
                      >
                        <span className="ll-flashcard-face front">
                          <small>{selectedFlashcard.tag} · {selectedFlashcard.level}</small>
                          <strong>{flashcardPromptText}</strong>
                          <span>Chạm để lật thẻ</span>
                        </span>
                        <span className="ll-flashcard-face back">
                          <small>{selectedFlashcard.source === "personal" ? "Tủ riêng" : "Từ bài học"} · {selectedFlashcard.reviewCount} lượt ôn</small>
                          <strong>{flashcardAnswerText}</strong>
                          {selectedFlashcard.note ? <span>{selectedFlashcard.note}</span> : <span>Chưa có ví dụ cho thẻ này.</span>}
                        </span>
                      </button>
                      <div className="ll-flashcard-review-row">
                        <button className="ll-btn ghost" onClick={() => reviewFlashcard(selectedFlashcard.id, "again")} type="button">Chưa nhớ</button>
                        <button className="ll-btn mint" onClick={() => reviewFlashcard(selectedFlashcard.id, "good")} type="button">Nhớ</button>
                        <button className="ll-btn primary" onClick={() => reviewFlashcard(selectedFlashcard.id, "easy")} type="button">Rất nhớ</button>
                      </div>
                    </>
                  )}
                  {flashcardNotice ? <p className="ll-flashcard-notice">{flashcardNotice}</p> : null}
                </section>

                <aside className="ll-flashcard-session-panel ll-glass">
                  <div className="ll-flashcard-section-head compact">
                    <div>
                      <span className="ll-metric-label">Phiên học</span>
                      <h2>{flashcardDeckOptions.find((deck) => deck.id === flashcardSession.deckId)?.label}</h2>
                    </div>
                    <span>Riêng tư</span>
                  </div>
                  <div className="ll-flashcard-score-card">
                    <strong>{flashcardRecallRate}%</strong>
                    <span>tỉ lệ nhớ tạm thời</span>
                  </div>
                  <div className="ll-flashcard-session-facts">
                    <p><span>Đã chấm</span><strong>{flashcardSession.reviewed}</strong></p>
                    <p><span>Đã nhớ</span><strong>{flashcardSession.remembered}</strong></p>
                    <p><span>Cần ôn lại</span><strong>{flashcardSession.again}</strong></p>
                    <p><span>Còn lại</span><strong>{Math.max(0, flashcardSession.cardIds.length - flashcardSession.currentIndex - 1)}</strong></p>
                    <p><span>SRS</span><strong>Tự lưu</strong></p>
                  </div>
                </aside>
              </div>
            ) : (
              <>
                {flashcardSession?.completed ? (
                  <section className="ll-flashcard-result ll-glass">
                    <div>
                      <span className="ll-metric-label">Kết quả phiên gần nhất</span>
                      <h2>{flashcardSession.again ? "Có thẻ cần ôn lại" : "Đã nhớ phiên này"}</h2>
                    </div>
                    <strong>{flashcardSession.remembered}/{flashcardSession.reviewed}</strong>
                    <button className="ll-btn mint" onClick={startFlashcardSession} type="button">Học phiên mới</button>
                    <button className="ll-btn ghost" onClick={() => setFlashcardSession(null)} type="button">Đóng</button>
                  </section>
                ) : null}

                <div className="ll-flashcard-lobby-grid">
                  <section className="ll-flashcard-start ll-glass">
                    <div className="ll-flashcard-section-head">
                      <div>
                        <span className="ll-metric-label">Chọn bộ thẻ để học</span>
                        <h2>Phiên ghi nhớ riêng</h2>
                      </div>
                      <span className="ll-flashcard-status">Không public</span>
                    </div>
                    <div className="ll-flashcard-deck-options">
                      {flashcardDeckOptions.map((deck) => (
                        <button
                          className={flashcardDeckId === deck.id ? "active" : undefined}
                          key={deck.id}
                          onClick={() => {
                            setFlashcardDeckId(deck.id);
                            setFlashcardSession(null);
                            setFlashcardFlipped(false);
                          }}
                          type="button"
                        >
                          <strong>{deck.label}</strong>
                          <span>{deck.detail}</span>
                          <span className="ll-accent">{flashcardDeckCounts[deck.id]} thẻ</span>
                        </button>
                      ))}
                    </div>
                    <div className="ll-flashcard-mode-options">
                      {flashcardModeOptions.map((mode) => (
                        <button
                          className={flashcardMode === mode.id ? "active" : undefined}
                          key={mode.id}
                          onClick={() => {
                            setFlashcardMode(mode.id);
                            setFlashcardSession(null);
                          }}
                          type="button"
                        >
                          <strong>{mode.label}</strong>
                          <span>{mode.detail}</span>
                        </button>
                      ))}
                    </div>
                    <div className="ll-flashcard-target-row">
                      <span>Số thẻ mỗi vòng</span>
                      {flashcardSessionSizeOptions.map((size) => (
                        <button
                          className={flashcardSessionSize === size ? "active" : undefined}
                          key={size}
                          onClick={() => setFlashcardSessionSize(size)}
                          type="button"
                        >
                          {size === 0 ? "Tất cả" : size}
                        </button>
                      ))}
                    </div>
                    <div className="ll-flashcard-target-row">
                      <span>Mặt hỏi</span>
                      <button
                        className={flashcardDirection === "front" ? "active" : undefined}
                        onClick={() => setFlashcardDirection("front")}
                        type="button"
                      >
                        Chữ → nghĩa
                      </button>
                      <button
                        className={flashcardDirection === "back" ? "active" : undefined}
                        onClick={() => setFlashcardDirection("back")}
                        type="button"
                      >
                        Nghĩa → chữ
                      </button>
                    </div>
                    {flashcardMode === "speed" ? (
                      <div className="ll-flashcard-target-row">
                        <span>Thời gian ôn nhanh</span>
                        {flashcardSpeedMinuteOptions.map((minutes) => (
                          <button
                            className={flashcardSpeedMinutes === minutes ? "active" : undefined}
                            key={minutes}
                            onClick={() => setFlashcardSpeedMinutes(minutes)}
                            type="button"
                          >
                            {minutes} phút
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <div className="ll-flashcard-hint">
                      {flashcardMode === "choice"
                        ? "Chế độ chọn đáp án sẽ lấy mặt đúng và các đáp án nhiễu từ cùng bộ bài đã xáo."
                        : flashcardMode === "speed"
                          ? "Ôn nhanh không chấm điểm, chỉ lưu thẻ nhớ/chưa nhớ cho thuật toán SRS."
                          : "Ghi nhớ tự do không giới hạn thời gian, phù hợp học kỹ một bộ thẻ."}
                    </div>
                    <button className="ll-btn primary ll-flashcard-start-button" onClick={startFlashcardSession} type="button">
                      Xáo bộ bài và học
                    </button>
                    {flashcardNotice ? <p className="ll-flashcard-notice">{flashcardNotice}</p> : null}
                  </section>

                  <section className="ll-flashcard-panel ll-glass">
                    <div className="ll-flashcard-section-head compact">
                      <div>
                        <span className="ll-metric-label">Thêm vào tủ riêng</span>
                        <h2>Thẻ cá nhân</h2>
                      </div>
                      <span>{flashcardDeckCounts.personal} thẻ</span>
                    </div>
                    <div className="ll-flashcard-form">
                      <label>
                        <span>Mặt trước</span>
                        <input
                          onChange={(event) => setFlashcardDraft((draft) => ({ ...draft, front: event.target.value }))}
                          placeholder="deadline"
                          value={flashcardDraft.front}
                        />
                      </label>
                      <label>
                        <span>Mặt sau</span>
                        <input
                          onChange={(event) => setFlashcardDraft((draft) => ({ ...draft, back: event.target.value }))}
                          placeholder="hạn chót"
                          value={flashcardDraft.back}
                        />
                      </label>
                      <label>
                        <span>Ví dụ / ghi chú</span>
                        <textarea
                          onChange={(event) => setFlashcardDraft((draft) => ({ ...draft, note: event.target.value }))}
                          placeholder="We need to finish before the deadline."
                          rows={3}
                          value={flashcardDraft.note}
                        />
                      </label>
                      <label>
                        <span>Nhãn</span>
                        <input
                          onChange={(event) => setFlashcardDraft((draft) => ({ ...draft, tag: event.target.value }))}
                          placeholder="Work vocab"
                          value={flashcardDraft.tag}
                        />
                      </label>
                      <button className="ll-btn primary" onClick={addFlashcardFromDraft} type="button">Lưu vào tủ riêng</button>
                    </div>
                  </section>

                  <section className="ll-flashcard-list ll-glass">
                    <div className="ll-flashcard-section-head compact">
                      <div>
                        <span className="ll-metric-label">Nguồn thẻ</span>
                        <h2>Lưu nhanh</h2>
                      </div>
                      <span>{deckFlashcards.length} trong bộ</span>
                    </div>
                    <div className="ll-flashcard-seeds">
                      {todayVocabularySeeds.map((seed) => (
                        <button key={seed.front} onClick={() => addSeedFlashcard(seed)} type="button">
                          <strong>{seed.front}</strong>
                          <span>{seed.back}</span>
                        </button>
                      ))}
                    </div>
                    <div className="ll-flashcard-stack preview">
                      {deckFlashcards.slice(0, 4).map((card) => (
                        <button
                          className={selectedFlashcard?.id === card.id ? "active" : undefined}
                          key={card.id}
                          onClick={() => selectFlashcard(card.id)}
                          type="button"
                        >
                          <span>
                            <strong>{card.front}</strong>
                            <small>{card.source === "personal" ? "Tủ riêng" : card.tag}</small>
                          </span>
                          <span className="ll-accent">{getFlashcardDueLabel(card)}</span>
                        </button>
                      ))}
                      {!deckFlashcards.length ? (
                        <div className="ll-flashcard-empty compact">
                          <strong>Bộ này chưa có thẻ.</strong>
                          <span>Thêm thẻ riêng hoặc lưu nhanh từ bài học.</span>
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        ) : null}

        {activeView === "shadowing" ? (
          <div className="ll-page">
            <PageTopbar
              eyebrow="LUYỆN PHÁT ÂM · SHADOWING"
              title="Nghe và "
              titleAccent="nhại theo giọng người bản xứ"
            />
            <ShadowingView />
          </div>
        ) : null}

        {activeView === "exams" ? (
          <div className="ll-page">
            <PageTopbar
              eyebrow="KHO ĐỀ THI · IELTS · TOEIC · VSTEP"
              title="Thư viện "
              titleAccent="đề thi"
            />
            <ExamHubV2 profile={profile} onStartExam={setActiveExamId} />
          </div>
        ) : null}

        {activeView === "schedule" ? (
          <div className="ll-page ll-schedule-page">
            <PageTopbar
              eyebrow={`LỊCH HỌC · ${formatMonthLabel(visibleScheduleMonth).toUpperCase()}`}
              title="Nhịp học của "
              titleAccent="bạn"
              actions={
                <>
                  <div className="ll-realtime-pill">
                    <LineIcon name="schedule" />
                    <span>{formatClock(currentTime)}</span>
                  </div>
                  <label className="ll-time-setter">
                    <span>Giờ học</span>
                    <input aria-label="Giờ học mặc định" onChange={(event) => updateDailyStudyTime(event.target.value)} type="time" value={dailyTime} />
                  </label>
                  <button className="ll-btn ghost" onClick={requestScheduleReminderPermission} type="button">Bật nhắc lịch</button>
                  <button className="ll-btn primary" onClick={addScheduleEvent} type="button">+ Thêm lịch</button>
                </>
              }
            />
            {activeScheduleReminder ? (
              <section className="ll-schedule-reminder ll-glass">
                <div>
                  <span>{activeScheduleReminder.sticker}</span>
                  <strong>Sắp tới: {activeScheduleReminder.title}</strong>
                  <small>{activeScheduleReminder.time} · nhắc trước {activeScheduleReminder.reminderMinutes} phút</small>
                </div>
                <button className="ll-btn mint" onClick={() => toggleScheduleEventDone(activeScheduleReminder.id)} type="button">Đánh dấu xong</button>
              </section>
            ) : null}
            {scheduleEmojiPickerOpen ? (
              <div className="ll-emoji-popover-layer" role="presentation" onMouseDown={() => setScheduleEmojiPickerOpen(false)}>
                <section className="ll-emoji-picker ll-glass" aria-label="Chọn emoji cho lịch" onMouseDown={(event) => event.stopPropagation()}>
                  <div className="ll-emoji-search">
                    <LineIcon name="search" />
                    <input
                      autoFocus
                      onChange={(event) => setScheduleEmojiSearch(event.target.value)}
                      placeholder="Tìm kiếm emoji..."
                      value={scheduleEmojiSearch}
                    />
                    <button aria-label="Đóng bảng emoji" onClick={() => setScheduleEmojiPickerOpen(false)} type="button">×</button>
                  </div>
                  <h3>{scheduleEmojiSearch.trim() ? "Kết quả tìm kiếm" : activeScheduleEmojiCategory.label}</h3>
                  <div className="ll-emoji-grid" role="listbox" aria-label="Danh sách emoji">
                    {visibleScheduleEmojis.map((emoji) => (
                      <button
                        aria-label={`Chọn emoji ${emoji}`}
                        className={scheduleDraft.sticker === emoji ? "active" : undefined}
                        key={emoji}
                        onClick={() => {
                          setScheduleDraft((draft) => ({ ...draft, sticker: emoji }));
                          setScheduleEmojiPickerOpen(false);
                        }}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                    {!visibleScheduleEmojis.length ? <span className="ll-emoji-empty">Không tìm thấy emoji phù hợp.</span> : null}
                  </div>
                  <div className="ll-emoji-tabs" aria-label="Danh mục emoji">
                    {scheduleEmojiCategories.map((category) => (
                      <button
                        className={scheduleEmojiCategory === category.id ? "active" : undefined}
                        key={category.id}
                        onClick={() => {
                          setScheduleEmojiCategory(category.id);
                          setScheduleEmojiSearch("");
                        }}
                        title={category.label}
                        type="button"
                      >
                        {category.icon}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}
            <div className="ll-card-grid ll-schedule-html-grid">
              <section className="ll-calendar-card ll-glass">
                <div className="ll-calendar-header">
                  <h2>{formatMonthLabel(visibleScheduleMonth)}</h2>
                  <div className="ll-speed-row">
                    <button onClick={() => shiftScheduleMonth(-1)} type="button">‹</button>
                    <button className="active" onClick={goToTodaySchedule} type="button">Hôm nay</button>
                    <button onClick={() => shiftScheduleMonth(1)} type="button">›</button>
                  </div>
                </div>
                <div className="ll-calendar-grid">
                  {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => <span className="weekday" key={day}>{day}</span>)}
                  {scheduleCalendarCells.map((cell) => {
                    const completed = cell.events.length > 0 && cell.events.every((event) => event.status === "done");
                    const hasReminder = cell.events.some((event) => event.reminderMinutes > 0 && event.status !== "done");
                    const className = [
                      "ll-calendar-day",
                      cell.inMonth ? "" : "muted",
                      cell.isToday ? "today" : "",
                      cell.isSelected ? "selected" : "",
                      cell.events.length ? "has-event" : "",
                      completed ? "completed" : "",
                      hasReminder ? "has-reminder" : ""
                    ].filter(Boolean).join(" ");

                    return (
                      <button className={className} key={cell.dateKey} onClick={() => selectScheduleDate(cell.dateKey)} type="button">
                        <span className="ll-day-number">{cell.dayNumber}</span>
                        {cell.events.length ? (
                          <span className="ll-day-stickers">
                            {cell.events.slice(0, 3).map((event) => <i key={event.id}>{event.sticker}</i>)}
                          </span>
                        ) : null}
                        {cell.events.length ? <b>{cell.events.length} lịch</b> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className="ll-timeline-panel ll-glass">
                <div className="ll-metric-label">{selectedScheduleDate === todayDateKey ? "Hôm nay" : "Đang chọn"} · {formatShortDate(selectedScheduleDate)}</div>
                <h2>{selectedScheduleEvents.length} hoạt động</h2>
                <div className="ll-schedule-progress">
                  <span>{selectedScheduleDoneCount}/{selectedScheduleEvents.length || 0} hoàn thành</span>
                  <div><i style={{ width: `${selectedScheduleEvents.length ? (selectedScheduleDoneCount / selectedScheduleEvents.length) * 100 : 0}%` }} /></div>
                </div>
                <div className="ll-timeline-list">
                  {selectedScheduleEvents.map((activity) => {
                    const computedStatus = getScheduleComputedStatus(activity, currentTime);
                    return (
                    <article className={`ll-timeline-item ${computedStatus}`} key={activity.id}>
                      <div className="ll-timeline-time">{activity.time}</div>
                      <div>
                        <strong><span>{activity.sticker}</span>{activity.title}</strong>
                        <span>{activity.duration} phút · nhắc trước {activity.reminderMinutes} phút · {computedStatus === "done" ? "Hoàn thành" : computedStatus === "missed" ? "Đã quá giờ" : "Sắp tới"}</span>
                      </div>
                      <button className={activity.status === "done" ? "ll-mini-action done" : "ll-mini-action"} onClick={() => toggleScheduleEventDone(activity.id)} type="button">
                        {activity.status === "done" ? "Mở lại" : "Xong"}
                      </button>
                    </article>
                    );
                  })}
                  {!selectedScheduleEvents.length ? (
                    <div className="ll-schedule-empty">
                      <strong>Ngày này chưa có lịch học.</strong>
                      <span>Thêm sự kiện, sticker và nhắc lịch ở form bên dưới.</span>
                    </div>
                  ) : null}
                </div>
                <div className="ll-schedule-form">
                  <div className="ll-schedule-form-row">
                    <label>
                      <span>Tên hoạt động</span>
                      <input onChange={(event) => setScheduleDraft((draft) => ({ ...draft, title: event.target.value }))} value={scheduleDraft.title} />
                    </label>
                    <label>
                      <span>Ngày</span>
                      <input onChange={(event) => selectScheduleDate(event.target.value)} type="date" value={scheduleDraft.date} />
                    </label>
                  </div>
                  <div className="ll-schedule-form-row compact">
                    <label>
                      <span>Giờ</span>
                      <input onChange={(event) => setScheduleDraft((draft) => ({ ...draft, time: event.target.value }))} type="time" value={scheduleDraft.time} />
                    </label>
                    <label>
                      <span>Phút</span>
                      <input min="1" onChange={(event) => setScheduleDraft((draft) => ({ ...draft, duration: event.target.value }))} type="number" value={scheduleDraft.duration} />
                    </label>
                    <label>
                      <span>Nhắc trước</span>
                      <select onChange={(event) => setScheduleDraft((draft) => ({ ...draft, reminderMinutes: event.target.value }))} value={scheduleDraft.reminderMinutes}>
                        <option value="0">Không nhắc</option>
                        <option value="5">5 phút</option>
                        <option value="10">10 phút</option>
                        <option value="15">15 phút</option>
                        <option value="30">30 phút</option>
                      </select>
                    </label>
                  </div>
                  <div className="ll-sticker-field">
                    <div className="ll-sticker-row" aria-label="Chọn sticker nhanh cho lịch">
                      {recentScheduleStickers.map((sticker) => (
                        <button className={scheduleDraft.sticker === sticker ? "active" : undefined} key={sticker} onClick={() => setScheduleDraft((draft) => ({ ...draft, sticker }))} type="button">{sticker}</button>
                      ))}
                      <button className="ll-emoji-open" onClick={() => setScheduleEmojiPickerOpen((open) => !open)} type="button">
                        {scheduleDraft.sticker} Chọn emoji
                      </button>
                    </div>
                  </div>
                  <button className="ll-btn primary" onClick={addScheduleEvent} type="button">Lưu sự kiện</button>
                  {scheduleNotice ? <p className="ll-schedule-notice">{scheduleNotice}</p> : null}
                </div>
                <div className="ll-schedule-history">
                  <div className="ll-metric-label">Lịch sử gần đây</div>
                  {scheduleHistory.map((event) => (
                    <button key={event.id} onClick={() => selectScheduleDate(event.date)} type="button">
                      <span>{event.sticker}</span>
                      <strong>{event.title}</strong>
                      <span className="ll-accent">{formatShortDate(event.date)} · {event.time}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {activeView === "group" ? (
          <GroupsView
            groups={defaultStudyGroupsV2}
            currentUserId="m-self"
            joinedGroupIds={joinedGroupIds}
            onJoinRequest={(groupId) => toggleGroup(groupId)}
            onCreateGroup={() => {
              // TODO: open create-group modal in v1.1
              console.log("Create group flow not yet implemented");
            }}
          />
        ) : null}

        {activeView === "profile" ? (
          <div className="ll-page">
            <PageTopbar
              eyebrow="HỒ SƠ HỌC TẬP"
              title="Tài khoản và "
              titleAccent="avatar"
            />
            <section className="ll-profile-workbench ll-glass">
              <div className="ll-avatar-column">
                <div className={`ll-profile-avatar large ${avatarClass}`} data-mode={profile.avatarMode}>
                  <AvatarContent initials={initials} profile={profile} />
                </div>
                <div className="ll-avatar-status">{avatarStatus}</div>
                <button className="ll-btn ghost" onClick={resetAvatar} type="button">Dùng chữ tắt</button>
              </div>
              <div className="ll-settings-grid">
                <label>Tên hiển thị<input onChange={(event) => persistProfile({ ...profile, name: event.target.value })} value={profile.name} /></label>
                <label>Email<input onChange={(event) => persistProfile({ ...profile, email: event.target.value })} value={profile.email} /></label>
                <label>Provider<input readOnly value={providerLabels[profile.provider]} /></label>
                <label className="ll-avatar-upload">Upload ảnh / GIF<input accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarUpload} type="file" /></label>
                <div className="ll-gif-picker wide">
                  <div className="ll-gif-picker-head">
                    <div>
                      <div className="ll-metric-label">GIF từ GIPHY</div>
                      <h2>Chọn avatar động</h2>
                    </div>
                    <div className="ll-gif-search">
                      <input
                        onChange={(event) => setGifSearchTerm(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void searchGifAvatar();
                          }
                        }}
                        placeholder="study cat, happy, focus..."
                        value={gifSearchTerm}
                      />
                      <button className="ll-btn ghost" disabled={gifLoading} onClick={() => void searchGifAvatar()} type="button">
                        {gifLoading ? "Đang tìm" : "Tìm"}
                      </button>
                    </div>
                  </div>
                  <div className="ll-gif-grid" aria-label="Danh sách GIF avatar">
                    {gifResults.map((gif) => (
                      <button
                        aria-label={`Chọn GIF ${gif.title}`}
                        className={profile.avatarUrl === gif.url ? "ll-gif-option active" : "ll-gif-option"}
                        key={gif.id}
                        onClick={() => selectGifAvatar(gif)}
                        title={gif.title}
                        type="button"
                      >
                        <img alt="" src={gif.previewUrl} />
                      </button>
                    ))}
                  </div>
                </div>
                {avatarNotice ? <div className="ll-avatar-notice wide">{avatarNotice}</div> : null}
              </div>
            </section>
          </div>
        ) : null}

        <section className="ll-bottom-bar ll-glass">
          <div className="ll-bottom-actions">
            <button onClick={() => setActiveView("lesson")} type="button"><LineIcon name="chart" /> Chỉ số bài học</button>
            <button onClick={() => setActiveView("flashcards")} type="button"><LineIcon name="flashcards" /> Flashcard</button>
            <button onClick={() => setActiveView("practice")} type="button"><LineIcon name="folder" /> Ngân hàng đề</button>
            <button onClick={() => setActiveView("group")} type="button"><LineIcon name="users" /> Nhóm học</button>
          </div>
          <div className="ll-bottom-status"><strong>{completedToday}/{todayTasks.length}</strong> việc học đã hoàn thành · Mochi đang vui</div>
          <button className="ll-btn primary" onClick={() => setActiveView("lesson")} type="button">Tiếp tục học</button>
        </section>
      </main>

      <nav className="ll-mobile-nav ll-glass" aria-label="Điều hướng mobile">
        {navItems.slice(0, 5).map((item) => (
          <button className={activeView === item.id ? "active" : undefined} key={item.id} onClick={() => setActiveView(item.id)} type="button">
            <LineIcon name={item.id} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}
