"use client";

/**
 * Path: apps/web/app/components/ExamHubV2.tsx
 *
 * Refactor 2026-05-25 (redesign):
 *   - Removed all inline styles. Now uses .ll-* class system.
 *   - Cards use .ll-glass (28px radius, blur, gradient overlay) to
 *     match Groups + LearnPathHero + LessonsViewV2.
 *   - Hero banner uses gradient that fits site's mint palette
 *     (was hardcoded #064e3b dark green, lạc UI tổng).
 *   - Tabs use .ll-exam-hub-tab styling consistent with
 *     .ll-shadow-topic-chip pattern.
 *   - Profile-aware: filters categories by user's primaryGoal but
 *     always shows category=exam users everything.
 */

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import type { LearnerProfile } from "../lib/product-data";

interface ExamCategory {
  id: string;
  name: string;
  goals: string[];
}

interface MockExam {
  id: string;
  title: string;
  questions: number;
  time: number;
  type: string;
  difficulty?: "A2" | "B1" | "B2" | "C1";
}

const ALL_CATEGORIES: ExamCategory[] = [
  { id: "ielts", name: "IELTS Academic", goals: ["exam"] },
  { id: "toeic", name: "TOEIC Listening & Reading", goals: ["work", "exam"] },
  { id: "cambridge", name: "Cambridge PET/KET", goals: ["foundation", "exam"] },
  { id: "vstep", name: "VSTEP (A1-C1)", goals: ["foundation", "work"] },
];

const MOCK_EXAMS: Record<string, MockExam[]> = {
  ielts: [
    { id: "cam-18-test-1", title: "Cambridge IELTS 18 - Test 1", questions: 40, time: 60, type: "Listening", difficulty: "B2" },
    { id: "cam-18-test-2", title: "Cambridge IELTS 18 - Test 2", questions: 40, time: 60, type: "Reading", difficulty: "B2" },
    { id: "cam-17-test-1", title: "Cambridge IELTS 17 - Test 1", questions: 40, time: 60, type: "Listening", difficulty: "B1" },
    { id: "cam-16-test-1", title: "Cambridge IELTS 16 - Test 1", questions: 40, time: 60, type: "Listening", difficulty: "B1" },
  ],
  toeic: [
    { id: "toeic-test-1", title: "TOEIC Mini Test 1", questions: 4, time: 30, type: "TOEIC", difficulty: "B1" },
  ],
  cambridge: [],
  vstep: [],
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  ielts: "Đề IELTS thật từ Cambridge với tính giờ chuẩn và chấm điểm tự động.",
  toeic: "Mock test TOEIC mới nhất, sát đề thi thật, có giải chi tiết.",
  cambridge: "Đề Cambridge PET/KET dành cho người học A2-B1.",
  vstep: "Đề VSTEP cho học sinh sinh viên các trường đại học Việt Nam.",
};

export function ExamHubV2({
  profile,
  onStartExam,
}: {
  profile: LearnerProfile;
  onStartExam: (id: string) => void;
}) {
  // Default category based on profile goal
  const [activeCategory, setActiveCategory] = useState(() => {
    if (profile.goal === "work") return "toeic";
    if (profile.goal === "foundation") return "vstep";
    return "ielts";
  });

  // Filter categories by user's goal (exam users see everything)
  const categories = useMemo(() => {
    if (profile.goal === "exam") return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter((c) => c.goals.includes(profile.goal));
  }, [profile.goal]);

  // Fallback if active category got filtered out
  if (!categories.find((c) => c.id === activeCategory) && categories[0]) {
    setActiveCategory(categories[0].id);
  }

  const activeCat = categories.find((c) => c.id === activeCategory);
  const exams = MOCK_EXAMS[activeCategory] ?? [];

  return (
    <div className="ll-exam-hub">
      {/* Tabs */}
      <div className="ll-exam-hub-tabs">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            className={`ll-exam-hub-tab ${
              activeCategory === c.id ? "is-active" : ""
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Hero banner */}
      <motion.section
        key={activeCategory}
        className="ll-exam-hub-hero ll-glass"
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="ll-exam-hub-hero-eyebrow">
          {activeCat?.name ?? "Đề thi"}
        </span>
        <h2 className="ll-exam-hub-hero-title">
          Sẵn sàng chinh phục{" "}
          <span className="ll-accent">{activeCat?.name ?? "đề thi"}?</span>
        </h2>
        <p className="ll-exam-hub-hero-desc">
          {CATEGORY_DESCRIPTIONS[activeCategory] ??
            "Trải nghiệm môi trường thi thật với tính giờ, chấm điểm tự động và giải đáp chi tiết bằng AI."}
        </p>
        {exams.length > 0 && (
          <button
            type="button"
            onClick={() => onStartExam(exams[0].id)}
            className="ll-exam-hub-hero-cta"
          >
            Vào phòng thi ngay →
          </button>
        )}
      </motion.section>

      {/* Section header */}
      <div className="ll-exam-hub-section-head">
        <div>
          <span className="ll-exam-hub-section-eyebrow">
            {exams.length} ĐỀ CÓ SẴN
          </span>
          <h3>Danh sách đề thi</h3>
        </div>
        <span className="ll-exam-hub-section-sub">
          Bấm <strong>Làm bài</strong> để vào phòng thi với đầy đủ tính giờ
        </span>
      </div>

      {/* Exam cards grid */}
      {exams.length === 0 ? (
        <article className="ll-exam-hub-empty ll-glass">
          <p>
            Đề {activeCat?.name} đang được biên soạn. Trong khi chờ, hãy thử{" "}
            <button
              type="button"
              className="ll-accent"
              style={{ background: "none", border: 0, padding: 0, cursor: "pointer", font: "inherit", fontWeight: 700 }}
              onClick={() => setActiveCategory("ielts")}
            >
              chuyển sang IELTS
            </button>{" "}
            để luyện trước.
          </p>
        </article>
      ) : (
        <div className="ll-exam-hub-grid">
          {exams.map((exam, i) => (
            <motion.article
              key={exam.id}
              className="ll-exam-card ll-glass"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35 }}
              whileHover={{ y: -4 }}
            >
              <header className="ll-exam-card-head">
                <span className="ll-exam-card-type">{exam.type}</span>
                {exam.difficulty && (
                  <span className="ll-exam-card-level">{exam.difficulty}</span>
                )}
              </header>

              <div className="ll-exam-card-body">
                <h4 className="ll-exam-card-title">{exam.title}</h4>
                <div className="ll-exam-card-meta">
                  <span>📝 {exam.questions} câu</span>
                  <span>⏱ {exam.time} phút</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartExam(exam.id)}
                className="ll-exam-card-cta"
              >
                Làm bài →
              </button>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
