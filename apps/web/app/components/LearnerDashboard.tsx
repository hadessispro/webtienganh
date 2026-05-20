"use client";

import Link from "next/link";
import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  calculateCompletionPercent,
  generateLearningPath,
  generatePracticeTest,
  generateTodayTasks
} from "../lib/learning-core";
import {
  COURSE_STORAGE_KEY,
  Course,
  LearnerProfile,
  SESSION_STORAGE_KEY,
  createDemoProfile,
  defaultCourses,
  goalLabels,
  providerLabels
} from "../lib/product-data";
import { KnowledgeTreeScene } from "./KnowledgeTreeScene";

type LearningView =
  | "today"
  | "lesson"
  | "courses"
  | "practice"
  | "shadowing"
  | "schedule"
  | "group"
  | "profile";

type ShadowingClip = {
  id: string;
  title: string;
  language: string;
  level: string;
  context: string;
  transcript: string[];
};

type StudyGroup = {
  id: string;
  title: string;
  language: string;
  level: string;
  schedule: string;
  members: number;
};

const navItems: Array<{ id: LearningView; label: string; count?: string }> = [
  { id: "today", label: "Hôm nay" },
  { id: "lesson", label: "Bài học" },
  { id: "courses", label: "Khóa học" },
  { id: "practice", label: "Đề luyện" },
  { id: "shadowing", label: "Shadowing" },
  { id: "schedule", label: "Lịch học" },
  { id: "group", label: "Học nhóm" },
  { id: "profile", label: "Hồ sơ" }
];

const shadowingClips: ShadowingClip[] = [
  {
    id: "meeting-update",
    title: "Meeting: giving a short update",
    language: "Tiếng Anh",
    level: "A2",
    context: "Công việc",
    transcript: [
      "Could you walk me through the update?",
      "Sure. I finished the first part and I am checking the final details.",
      "I will send the summary before five."
    ]
  },
  {
    id: "travel-checkin",
    title: "Hotel check-in",
    language: "Tiếng Anh",
    level: "A1",
    context: "Giao tiếp",
    transcript: [
      "Hi, I have a reservation under Nguyen.",
      "Could I see your passport, please?",
      "Your room is ready on the fifth floor."
    ]
  },
  {
    id: "jp-intro",
    title: "Japanese self introduction",
    language: "Tiếng Nhật",
    level: "N5",
    context: "Nền tảng",
    transcript: ["はじめまして。", "ベトナムから来ました。", "よろしくお願いします。"]
  }
];

const studyGroups: StudyGroup[] = [
  {
    id: "night-work-a2",
    title: "Nhóm Công việc buổi tối",
    language: "Tiếng Anh",
    level: "A2",
    schedule: "20:30 thứ 3, 5",
    members: 12
  },
  {
    id: "ielts-b1",
    title: "IELTS foundation sprint",
    language: "Tiếng Anh",
    level: "B1",
    schedule: "21:00 thứ 2, 4",
    members: 18
  },
  {
    id: "jp-n5",
    title: "N5 chill room",
    language: "Tiếng Nhật",
    level: "N5",
    schedule: "19:45 cuối tuần",
    members: 9
  }
];

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

function Avatar({ profile, small = false }: { profile: LearnerProfile; small?: boolean }) {
  const initials = getInitials(profile.name);

  return (
    <div className={small ? "avatar-preview app-avatar small" : "avatar-preview app-avatar"} data-mode={profile.avatarMode}>
      {profile.avatarUrl ? <img alt={`Avatar của ${profile.name}`} src={profile.avatarUrl} /> : <span>{initials || "L"}</span>}
    </div>
  );
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

function MockNavIcon({ id }: { id: LearningView }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.8 };
  const icons: Record<LearningView, ReactNode> = {
    today: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" />
      </svg>
    ),
    lesson: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M6 4h9a3 3 0 0 1 3 3v13H8a2 2 0 0 1-2-2z" />
        <path {...common} d="M8 18h10M9 8h6M9 12h5" />
      </svg>
    ),
    courses: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v14H6.5A2.5 2.5 0 0 1 4 15.5z" />
        <path {...common} d="M7 18V4M10 8h6M10 12h5" />
      </svg>
    ),
    practice: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M8 4h8l2 3v13H6V7z" />
        <path {...common} d="M9 11h6M9 15h4M15 4v4h3" />
      </svg>
    ),
    shadowing: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z" />
        <path {...common} d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
      </svg>
    ),
    schedule: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2zM8 3v4M16 3v4M4 10h16" />
      </svg>
    ),
    group: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M16 19a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 18a3 3 0 0 0-3-3M18 11a2.5 2.5 0 1 0 0-5" />
      </svg>
    ),
    profile: (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path {...common} d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0" />
      </svg>
    )
  };

  return icons[id];
}

function MochiGardenScene() {
  return (
    <svg aria-hidden="true" viewBox="0 0 460 360" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="mock-ground" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#8cc69b" stopOpacity="0.86" />
          <stop offset="62%" stopColor="#5bae6f" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#2f8f4b" stopOpacity="0.22" />
        </radialGradient>
        <radialGradient id="mock-leaves-a" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#a8d4b3" />
          <stop offset="58%" stopColor="#5bae6f" />
          <stop offset="100%" stopColor="#2f8f4b" />
        </radialGradient>
        <radialGradient id="mock-leaves-b" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#b8dcc1" />
          <stop offset="55%" stopColor="#6db77f" />
          <stop offset="100%" stopColor="#1f6f37" />
        </radialGradient>
        <linearGradient id="mock-trunk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a3d28" />
          <stop offset="50%" stopColor="#7a5638" />
          <stop offset="100%" stopColor="#3d2818" />
        </linearGradient>
        <radialGradient id="mock-fox-body" cx="40%" cy="40%">
          <stop offset="0%" stopColor="#ffb074" />
          <stop offset="60%" stopColor="#e88945" />
          <stop offset="100%" stopColor="#b35d20" />
        </radialGradient>
        <filter id="mock-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
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
      <ellipse cx="230" cy="290" rx="180" ry="32" fill="url(#mock-ground)" />
      <ellipse cx="230" cy="285" rx="160" ry="22" fill="#7ac08c" opacity="0.7" />
      <path d="M90 285q3-8 6 0M100 282q3-10 6 0M380 285q3-8 6 0" stroke="#3d8a52" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="120" cy="293" rx="10" ry="4" fill="#8a9b8e" opacity="0.7" />
      <ellipse cx="360" cy="295" rx="8" ry="3" fill="#8a9b8e" opacity="0.7" />
      <g opacity="0.5">
        <rect x="60" y="220" width="6" height="40" fill="#5a3d28" rx="2" />
        <circle cx="63" cy="215" r="22" fill="url(#mock-leaves-b)" />
        <rect x="395" y="225" width="5" height="35" fill="#5a3d28" rx="2" />
        <circle cx="397" cy="220" r="18" fill="url(#mock-leaves-b)" />
      </g>
      <g className="mock-tree-leaves" filter="url(#mock-soft-shadow)">
        <path d="M180 290Q175 240 190 200L210 200Q225 240 220 290Z" fill="url(#mock-trunk)" />
        <path d="M185 285Q182 240 195 205" stroke="#9a7048" strokeWidth="2" fill="none" opacity="0.6" />
        <circle cx="200" cy="170" r="60" fill="url(#mock-leaves-a)" />
        <circle cx="160" cy="180" r="48" fill="url(#mock-leaves-b)" />
        <circle cx="240" cy="175" r="52" fill="url(#mock-leaves-b)" />
        <circle cx="200" cy="130" r="50" fill="url(#mock-leaves-a)" />
        <circle cx="170" cy="140" r="38" fill="url(#mock-leaves-a)" />
        <circle cx="230" cy="135" r="42" fill="url(#mock-leaves-b)" />
        <ellipse cx="185" cy="115" rx="22" ry="14" fill="#c9e3d0" opacity="0.5" />
        <ellipse cx="215" cy="155" rx="18" ry="10" fill="#d4ebd9" opacity="0.4" />
        <circle cx="155" cy="170" r="5" fill="#ff8a65" />
        <circle cx="245" cy="165" r="5" fill="#ffb074" />
        <circle cx="190" cy="115" r="4" fill="#ff8a65" />
      </g>
      <g className="mock-pet-group" filter="url(#mock-soft-shadow)">
        <path d="M295 250Q340 230 350 200Q355 195 350 215Q345 245 310 270Z" fill="url(#mock-fox-body)" />
        <path d="M340 215Q348 205 348 218Q343 232 330 245" fill="#fff5e8" />
        <ellipse cx="280" cy="260" rx="38" ry="32" fill="url(#mock-fox-body)" />
        <ellipse cx="278" cy="270" rx="22" ry="18" fill="#fff5e8" />
        <ellipse cx="265" cy="285" rx="8" ry="10" fill="#c66d28" />
        <ellipse cx="295" cy="285" rx="8" ry="10" fill="#c66d28" />
        <ellipse cx="275" cy="225" rx="32" ry="28" fill="url(#mock-fox-body)" />
        <ellipse cx="272" cy="235" rx="18" ry="14" fill="#fff5e8" />
        <path d="M250 205L245 180L262 198Z" fill="#c66d28" />
        <path d="M252 200L250 188L258 197Z" fill="#ff8a65" />
        <path d="M298 205L305 180L290 198Z" fill="#c66d28" />
        <path d="M296 200L300 188L292 197Z" fill="#ff8a65" />
        <g className="mock-pet-eye">
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

export function LearnerDashboard() {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  const [activeView, setActiveView] = useState<LearningView>("today");
  const [selectedCourseId, setSelectedCourseId] = useState(defaultCourses[0]?.id ?? "");
  const [selectedClipId, setSelectedClipId] = useState(shadowingClips[0].id);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [dailyTime, setDailyTime] = useState("20:30");
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>(["night-work-a2"]);
  const [gifPrompt, setGifPrompt] = useState("leaf mascot đang học chill bên cửa sổ");

  useEffect(() => {
    const loadedCourses = readJson<Course[]>(COURSE_STORAGE_KEY, defaultCourses);
    const loadedProfile = readJson<LearnerProfile | null>(SESSION_STORAGE_KEY, null) ?? createFallbackProfile();
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(loadedProfile));
    setProfile(loadedProfile);
    setCourses(loadedCourses.length ? loadedCourses : defaultCourses);
    setSelectedCourseId(loadedProfile.enrolledCourseIds[0] ?? loadedCourses[0]?.id ?? defaultCourses[0].id);
    setGifPrompt(loadedProfile.gifPrompt ?? "leaf mascot đang học chill bên cửa sổ");
  }, []);

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
      count: 3
    });
  }, [profile]);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0];
  const selectedClip = shadowingClips.find((clip) => clip.id === selectedClipId) ?? shadowingClips[0];
  const completedToday = profile
    ? todayTasks.filter((task) => profile.completedTaskIds.includes(task.id)).length
    : 0;
  const completion = calculateCompletionPercent(todayTasks.length, completedToday);
  const studyScore = Math.min(99, Math.round((72 + completion * 0.22) * 10) / 10);
  const learningStreak = 7 + completedToday;
  const tokenPercent = profile
    ? Math.min(100, Math.round((profile.aiTokenUsed / profile.aiTokenBudget) * 100))
    : 0;
  const enrolledCourses = profile
    ? courses.filter((course) => profile.enrolledCourseIds.includes(course.id))
    : [];

  function persistProfile(nextProfile: LearnerProfile) {
    setProfile(nextProfile);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextProfile));
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

  function updateDailyMinutes(minutes: number) {
    if (!profile) {
      return;
    }

    persistProfile({ ...profile, dailyMinutes: minutes });
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !profile) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      persistProfile({
        ...profile,
        avatarMode: "image",
        avatarUrl: String(reader.result)
      });
    });
    reader.readAsDataURL(file);
  }

  function generateGifAvatar() {
    if (!profile) {
      return;
    }

    persistProfile({
      ...profile,
      avatarMode: "gif",
      avatarUrl: undefined,
      gifPrompt
    });
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
    setJoinedGroupIds((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId]
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <section className="learning-os" aria-label="Dashboard học tập">
      <aside className="learning-rail" aria-label="Điều hướng học">
        <Link className="rail-logo" href="/" aria-label="LumaLang">
          <img alt="" src="/images/lumalang-logo.png" />
        </Link>
        <nav>
          {navItems.map((item) => (
            <button
              aria-current={activeView === item.id ? "page" : undefined}
              className={activeView === item.id ? "active" : undefined}
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <Link className="rail-link" href="/auth">
          Tài khoản
        </Link>
      </aside>

      <aside className="learning-sidebar-panel">
        <div className="window-controls" aria-hidden="true">
          <span className="control-red" />
          <span className="control-yellow" />
          <span className="control-green" />
        </div>
        <div className="sidebar-profile">
          <Avatar profile={profile} />
          <div>
            <strong>{profile.name}</strong>
            <span>{profile.email}</span>
          </div>
        </div>

        <div className="sidebar-block">
          <span className="sidebar-label">Khóa đang học</span>
          {enrolledCourses.length ? (
            enrolledCourses.map((course) => (
              <button
                className={selectedCourseId === course.id ? "sidebar-course active" : "sidebar-course"}
                key={course.id}
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setActiveView("courses");
                }}
                type="button"
              >
                <strong>{course.title}</strong>
                <span>{course.language} · {course.level}</span>
              </button>
            ))
          ) : (
            <p className="empty-note">Chưa ghi danh khóa nào.</p>
          )}
        </div>

        <div className="sidebar-block">
          <span className="sidebar-label">Lịch hôm nay</span>
          <div className="schedule-chip">
            <strong>{dailyTime}</strong>
            <span>{profile.dailyMinutes} phút · {goalLabels[profile.goal]}</span>
          </div>
          <div className="token-meter">
            <span>AI token</span>
            <strong>{profile.aiTokenUsed}/{profile.aiTokenBudget}</strong>
            <i><b style={{ width: `${tokenPercent}%` }} /></i>
          </div>
          <button className="sidebar-gif-card" onClick={() => setActiveView("profile")} type="button">
            <strong>GIF avatar</strong>
            <span>{profile.avatarMode === "gif" ? "Đã tạo từ prompt" : "Upload ảnh hoặc tạo bằng API"}</span>
          </button>
        </div>
      </aside>

      <main className="learning-content">
        <header className="workspace-header">
          <div>
            <span>User</span>
            <h1>{navItems.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className="workspace-actions">
            <button onClick={() => setActiveView("lesson")} type="button">Vào bài học</button>
            <button onClick={() => setActiveView("shadowing")} type="button">Shadowing</button>
          </div>
        </header>

        {activeView === "today" ? (
          <div className="learning-island-view">
            <section className="score-panel" aria-label="Điểm học tập hôm nay">
              <div className="breadcrumb-line">Khóa học / {selectedCourse?.title}</div>
              <h2>{selectedCourse?.title}</h2>
              <span className="impact-pill">Lv. 2 · {goalLabels[profile.goal]}</span>
              <div className="score-board">
                <div className="score-axis" aria-hidden="true">
                  {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((mark) => (
                    <span key={mark}>{mark}</span>
                  ))}
                </div>
                <div className="score-value">
                  <span>Study score</span>
                  <strong>{studyScore.toFixed(1)}</strong>
                  <small>{profile.level} · trung bình {completion}% hôm nay</small>
                  <i className="score-progress" aria-hidden="true">
                    <b style={{ width: `${completion}%` }} />
                  </i>
                </div>
              </div>
            </section>

            <section className="island-stage" aria-label="Cây tri thức 3D">
              <div className="island-caption">
                <span>Cây tri thức</span>
                <strong>{completedToday}/{todayTasks.length}</strong>
              </div>
              <KnowledgeTreeScene growth={Math.max(18, completion)} />
              <div className="island-progress-nodes" aria-hidden="true">
                <span className="done">Warm-up</span>
                <span className={completion >= 60 ? "done" : undefined}>Roleplay</span>
                <span className={completion >= 90 ? "done" : undefined}>Review</span>
              </div>
            </section>

            <aside className="activity-panel" aria-label="Hoạt động học">
              <div className="activity-group positive">
                <h3>Hoạt động tích cực</h3>
                <div className="activity-metrics">
                  <button onClick={() => setActiveView("lesson")} type="button">
                    <small>Hoàn thành</small>
                    <strong>{completion}%</strong>
                    <span>{completedToday}/{todayTasks.length} bài hôm nay</span>
                  </button>
                  <button onClick={() => setActiveView("shadowing")} type="button">
                    <small>Nhiệm vụ mới</small>
                    <strong>{todayTasks.length}</strong>
                    <span>nói, nghe, phản xạ</span>
                  </button>
                  <button onClick={() => setActiveView("schedule")} type="button">
                    <small>Streak học</small>
                    <strong>{learningStreak}</strong>
                    <span>ngày giữ nhịp</span>
                  </button>
                </div>
              </div>
            </aside>

            <section className="today-bottom-tabs">
              <button onClick={() => setActiveView("lesson")} type="button">Chỉ số bài học</button>
              <button onClick={() => setActiveView("practice")} type="button">Ngân hàng đề</button>
              <button onClick={() => setActiveView("group")} type="button">Nhóm học</button>
            </section>

            <section className="study-status-bar">
              <span>{completedToday}/{todayTasks.length} việc học đã hoàn thành.</span>
              <button onClick={() => setActiveView("lesson")} type="button">Tiếp tục học</button>
            </section>
          </div>
        ) : null}

        {activeView === "lesson" ? (
          <div className="workspace-grid">
            <section className="glass-panel app-card span-8">
              <div className="app-card-head">
                <div>
                  <span>Lesson runner</span>
                  <h2>Buổi học {profile.dailyMinutes} phút</h2>
                </div>
                <button onClick={() => todayTasks.forEach((task) => toggleTask(task.id))} type="button">Đánh dấu xong</button>
              </div>
              <div className="lesson-runner">
                {todayTasks.map((task, index) => (
                  <article className={profile.completedTaskIds.includes(task.id) ? "lesson-step done" : "lesson-step"} key={task.id}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{task.title}</strong>
                      <p>{task.detail}</p>
                    </div>
                    <button onClick={() => toggleTask(task.id)} type="button">
                      {profile.completedTaskIds.includes(task.id) ? "Xong" : "Hoàn thành"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <section className="glass-panel app-card span-4">
              <div className="app-card-head">
                <div>
                  <span>Path</span>
                  <h2>Lộ trình</h2>
                </div>
              </div>
              <ol className="compact-path">
                {learningPath.map((step) => (
                  <li key={step.id}>
                    <span>{step.minutes}p</span>
                    <strong>{step.title}</strong>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}

        {activeView === "courses" ? (
          <div className="workspace-grid">
            <section className="glass-panel app-card span-7">
              <div className="app-card-head">
                <div>
                  <span>Course catalog</span>
                  <h2>Khóa học</h2>
                </div>
              </div>
              <div className="course-management-list">
                {courses.map((course) => (
                  <article className={selectedCourseId === course.id ? "course-management-row active" : "course-management-row"} key={course.id}>
                    <button onClick={() => setSelectedCourseId(course.id)} type="button">
                      <strong>{course.title}</strong>
                      <span>{course.language} · {course.level} · {goalLabels[course.goal]}</span>
                    </button>
                    <button onClick={() => enrollCourse(course.id)} type="button">
                      {profile.enrolledCourseIds.includes(course.id) ? "Đang học" : "Ghi danh"}
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <section className="glass-panel app-card span-5">
              <div className="app-card-head">
                <div>
                  <span>Chi tiết khóa</span>
                  <h2>{selectedCourse?.title}</h2>
                </div>
              </div>
              <div className="course-detail-panel">
                <p>{selectedCourse?.objective}</p>
                <div>
                  <span>{selectedCourse?.lessons} bài</span>
                  <span>{selectedCourse?.minutesPerDay} phút/ngày</span>
                  <span>{selectedCourse?.students} học viên</span>
                </div>
                <strong>AI policy</strong>
                <p>{selectedCourse?.aiPolicy}</p>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "practice" ? (
          <section className="glass-panel app-card">
            <div className="app-card-head">
              <div>
                <span>Question bank</span>
                <h2>Đề luyện theo mục tiêu</h2>
              </div>
            </div>
            <div className="question-workbench">
              {practiceTest.map((question) => (
                <article key={question.id}>
                  <span>{question.skill} · {question.level}</span>
                  <strong>{question.prompt}</strong>
                  <textarea
                    onChange={(event) => setAnswerDrafts({ ...answerDrafts, [question.id]: event.target.value })}
                    placeholder="Nhập câu trả lời của bạn"
                    value={answerDrafts[question.id] ?? ""}
                  />
                  <div>
                    <button
                      onClick={() => setRevealedAnswers({ ...revealedAnswers, [question.id]: !revealedAnswers[question.id] })}
                      type="button"
                    >
                      {revealedAnswers[question.id] ? "Ẩn đáp án" : "Xem đáp án"}
                    </button>
                    <button onClick={() => toggleTask(todayTasks[0]?.id ?? "")} type="button">Lưu tiến độ</button>
                  </div>
                  {revealedAnswers[question.id] ? (
                    <p><strong>Đáp án:</strong> {question.answer}<br />{question.explanation}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeView === "shadowing" ? (
          <div className="workspace-grid">
            <section className="glass-panel app-card span-5">
              <div className="app-card-head">
                <div>
                  <span>Kho phim shadowing</span>
                  <h2>Clip luyện nói</h2>
                </div>
              </div>
              <div className="clip-list">
                {shadowingClips.map((clip) => (
                  <button
                    className={selectedClipId === clip.id ? "clip-row active" : "clip-row"}
                    key={clip.id}
                    onClick={() => setSelectedClipId(clip.id)}
                    type="button"
                  >
                    <strong>{clip.title}</strong>
                    <span>{clip.language} · {clip.level} · {clip.context}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="glass-panel app-card span-7">
              <div className="app-card-head">
                <div>
                  <span>Shadowing player</span>
                  <h2>{selectedClip.title}</h2>
                </div>
              </div>
              <div className="shadowing-player">
                <div className="video-placeholder">
                  <button onClick={() => speak(selectedClip.transcript[0])} type="button">Nghe câu 1</button>
                </div>
                {selectedClip.transcript.map((line, index) => (
                  <div className="transcript-row" key={line}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{line}</p>
                    <button onClick={() => speak(line)} type="button">Nghe</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "schedule" ? (
          <section className="glass-panel app-card">
            <div className="app-card-head">
              <div>
                <span>Lịch học</span>
                <h2>Cấu hình thời gian học</h2>
              </div>
            </div>
            <div className="settings-grid">
              <label>
                Giờ học mặc định
                <input onChange={(event) => setDailyTime(event.target.value)} type="time" value={dailyTime} />
              </label>
              <label>
                Phút/ngày
                <select onChange={(event) => updateDailyMinutes(Number(event.target.value))} value={profile.dailyMinutes}>
                  <option value={5}>5 phút</option>
                  <option value={10}>10 phút</option>
                  <option value={15}>15 phút</option>
                  <option value={25}>25 phút</option>
                </select>
              </label>
              <label>
                Mục tiêu
                <select onChange={(event) => persistProfile({ ...profile, goal: event.target.value as LearnerProfile["goal"] })} value={profile.goal}>
                  {Object.entries(goalLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        ) : null}

        {activeView === "group" ? (
          <section className="glass-panel app-card">
            <div className="app-card-head">
              <div>
                <span>Học nhóm</span>
                <h2>Kết nối bạn học</h2>
              </div>
            </div>
            <div className="group-list">
              {studyGroups.map((group) => (
                <article key={group.id}>
                  <div>
                    <strong>{group.title}</strong>
                    <span>{group.language} · {group.level} · {group.schedule}</span>
                  </div>
                  <span>{group.members} người</span>
                  <button onClick={() => toggleGroup(group.id)} type="button">
                    {joinedGroupIds.includes(group.id) ? "Đã tham gia" : "Tham gia"}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeView === "profile" ? (
          <section className="glass-panel app-card">
            <div className="app-card-head">
              <div>
                <span>Hồ sơ học tập</span>
                <h2>Tài khoản & avatar</h2>
              </div>
            </div>
            <div className="profile-workbench">
              <Avatar profile={profile} />
              <div className="settings-grid">
                <label>
                  Tên hiển thị
                  <input onChange={(event) => persistProfile({ ...profile, name: event.target.value })} value={profile.name} />
                </label>
                <label>
                  Email
                  <input onChange={(event) => persistProfile({ ...profile, email: event.target.value })} value={profile.email} />
                </label>
                <label>
                  Provider
                  <input readOnly value={providerLabels[profile.provider]} />
                </label>
                <label>
                  Upload avatar
                  <input accept="image/*" onChange={handleAvatarUpload} type="file" />
                </label>
                <label className="wide-setting">
                  Prompt GIF avatar
                  <input onChange={(event) => setGifPrompt(event.target.value)} value={gifPrompt} />
                </label>
              </div>
              <button onClick={generateGifAvatar} type="button">Tạo GIF avatar (API adapter demo)</button>
            </div>
          </section>
        ) : null}
      </main>
    </section>
  );
}
