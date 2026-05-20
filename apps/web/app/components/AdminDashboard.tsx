"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Goal } from "../lib/learning-core";
import {
  COURSE_STORAGE_KEY,
  Course,
  CourseStatus,
  LearnerProfile,
  SESSION_STORAGE_KEY,
  defaultAdminLearners,
  defaultCourses,
  goalLabels
} from "../lib/product-data";

type AdminView = "courses" | "users" | "content" | "tokens" | "settings";
type AdminIconName = AdminView | "learn";

type ContentStatus = "Draft" | "Review" | "Ready";

type ContentItem = {
  id: string;
  title: string;
  type: "Lesson" | "Question bank" | "Shadowing";
  language: string;
  owner: string;
  status: ContentStatus;
};

type TokenEvent = {
  id: string;
  user: string;
  feature: string;
  tokens: number;
  status: "ok" | "limited" | "review";
};

const adminNav: Array<{ id: AdminView; icon: AdminIconName; label: string }> = [
  { id: "courses", icon: "courses", label: "Khóa học" },
  { id: "users", icon: "users", label: "Người dùng" },
  { id: "content", icon: "content", label: "Nội dung" },
  { id: "tokens", icon: "tokens", label: "AI token" },
  { id: "settings", icon: "settings", label: "Cấu hình" }
];

const initialContentQueue: ContentItem[] = [
  {
    id: "content-1",
    title: "Meeting update A2",
    type: "Shadowing",
    language: "Tiếng Anh",
    owner: "Content team",
    status: "Ready"
  },
  {
    id: "content-2",
    title: "IELTS reading signs B1",
    type: "Question bank",
    language: "Tiếng Anh",
    owner: "Exam team",
    status: "Review"
  },
  {
    id: "content-3",
    title: "N5 greeting script",
    type: "Lesson",
    language: "Tiếng Nhật",
    owner: "JP team",
    status: "Draft"
  }
];

const tokenEvents: TokenEvent[] = [
  { id: "t1", user: "Minh Anh", feature: "AI roleplay", tokens: 220, status: "ok" },
  { id: "t2", user: "Khoa", feature: "Giải thích đáp án", tokens: 90, status: "ok" },
  { id: "t3", user: "Linh", feature: "GIF avatar", tokens: 160, status: "limited" },
  { id: "t4", user: "Luma Learner", feature: "Shadowing feedback", tokens: 180, status: "review" }
];

function AdminIcon({ name }: { name: AdminIconName }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      {name === "courses" ? (
        <>
          <path d="M5 5.8A2.8 2.8 0 0 1 7.8 3H19v15.5H7.8A2.8 2.8 0 0 0 5 21.3V5.8Z" />
          <path d="M8.5 7h7.8M8.5 10.2h6.2M5 17.8A2.8 2.8 0 0 1 7.8 15H19" />
        </>
      ) : null}
      {name === "users" ? (
        <>
          <path d="M16.5 19.5v-1.2c0-1.7-1.8-3.1-4-3.1h-1c-2.2 0-4 1.4-4 3.1v1.2" />
          <path d="M12 12a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" />
          <path d="M18 13.7c1.5.5 2.5 1.5 2.5 2.8v1M16.6 4.9a2.7 2.7 0 0 1 0 5.2" />
        </>
      ) : null}
      {name === "content" ? (
        <>
          <path d="M7 4h7.4L18 7.6V20H7V4Z" />
          <path d="M14 4v4h4M9.5 11h5M9.5 14h5M9.5 17h3.2" />
        </>
      ) : null}
      {name === "tokens" ? (
        <>
          <path d="M12 3.8 13.9 9l5.3 1.9-5.3 1.9L12 18l-1.9-5.2-5.3-1.9L10.1 9 12 3.8Z" />
          <path d="M18.5 16.2 19.3 18l1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.8Z" />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <path d="M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" />
          <path d="M18.3 13.4c.1-.5.1-.9.1-1.4s0-.9-.1-1.4l2-1.5-1.9-3.2-2.4 1a8 8 0 0 0-2.4-1.4L13.3 3h-3.7l-.4 2.5A8 8 0 0 0 6.8 7L4.4 6 2.6 9.2l2 1.5c-.1.5-.1.9-.1 1.4s0 .9.1 1.4l-2 1.5 1.9 3.2 2.4-1a8 8 0 0 0 2.4 1.4l.4 2.5h3.7l.4-2.5a8 8 0 0 0 2.4-1.4l2.4 1 1.9-3.2-2.2-1.6Z" />
        </>
      ) : null}
      {name === "learn" ? (
        <>
          <path d="M5 19V6.5A2.5 2.5 0 0 1 7.5 4H19v12H7.5A2.5 2.5 0 0 0 5 18.5Z" />
          <path d="M8.5 7.8H16M8.5 10.8h5.2" />
        </>
      ) : null}
    </svg>
  );
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

function emptyCourseForm() {
  return {
    title: "Shadowing Meeting Sprint",
    language: "Tiếng Anh",
    level: "A2",
    goal: "work" as Goal,
    minutesPerDay: 10,
    lessons: 12,
    status: "draft" as CourseStatus,
    objective: "Kho shadowing câu ngắn cho meeting, phỏng vấn và cập nhật công việc.",
    aiPolicy: "Dùng question bank trước, AI chỉ đóng vai giải thích và roleplay có quota."
  };
}

const statusFlow: Record<CourseStatus, CourseStatus> = {
  draft: "review",
  review: "published",
  published: "draft"
};

const contentStatusFlow: Record<ContentStatus, ContentStatus> = {
  Draft: "Review",
  Review: "Ready",
  Ready: "Draft"
};

export function AdminDashboard() {
  const [activeView, setActiveView] = useState<AdminView>("courses");
  const [courses, setCourses] = useState<Course[]>(defaultCourses);
  const [contentQueue, setContentQueue] = useState<ContentItem[]>(initialContentQueue);
  const [sessionUser, setSessionUser] = useState<LearnerProfile | null>(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [selectedLearnerId, setSelectedLearnerId] = useState<string | null>(null);
  const [limitedLearnerIds, setLimitedLearnerIds] = useState<string[]>([]);
  const [limitedTokenEventIds, setLimitedTokenEventIds] = useState<string[]>([]);
  const [auditedTokenEventIds, setAuditedTokenEventIds] = useState<string[]>([]);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [freeTokenCap, setFreeTokenCap] = useState(1200);
  const [plusTokenCap, setPlusTokenCap] = useState(12000);

  useEffect(() => {
    const loadedCourses = readJson<Course[]>(COURSE_STORAGE_KEY, defaultCourses);
    setCourses(loadedCourses.length ? loadedCourses : defaultCourses);
    setSessionUser(readJson<LearnerProfile | null>(SESSION_STORAGE_KEY, null));
  }, []);

  const learners = useMemo(() => {
    if (!sessionUser) {
      return defaultAdminLearners;
    }

    return [
      {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        goal: sessionUser.goal,
        language: sessionUser.language,
        progress: 36,
        tokenUsed: sessionUser.aiTokenUsed,
        plan: "Free" as const
      },
      ...defaultAdminLearners
    ];
  }, [sessionUser]);

  const filteredCourses = courses.filter((course) =>
    `${course.title} ${course.language} ${course.level} ${goalLabels[course.goal]} ${course.status}`
      .toLowerCase()
      .includes(courseSearch.toLowerCase())
  );
  const filteredLearners = learners.filter((learner) =>
    `${learner.name} ${learner.email} ${learner.language} ${goalLabels[learner.goal]} ${learner.plan}`
      .toLowerCase()
      .includes(userSearch.toLowerCase())
  );
  const publishedCount = courses.filter((course) => course.status === "published").length;
  const reviewCount = courses.filter((course) => course.status === "review").length;
  const draftCount = courses.filter((course) => course.status === "draft").length;
  const totalTokenUsed = learners.reduce((sum, learner) => sum + learner.tokenUsed, 0);
  const selectedLearner = learners.find((learner) => learner.id === selectedLearnerId) ?? learners[0];
  const activeLabel = adminNav.find((item) => item.id === activeView)?.label ?? "Khóa học";

  function persistCourses(nextCourses: Course[]) {
    setCourses(nextCourses);
    localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(nextCourses));
  }

  function resetForm() {
    setEditingCourseId(null);
    setCourseForm(emptyCourseForm());
  }

  function editCourse(course: Course) {
    setEditingCourseId(course.id);
    setCourseForm({
      title: course.title,
      language: course.language,
      level: course.level,
      goal: course.goal,
      minutesPerDay: course.minutesPerDay,
      lessons: course.lessons,
      status: course.status,
      objective: course.objective,
      aiPolicy: course.aiPolicy
    });
  }

  function saveCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingCourseId) {
      persistCourses(
        courses.map((course) =>
          course.id === editingCourseId
            ? {
                ...course,
                ...courseForm
              }
            : course
        )
      );
      resetForm();
      return;
    }

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      ...courseForm,
      students: 0
    };

    persistCourses([newCourse, ...courses]);
    resetForm();
  }

  function cycleStatus(courseId: string) {
    persistCourses(
      courses.map((course) =>
        course.id === courseId ? { ...course, status: statusFlow[course.status] } : course
      )
    );
  }

  function duplicateCourse(course: Course) {
    persistCourses([
      {
        ...course,
        id: `course-${Date.now()}`,
        title: `${course.title} Copy`,
        status: "draft",
        students: 0
      },
      ...courses
    ]);
  }

  function deleteCourse(courseId: string) {
    persistCourses(courses.filter((course) => course.id !== courseId));
    if (editingCourseId === courseId) {
      resetForm();
    }
  }

  function cycleContentStatus(contentId: string) {
    setContentQueue((items) =>
      items.map((item) =>
        item.id === contentId ? { ...item, status: contentStatusFlow[item.status] } : item
      )
    );
  }

  function toggleLearnerLimit(learnerId: string) {
    setLimitedLearnerIds((current) =>
      current.includes(learnerId)
        ? current.filter((id) => id !== learnerId)
        : [...current, learnerId]
    );
  }

  function toggleTokenLimit(eventId: string) {
    setLimitedTokenEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId]
    );
  }

  function toggleTokenAudit(eventId: string) {
    setAuditedTokenEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId]
    );
  }

  return (
    <section className="admin-os dense-admin" aria-label="Dashboard admin">
      <aside className="admin-rail" aria-label="Điều hướng admin">
        <Link className="rail-logo" href="/" aria-label="LumaLang">
          <img alt="" src="/images/lumalang-logo.png" />
        </Link>
        <nav>
          {adminNav.map((item) => (
            <button
              aria-current={activeView === item.id ? "page" : undefined}
              className={activeView === item.id ? "active" : undefined}
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <AdminIcon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <Link className="rail-link" href="/placement"><AdminIcon name="learn" />Placement</Link>
      </aside>

      <aside className="admin-sidebar-panel">
        <div className="window-controls" aria-hidden="true">
          <span className="control-red" />
          <span className="control-yellow" />
          <span className="control-green" />
        </div>
        <div className="admin-account">
          <div className="admin-profile-avatar">A</div>
          <div>
            <strong>LumaLang Admin</strong>
            <span>{courses.length} khóa · {learners.length} user</span>
          </div>
        </div>

        <div className="admin-mini-stats">
          <div><span>Courses</span><strong>{courses.length}</strong></div>
          <div><span>Users</span><strong>{learners.length}</strong></div>
          <div><span>Tokens</span><strong>{totalTokenUsed}</strong></div>
        </div>

        <div className="sidebar-block">
          <span className="sidebar-label">Trạng thái khóa</span>
          <div className="admin-status-line"><span>Published</span><strong>{publishedCount}</strong></div>
          <div className="admin-status-line"><span>Review</span><strong>{reviewCount}</strong></div>
          <div className="admin-status-line"><span>Draft</span><strong>{draftCount}</strong></div>
        </div>

        <div className="sidebar-block">
          <span className="sidebar-label">Tác vụ</span>
          <button className="sidebar-action" onClick={() => setActiveView("courses")} type="button">Quản lý khóa</button>
          <button className="sidebar-action" onClick={() => setActiveView("content")} type="button">Duyệt nội dung</button>
          <button className="sidebar-action" onClick={() => setActiveView("tokens")} type="button">Kiểm token</button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-toolbar">
          <div>
            <span>Admin · Content studio</span>
            <h1>{activeLabel}</h1>
          </div>
          <div className="admin-toolbar-actions">
            <button onClick={() => setActiveView("courses")} type="button"><AdminIcon name="courses" />Course</button>
            <button onClick={() => setActiveView("users")} type="button"><AdminIcon name="users" />User</button>
            <button onClick={() => setActiveView("tokens")} type="button"><AdminIcon name="tokens" />Quota</button>
          </div>
        </header>

        {activeView === "courses" ? (
          <div className="admin-workbench">
            <form className="glass-panel admin-editor" onSubmit={saveCourse}>
              <div className="admin-panel-head">
                <span>{editingCourseId ? "Edit course" : "New course"}</span>
                <button onClick={resetForm} type="button">Reset</button>
              </div>
              <div className="settings-grid dense-form">
                <label>
                  Tên khóa
                  <input
                    onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })}
                    value={courseForm.title}
                  />
                </label>
                <label>
                  Ngôn ngữ
                  <select
                    onChange={(event) => setCourseForm({ ...courseForm, language: event.target.value })}
                    value={courseForm.language}
                  >
                    <option>Tiếng Anh</option>
                    <option>Tiếng Nhật</option>
                    <option>Tiếng Hàn</option>
                  </select>
                </label>
                <label>
                  Level
                  <input
                    onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}
                    value={courseForm.level}
                  />
                </label>
                <label>
                  Mục tiêu
                  <select
                    onChange={(event) => setCourseForm({ ...courseForm, goal: event.target.value as Goal })}
                    value={courseForm.goal}
                  >
                    {Object.entries(goalLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Bài học
                  <input
                    min={1}
                    onChange={(event) => setCourseForm({ ...courseForm, lessons: Number(event.target.value) })}
                    type="number"
                    value={courseForm.lessons}
                  />
                </label>
                <label>
                  Phút/ngày
                  <input
                    min={5}
                    onChange={(event) => setCourseForm({ ...courseForm, minutesPerDay: Number(event.target.value) })}
                    type="number"
                    value={courseForm.minutesPerDay}
                  />
                </label>
                <label>
                  Trạng thái
                  <select
                    onChange={(event) => setCourseForm({ ...courseForm, status: event.target.value as CourseStatus })}
                    value={courseForm.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <label className="wide-setting">
                  Mục tiêu khóa
                  <textarea
                    onChange={(event) => setCourseForm({ ...courseForm, objective: event.target.value })}
                    value={courseForm.objective}
                  />
                </label>
                <label className="wide-setting">
                  AI policy
                  <textarea
                    onChange={(event) => setCourseForm({ ...courseForm, aiPolicy: event.target.value })}
                    value={courseForm.aiPolicy}
                  />
                </label>
              </div>
              <button className="primary-action" type="submit">{editingCourseId ? "Cập nhật khóa" : "Tạo khóa"}</button>
            </form>

            <section className="glass-panel admin-table-panel">
              <div className="admin-panel-head">
                <span>Course table</span>
                <input
                  className="table-search"
                  onChange={(event) => setCourseSearch(event.target.value)}
                  placeholder="Tìm theo tên, level, trạng thái"
                  value={courseSearch}
                />
              </div>
              <div className="admin-dense-table course-table">
                <div className="table-head">
                  <span>Khóa</span>
                  <span>Level</span>
                  <span>Mục tiêu</span>
                  <span>Trạng thái</span>
                  <span>Hành động</span>
                </div>
                {filteredCourses.map((course) => (
                  <article key={course.id}>
                    <div>
                      <strong>{course.title}</strong>
                      <span>{course.language} · {course.lessons} bài · {course.students} học viên</span>
                    </div>
                    <span>{course.level}</span>
                    <span>{goalLabels[course.goal]}</span>
                    <span className={`status-pill ${course.status}`}>{course.status}</span>
                    <div className="row-actions">
                      <button onClick={() => editCourse(course)} type="button">Sửa</button>
                      <button onClick={() => cycleStatus(course.id)} type="button">Status</button>
                      <button onClick={() => duplicateCourse(course)} type="button">Nhân bản</button>
                      <button onClick={() => deleteCourse(course.id)} type="button">Xóa</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        {activeView === "users" ? (
          <section className="glass-panel admin-table-panel full-panel">
            <div className="admin-panel-head">
              <span>User table</span>
              <input
                className="table-search"
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Tìm user"
                value={userSearch}
              />
            </div>
            <div className="admin-dense-table user-table">
              <div className="table-head">
                <span>User</span>
                <span>Plan</span>
                <span>Ngôn ngữ</span>
                <span>Mục tiêu</span>
                <span>Tiến độ</span>
                <span>Token</span>
                <span>Trạng thái</span>
                <span>Hành động</span>
              </div>
              {filteredLearners.map((learner) => (
                <article key={learner.id}>
                  <div>
                    <strong>{learner.name}</strong>
                    <span>{learner.email}</span>
                  </div>
                  <span>{learner.plan}</span>
                  <span>{learner.language}</span>
                  <span>{goalLabels[learner.goal]}</span>
                  <span>{learner.progress}%</span>
                  <span>{learner.tokenUsed}</span>
                  <span className={`status-pill ${limitedLearnerIds.includes(learner.id) ? "review" : "published"}`}>
                    {limitedLearnerIds.includes(learner.id) ? "Limited" : "Active"}
                  </span>
                  <div className="row-actions">
                    <button onClick={() => setSelectedLearnerId(learner.id)} type="button">Chi tiết</button>
                    <button onClick={() => toggleLearnerLimit(learner.id)} type="button">
                      {limitedLearnerIds.includes(learner.id) ? "Mở" : "Giới hạn"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {selectedLearner ? (
              <div className="user-inspector">
                <div>
                  <span>User</span>
                  <strong>{selectedLearner.name}</strong>
                  <p>{selectedLearner.email}</p>
                </div>
                <div>
                  <span>Course target</span>
                  <strong>{selectedLearner.language}</strong>
                  <p>{goalLabels[selectedLearner.goal]}</p>
                </div>
                <div>
                  <span>Progress</span>
                  <strong>{selectedLearner.progress}%</strong>
                  <p>{selectedLearner.tokenUsed} token</p>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeView === "content" ? (
          <section className="glass-panel admin-table-panel full-panel">
            <div className="admin-panel-head">
              <span>Content queue</span>
              <button type="button">Import CSV</button>
            </div>
            <div className="admin-dense-table content-table">
              <div className="table-head">
                <span>Nội dung</span>
                <span>Loại</span>
                <span>Ngôn ngữ</span>
                <span>Owner</span>
                <span>Trạng thái</span>
                <span>Hành động</span>
              </div>
              {contentQueue.map((item) => (
                <article key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.type}</span>
                  <span>{item.language}</span>
                  <span>{item.owner}</span>
                  <span>{item.status}</span>
                  <div className="row-actions">
                    <button onClick={() => cycleContentStatus(item.id)} type="button">Chuyển trạng thái</button>
                    <button type="button">Mở</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeView === "tokens" ? (
          <section className="glass-panel admin-table-panel full-panel">
            <div className="admin-panel-head">
              <span>Token ledger</span>
              <div className="quota-inline">
                <label>Free<input onChange={(event) => setFreeTokenCap(Number(event.target.value))} type="number" value={freeTokenCap} /></label>
                <label>Plus<input onChange={(event) => setPlusTokenCap(Number(event.target.value))} type="number" value={plusTokenCap} /></label>
              </div>
            </div>
            <div className="admin-dense-table token-table">
              <div className="table-head">
                <span>User</span>
                <span>Tính năng</span>
                <span>Token</span>
                <span>Status</span>
                <span>Hành động</span>
              </div>
              {tokenEvents.map((event) => (
                <article key={event.id}>
                  <strong>{event.user}</strong>
                  <span>{event.feature}</span>
                  <span>{event.tokens}</span>
                  <span className={`status-pill ${
                    auditedTokenEventIds.includes(event.id)
                      ? "published"
                      : limitedTokenEventIds.includes(event.id) || event.status === "limited"
                        ? "review"
                        : event.status === "review"
                          ? "draft"
                          : "published"
                  }`}>
                    {auditedTokenEventIds.includes(event.id)
                      ? "audited"
                      : limitedTokenEventIds.includes(event.id)
                        ? "limited"
                        : event.status}
                  </span>
                  <div className="row-actions">
                    <button onClick={() => toggleTokenLimit(event.id)} type="button">
                      {limitedTokenEventIds.includes(event.id) ? "Unlimit" : "Limit"}
                    </button>
                    <button onClick={() => toggleTokenAudit(event.id)} type="button">
                      {auditedTokenEventIds.includes(event.id) ? "Undo" : "Audit"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeView === "settings" ? (
          <section className="glass-panel admin-table-panel full-panel">
            <div className="admin-panel-head">
              <span>System adapters</span>
              <button type="button">Lưu cấu hình</button>
            </div>
            <div className="settings-grid">
              <label>Google OAuth Client ID<input placeholder="google-client-id" /></label>
              <label>Facebook App ID<input placeholder="facebook-app-id" /></label>
              <label>JWT secret<input placeholder="server-only-secret" /></label>
              <label>GIF API endpoint<input placeholder="https://api.example.com/gif" /></label>
              <label>PostgreSQL URL<input placeholder="postgres://..." /></label>
              <label>Redis URL<input placeholder="redis://..." /></label>
            </div>
          </section>
        ) : null}
      </main>
    </section>
  );
}
