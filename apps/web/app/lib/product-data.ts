import type { Goal } from "./learning-core";

export type AuthProvider = "gmail" | "facebook" | "token";

export type AvatarMode = "initial" | "image" | "gif";

export type PlacementBand = "starter" | "building" | "ready";

export type PlacementSkillMap = {
  grammar: number;
  listening: number;
  speaking: number;
  vocabulary: number;
};

export type LearnerProfile = {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  token: string;
  avatarMode: AvatarMode;
  avatarUrl?: string;
  gifPrompt?: string;
  language: string;
  level: string;
  goal: Goal;
  dailyMinutes: number;
  placementBand?: PlacementBand;
  placementCompletedAt?: string;
  placementScore?: number;
  skillMap?: PlacementSkillMap;
  aiTokenBudget: number;
  aiTokenUsed: number;
  enrolledCourseIds: string[];
  completedTaskIds: string[];
  createdAt: string;
};

export type CourseStatus = "published" | "draft" | "review";

export type Course = {
  id: string;
  title: string;
  language: string;
  level: string;
  goal: Goal;
  objective: string;
  minutesPerDay: number;
  lessons: number;
  students: number;
  aiPolicy: string;
  status: CourseStatus;
};

export type AdminLearner = {
  id: string;
  name: string;
  email: string;
  goal: Goal;
  language: string;
  progress: number;
  tokenUsed: number;
  plan: "Free" | "Plus" | "Studio";
};

export const SESSION_STORAGE_KEY = "lumalang.session.v1";
export const COURSE_STORAGE_KEY = "lumalang.admin-courses.v1";

export const goalLabels: Record<Goal, string> = {
  exam: "Học để thi",
  work: "Giao tiếp công việc",
  foundation: "Bổ túc kiến thức"
};

export const providerLabels: Record<AuthProvider, string> = {
  gmail: "Gmail",
  facebook: "Facebook",
  token: "Token"
};

export const defaultCourses: Course[] = [
  {
    id: "course-en-a1-foundation",
    title: "English Starter A1",
    language: "Tiếng Anh",
    level: "A1",
    goal: "foundation",
    objective: "Đánh chắc phát âm, mẫu câu nền, từ vựng sinh hoạt và phản xạ ngắn.",
    minutesPerDay: 8,
    lessons: 24,
    students: 980,
    aiPolicy: "AI chỉ dùng để sửa câu ngắn và gợi ý ví dụ đã kiểm soát.",
    status: "published"
  },
  {
    id: "course-work-a1",
    title: "Work Talk Starter A1",
    language: "Tiếng Anh",
    level: "A1",
    goal: "work",
    objective: "Câu chào hỏi công việc, tự giới thiệu, cập nhật việc đơn giản và phản xạ nghe chậm.",
    minutesPerDay: 8,
    lessons: 22,
    students: 740,
    aiPolicy: "Roleplay ngắn, câu mẫu cố định, AI chỉ sửa lỗi cơ bản.",
    status: "published"
  },
  {
    id: "course-work-a2",
    title: "Work Talk A2",
    language: "Tiếng Anh",
    level: "A2",
    goal: "work",
    objective: "Phản xạ trong meeting, email ngắn, phỏng vấn và cập nhật tiến độ.",
    minutesPerDay: 10,
    lessons: 28,
    students: 1240,
    aiPolicy: "Roleplay AI có quota, ưu tiên template đã kiểm duyệt.",
    status: "published"
  },
  {
    id: "course-work-b1",
    title: "Meeting Fluency B1",
    language: "Tiếng Anh",
    level: "B1",
    goal: "work",
    objective: "Điều phối meeting, xử lý follow-up, nói rõ ràng khi có áp lực và viết recap ngắn.",
    minutesPerDay: 15,
    lessons: 34,
    students: 910,
    aiPolicy: "Roleplay theo kịch bản và chấm phản hồi theo rubric đã kiểm duyệt.",
    status: "published"
  },
  {
    id: "course-exam-b1",
    title: "IELTS Foundation B1",
    language: "Tiếng Anh",
    level: "B1",
    goal: "exam",
    objective: "Từ vựng học thuật, reading blueprint, listening transcript và mock test.",
    minutesPerDay: 15,
    lessons: 36,
    students: 860,
    aiPolicy: "Chấm giải thích theo rubric, hạn chế sinh đề tự do.",
    status: "published"
  },
  {
    id: "course-jp-n5",
    title: "Japanese N5 Chill",
    language: "Tiếng Nhật",
    level: "N5",
    goal: "foundation",
    objective: "Kana, mẫu câu nền tảng, flashcard SRS và shadowing câu ngắn.",
    minutesPerDay: 12,
    lessons: 32,
    students: 690,
    aiPolicy: "AI gợi ý ví dụ ngắn, dữ liệu chính từ lesson bank.",
    status: "review"
  },
  {
    id: "course-kr-a1",
    title: "Korean Daily A1",
    language: "Tiếng Hàn",
    level: "A1",
    goal: "foundation",
    objective: "Hangul, câu giao tiếp thường ngày và luyện nghe chậm.",
    minutesPerDay: 10,
    lessons: 24,
    students: 520,
    aiPolicy: "Không dùng AI khi không cần; ưu tiên audio và flashcard.",
    status: "draft"
  }
];

export function getRecommendedCourseId(courses: Course[], input: { goal: Goal; language: string; level: string }) {
  const availableCourses = courses.filter((course) => course.status === "published");
  const pool = availableCourses.length ? availableCourses : courses;
  const exactCourse = pool.find(
    (course) => course.language === input.language && course.goal === input.goal && course.level === input.level
  );
  const sameGoalCourse = pool.find((course) => course.language === input.language && course.goal === input.goal);
  const sameLanguageCourse = pool.find((course) => course.language === input.language);
  const sameGoalFallback = pool.find((course) => course.goal === input.goal);

  return (exactCourse ?? sameGoalCourse ?? sameLanguageCourse ?? sameGoalFallback ?? pool[0] ?? defaultCourses[0]).id;
}

export const defaultAdminLearners: AdminLearner[] = [
  {
    id: "learner-1",
    name: "Minh Anh",
    email: "minhanh@demo.local",
    goal: "work",
    language: "Tiếng Anh",
    progress: 68,
    tokenUsed: 820,
    plan: "Plus"
  },
  {
    id: "learner-2",
    name: "Khoa",
    email: "khoa@demo.local",
    goal: "exam",
    language: "Tiếng Anh",
    progress: 42,
    tokenUsed: 410,
    plan: "Free"
  },
  {
    id: "learner-3",
    name: "Linh",
    email: "linh@demo.local",
    goal: "foundation",
    language: "Tiếng Nhật",
    progress: 76,
    tokenUsed: 590,
    plan: "Studio"
  }
];

export function createDemoProfile(input: {
  provider: AuthProvider;
  name: string;
  email: string;
  token: string;
  language: string;
  level: string;
  goal: Goal;
  dailyMinutes: number;
  avatarUrl?: string;
  avatarMode?: AvatarMode;
  gifPrompt?: string;
  placementBand?: PlacementBand;
  placementCompletedAt?: string;
  placementScore?: number;
  skillMap?: PlacementSkillMap;
}): LearnerProfile {
  const now = new Date().toISOString();
  const recommendedCourseId = getRecommendedCourseId(defaultCourses, input);

  return {
    id: `learner-${Date.now()}`,
    name: input.name.trim() || "Bạn học mới",
    email: input.email.trim() || "learner@lumalang.local",
    provider: input.provider,
    token: input.token.trim() || `${input.provider}-demo-token`,
    avatarMode: input.avatarMode ?? "initial",
    avatarUrl: input.avatarUrl,
    gifPrompt: input.gifPrompt,
    language: input.language,
    level: input.level,
    goal: input.goal,
    dailyMinutes: input.dailyMinutes,
    placementBand: input.placementBand,
    placementCompletedAt: input.placementCompletedAt,
    placementScore: input.placementScore,
    skillMap: input.skillMap,
    aiTokenBudget: input.provider === "token" ? 2400 : 1200,
    aiTokenUsed: 180,
    enrolledCourseIds: [recommendedCourseId],
    completedTaskIds: ["work-task-1"],
    createdAt: now
  };
}
