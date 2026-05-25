"use client";

/**
 * Path: apps/web/app/components/LearningPathsView.tsx
 *
 * "Hành trình của bạn" — path-style view for the Khóa học tab.
 *
 * Renders 3 paths (mạch) as horizontal rows; each row is a series of
 * course cards connected by a progress line. Each card shows:
 *   - CEFR badge
 *   - status pill (Đang học / Hoàn thành / Khóa)
 *   - course name + ASU count (computed from FOUNDATION_SEED)
 *   - bottom progress bar
 *
 * Click logic:
 *   - active/in-progress/done card → launches SessionPlayer with
 *     filtered ASU queue for that course
 *   - locked card → shows a small unlock toast (we don't render a
 *     blocking modal; gentler UX)
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { SessionPlayer } from "./SessionPlayer";
import { FOUNDATION_SEED } from "../lib/skill-seed-foundation";
import { LEARNING_PATHS, orderedPathsFor, type LearningPath, type PathCourse } from "../lib/learning-paths";
import {
  loadProfileFromStorage,
  recommendDaily,
  type RecommenderProfile,
} from "../lib/recommend-engine";
import {
  loadAllSkillStates,
  decayedStrength,
  type SkillState,
} from "../lib/user-skill-state";
import type { SkillUnit } from "../lib/skill-units";

type CourseStatus = "locked" | "active" | "in-progress" | "done";

interface CourseStats {
  total: number;
  done: number;
  inProgress: number;
  pct: number;
}

export function LearningPathsView() {
  const [profile, setProfile] = useState<RecommenderProfile | null>(null);
  const [states, setStates] = useState<Record<string, SkillState>>({});
  const [activeQueue, setActiveQueue] = useState<{
    queue: SkillUnit[];
    courseName: string;
  } | null>(null);
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(loadProfileFromStorage());
    setStates(loadAllSkillStates());
  }, []);

  const refreshStates = () => setStates(loadAllSkillStates());

  // Auto-clear locked toast after 2.5s
  useEffect(() => {
    if (!lockedToast) return;
    const t = setTimeout(() => setLockedToast(null), 2500);
    return () => clearTimeout(t);
  }, [lockedToast]);

  /** All ASUs in a course = those whose tags include every requiredTag */
  const asusFor = (course: PathCourse): SkillUnit[] =>
    FOUNDATION_SEED.filter((s) =>
      course.requiredTags.every((rt) =>
        (s.tags as readonly string[]).includes(rt as any),
      ),
    );

  const statsFor = (course: PathCourse, nowISO: string): CourseStats => {
    const asus = asusFor(course);
    let done = 0;
    let inProgress = 0;
    for (const a of asus) {
      const s = states[a.id];
      if (!s) continue;
      const d = decayedStrength(s, nowISO);
      if (d >= 0.7) done++;
      else if (d > 0.05) inProgress++;
    }
    const total = asus.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, inProgress, pct };
  };

  /**
   * Course status by gating rules:
   *   - First course in path → active by default
   *   - Otherwise → unlocked when previous course's done count >= 60%
   *     of total (lenient: user doesn't need 100% perfection to move on)
   *   - in-progress / done overrides active
   */
  const statusFor = (
    course: PathCourse,
    courseIdx: number,
    path: LearningPath,
    nowISO: string,
  ): CourseStatus => {
    const myStats = statsFor(course, nowISO);
    if (myStats.total > 0 && myStats.done === myStats.total) return "done";
    if (myStats.inProgress > 0 || myStats.done > 0) return "in-progress";
    if (courseIdx === 0) return "active";

    // Look at previous course
    const prev = path.courses[courseIdx - 1];
    const prevStats = statsFor(prev, nowISO);
    if (prevStats.total === 0) return "active"; // no content yet — let user try
    const prevPct = prevStats.done / prevStats.total;
    return prevPct >= 0.6 ? "active" : "locked";
  };

  /* ── Click handler — launches SessionPlayer for this course ─── */
  const startCourse = (course: PathCourse) => {
    if (!profile) return;
    const pool = asusFor(course);
    if (pool.length === 0) {
      // Track exists but no ASUs seeded yet
      setLockedToast(
        `${course.name} đang được biên soạn nội dung. Sắp ra mắt!`,
      );
      return;
    }
    const queue = recommendDaily(pool, profile, {
      n: Math.min(8, pool.length),
    });
    if (queue.length === 0) return;
    setActiveQueue({ queue, courseName: course.name });
  };

  const handleLockedClick = (course: PathCourse, path: LearningPath) => {
    const idx = path.courses.findIndex((c) => c.id === course.id);
    const prev = path.courses[idx - 1];
    setLockedToast(
      `Hoàn thành ${prev?.name ?? "khóa trước"} ít nhất 60% để mở ${course.name}.`,
    );
  };

  /* ── Render ──────────────────────────────────────────────────── */
  if (!mounted) return <div className="ll-paths-skeleton ll-glass" />;

  if (activeQueue) {
    return (
      <SessionPlayer
        queue={activeQueue.queue}
        onExit={() => {
          setActiveQueue(null);
          refreshStates();
        }}
      />
    );
  }

  if (!profile) {
    return (
      <article className="ll-paths-empty ll-glass">
        <p>
          Hãy{" "}
          <Link href="/placement" className="ll-accent" style={{ fontWeight: 700 }}>
            làm bài kiểm tra xếp lớp
          </Link>{" "}
          để tôi gợi ý mạch học phù hợp với bạn.
        </p>
      </article>
    );
  }

  const orderedPaths = orderedPathsFor(profile.primaryGoal);
  const nowISO = new Date().toISOString();
  const totalCourses = LEARNING_PATHS.reduce((acc, p) => acc + p.courses.length, 0);

  return (
    <div className="ll-paths-view">
      {lockedToast && (
        <motion.div
          key={lockedToast}
          className="ll-paths-toast"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
        >
          🔒 {lockedToast}
        </motion.div>
      )}

      <div className="ll-paths-meta-row">
        <span>
          {orderedPaths.length} mạch · {totalCourses} khóa · Lộ trình của bạn:{" "}
          <strong>{orderedPaths[0]?.nameVi}</strong>
        </span>
      </div>

      {orderedPaths.map((path, pathIdx) => {
        const courseStates = path.courses.map((c, i) => ({
          course: c,
          status: statusFor(c, i, path, nowISO),
          stats: statsFor(c, nowISO),
        }));
        const doneCount = courseStates.filter((c) => c.status === "done").length;

        return (
          <section className="ll-path-row" key={path.id}>
            <header className="ll-path-row-head">
              <span className="ll-path-row-emoji" aria-hidden="true">
                {path.emoji}
              </span>
              <div className="ll-path-row-info">
                <h3>{path.nameVi}</h3>
                <p>
                  {doneCount}/{path.courses.length} hoàn thành
                  {pathIdx === 0 ? " · Mạch chính của bạn" : ""}
                </p>
              </div>
            </header>

            <div className="ll-path-row-track">
              {courseStates.map(({ course, status, stats }, idx) => (
                <CourseTile
                  key={course.id}
                  course={course}
                  status={status}
                  stats={stats}
                  isLast={idx === courseStates.length - 1}
                  onClick={() => {
                    if (status === "locked") handleLockedClick(course, path);
                    else startCourse(course);
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}

      <article className="ll-paths-explainer ll-glass">
        <div className="ll-paths-explainer-icon" aria-hidden="true">💡</div>
        <div>
          <strong>Cách mở khóa:</strong> Hoàn thành 60% khóa hiện tại trong cùng
          mạch để mở khóa khóa tiếp theo cùng mạch. Mỗi mạch độc lập — bạn có
          thể học song song nhiều mạch cùng lúc.
        </div>
      </article>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Course tile
   ──────────────────────────────────────────────────────────────────── */

function CourseTile({
  course,
  status,
  stats,
  isLast,
  onClick,
}: {
  course: PathCourse;
  status: CourseStatus;
  stats: CourseStats;
  isLast: boolean;
  onClick: () => void;
}) {
  const statusBadge =
    status === "done" ? (
      <span className="ll-course-tile-pill is-done">✓ Hoàn thành</span>
    ) : status === "active" || status === "in-progress" ? (
      <span className="ll-course-tile-pill is-active">Đang học</span>
    ) : (
      <span className="ll-course-tile-pill is-locked" aria-label="Đã khóa">🔒</span>
    );

  return (
    <>
      <motion.button
        type="button"
        onClick={onClick}
        className={`ll-course-tile ll-course-tile--${status}`}
        whileHover={status !== "locked" ? { y: -3 } : undefined}
        whileTap={status !== "locked" ? { scale: 0.98 } : undefined}
        disabled={false}
      >
        <header className="ll-course-tile-head">
          <span className="ll-course-tile-level">{course.level}</span>
          {statusBadge}
        </header>
        <h4 className="ll-course-tile-name">{course.name}</h4>
        <p className="ll-course-tile-meta">
          {stats.total > 0 ? `${stats.total} bài học` : "Đang biên soạn"}
        </p>
        {stats.total > 0 && (
          <div className="ll-course-tile-progress">
            <div
              className="ll-course-tile-progress-fill"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        )}
      </motion.button>
      {!isLast && <span className="ll-course-tile-connector" aria-hidden="true" />}
    </>
  );
}
