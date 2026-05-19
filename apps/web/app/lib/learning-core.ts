export type Goal = "exam" | "work" | "foundation";

export type PathStep = {
  id: string;
  title: string;
  detail: string;
  kind: "placement" | "lesson" | "review" | "shadowing" | "test" | "ai";
  minutes: number;
};

export type TodayTask = {
  id: string;
  title: string;
  detail: string;
  minutes: number;
};

export type Question = {
  id: string;
  skill: "Listening" | "Reading" | "Vocabulary" | "Grammar" | "Speaking";
  level: string;
  prompt: string;
  answer: string;
  explanation: string;
};

const goalLabels: Record<Goal, string> = {
  exam: "luyện thi",
  work: "giao tiếp công việc",
  foundation: "bổ túc nền tảng"
};

const pathTemplates: Record<Goal, Array<Omit<PathStep, "id" | "minutes" | "detail">>> = {
  exam: [
    { title: "Placement test", kind: "placement" },
    { title: "Lấp lỗ hổng ngữ pháp", kind: "lesson" },
    { title: "Reading drills theo blueprint", kind: "lesson" },
    { title: "Listening sets có transcript", kind: "lesson" },
    { title: "Mock test từ question bank", kind: "test" }
  ],
  work: [
    { title: "Đánh giá phản xạ nói", kind: "placement" },
    { title: "Cụm câu công việc", kind: "lesson" },
    { title: "Roleplay có kịch bản", kind: "ai" },
    { title: "Shadowing meeting", kind: "shadowing" },
    { title: "Báo cáo tiến bộ tuần", kind: "review" }
  ],
  foundation: [
    { title: "Skill map đầu vào", kind: "placement" },
    { title: "Micro grammar", kind: "lesson" },
    { title: "SRS flashcards", kind: "review" },
    { title: "Listening basics", kind: "lesson" },
    { title: "Review thích nghi", kind: "review" }
  ]
};

const questionBank: Record<Goal, Question[]> = {
  exam: [
    {
      id: "exam-vocab-1",
      skill: "Vocabulary",
      level: "A2-B1",
      prompt: "Choose the closest meaning of 'deadline'.",
      answer: "The latest time something must be finished.",
      explanation: "Question is from reviewed vocabulary bank, not generated freely by AI."
    },
    {
      id: "exam-reading-1",
      skill: "Reading",
      level: "B1",
      prompt: "A notice says 'Staff only'. Who can enter?",
      answer: "Only employees or authorized workers.",
      explanation: "This checks sign/notice comprehension."
    },
    {
      id: "exam-listening-1",
      skill: "Listening",
      level: "A2",
      prompt: "Transcript: 'The train leaves at quarter past nine.' What time is it?",
      answer: "9:15",
      explanation: "Quarter past means 15 minutes after the hour."
    }
  ],
  work: [
    {
      id: "work-speaking-1",
      skill: "Speaking",
      level: "A2-B1",
      prompt: "Respond politely: 'Can you give us a quick update?'",
      answer: "Sure. I finished the first part and I am checking the final details.",
      explanation: "A good work answer is short, clear, and status-oriented."
    },
    {
      id: "work-grammar-1",
      skill: "Grammar",
      level: "A2",
      prompt: "Fix: 'I am agree with this plan.'",
      answer: "I agree with this plan.",
      explanation: "'Agree' is a verb; do not use 'am agree'."
    },
    {
      id: "work-vocab-1",
      skill: "Vocabulary",
      level: "B1",
      prompt: "What does 'follow up' mean in a meeting context?",
      answer: "To contact or check again after the meeting.",
      explanation: "This phrase is common in work communication."
    }
  ],
  foundation: [
    {
      id: "foundation-grammar-1",
      skill: "Grammar",
      level: "A1-A2",
      prompt: "Fill in: She ___ coffee every morning.",
      answer: "drinks",
      explanation: "Use present simple with third-person singular."
    },
    {
      id: "foundation-vocab-1",
      skill: "Vocabulary",
      level: "A1",
      prompt: "Translate: 'Tôi đang học tiếng Anh.'",
      answer: "I am learning English.",
      explanation: "Present continuous describes an action happening around now."
    },
    {
      id: "foundation-listening-1",
      skill: "Listening",
      level: "A1",
      prompt: "Transcript: 'Nice to meet you.' What is the purpose?",
      answer: "Greeting someone for the first time.",
      explanation: "This is a basic social greeting."
    }
  ]
};

export function generateLearningPath(input: {
  goal: Goal;
  language: string;
  level: string;
  dailyMinutes: number;
}): PathStep[] {
  const minutes = Math.max(4, Math.round(input.dailyMinutes / 2));

  return pathTemplates[input.goal].map((step, index) => ({
    ...step,
    id: `${input.goal}-${index + 1}`,
    minutes: index === 0 ? Math.min(5, input.dailyMinutes) : minutes,
    detail: `${input.language}, level ${input.level}. Ưu tiên ${goalLabels[input.goal]} trong ${input.dailyMinutes} phút/ngày.`
  }));
}

export function generateTodayTasks(input: {
  goal: Goal;
  dailyMinutes: number;
  language: string;
}): TodayTask[] {
  const base: Record<Goal, TodayTask[]> = {
    exam: [
      { id: "exam-task-1", title: "12 câu vocabulary", detail: "Ôn từ theo SRS", minutes: 4 },
      { id: "exam-task-2", title: "1 passage reading", detail: "Đọc nhanh và giải thích đáp án", minutes: 6 },
      { id: "exam-task-3", title: "Chữa lỗi ngắn", detail: "Ghi lại 1 lỗi cần ôn", minutes: 3 }
    ],
    work: [
      { id: "work-task-1", title: "Warm-up phản xạ", detail: "3 câu trả lời ngắn", minutes: 3 },
      { id: "work-task-2", title: "Roleplay meeting", detail: "Kịch bản có giới hạn AI", minutes: 5 },
      { id: "work-task-3", title: "Shadowing 1 đoạn", detail: "Lặp từng câu theo transcript", minutes: 4 }
    ],
    foundation: [
      { id: "foundation-task-1", title: "8 flashcards", detail: "Từ mới cần ôn hôm nay", minutes: 4 },
      { id: "foundation-task-2", title: "Mini grammar", detail: "Một điểm ngữ pháp nhỏ", minutes: 4 },
      { id: "foundation-task-3", title: "Typing correction", detail: "Viết lại câu đúng", minutes: 4 }
    ]
  };

  return base[input.goal].slice(0, input.dailyMinutes <= 5 ? 1 : input.dailyMinutes <= 10 ? 2 : 3).map((task) => ({
    ...task,
    detail: `${task.detail} · ${input.language}`
  }));
}

export function generatePracticeTest(input: {
  goal: Goal;
  level: string;
  count?: number;
}): Question[] {
  const pool = questionBank[input.goal];
  return pool.slice(0, input.count ?? 3).map((question, index) => ({
    ...question,
    id: `${question.id}-${input.level}-${index}`
  }));
}

export function calculateCompletionPercent(total: number, completed: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}
