"use client";

/**
 * CoursePathCard
 *
 * Compact course card used in the /learn → Courses tab learning-path layout.
 * Replaces the older oversized .ll-course-tile / CourseTiltCard presentation.
 *
 * Design intent:
 * - Small footprint (height ~140px) so 5 cards fit comfortably per row
 * - Three visual states: locked / active / completed
 * - Active state shows a horizontal shimmer "loading" gradient to convey
 *   "in progress" — replaces the per-row connector line
 * - Glassmorphism light, same vocabulary as other dashboard cards (.ll-glass)
 * - Uses Microsoft Fluent 3D emoji PNGs (in /icons/fluent/) for state badges
 *
 * State semantics:
 * - locked    → user hasn't unlocked this CEFR level on this track yet
 * - active    → currently in progress (0 < progress < 100)
 * - completed → progress === 100
 */

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";

export type CoursePathState = "locked" | "active" | "completed";

export type CoursePathCardProps = {
  title: string;
  level: string;
  lessons: number;
  state: CoursePathState;
  progress: number; // 0-100
  /** Track accent color (used for active border / progress) */
  accent: string;
  onClick?: () => void;
  /** Optional secondary text (e.g. "12 / 24 bài" or "Hoàn thành 2 tuần trước") */
  metaSlot?: ReactNode;
};

const LEVEL_TINT: Record<string, string> = {
  A1: "#c9f7da",
  A2: "#b3f0c8",
  B1: "#8fe4b4",
  B2: "#6dd49c",
  C1: "#4cbf85",
  C2: "#2da66d",
};

export function CoursePathCard({
  title,
  level,
  lessons,
  state,
  progress,
  accent,
  onClick,
  metaSlot,
}: CoursePathCardProps) {
  const isLocked = state === "locked";
  const isActive = state === "active";
  const isDone = state === "completed";

  // Vars consumed by the .ll-course-path-card CSS in globals.css.
  const cssVars: CSSProperties & Record<string, string> = {
    "--cpc-accent": accent,
    "--cpc-level-tint": LEVEL_TINT[level] ?? "#c9f7da",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      data-state={state}
      className="ll-course-path-card ll-glass"
      style={cssVars}
      aria-label={`${title}, trình độ ${level}${isLocked ? " — đang khóa" : ""}`}
    >
      {/* Top row: level pill + state badge */}
      <div className="ll-course-path-card-head">
        <span className="ll-course-path-card-level">{level}</span>
        <span className="ll-course-path-card-state" aria-hidden="true">
          {isDone && (
            <Image
              src="/icons/fluent/check.png"
              alt=""
              width={22}
              height={22}
              priority={false}
            />
          )}
          {isLocked && (
            <Image
              src="/icons/fluent/locked.png"
              alt=""
              width={22}
              height={22}
              priority={false}
            />
          )}
          {isActive && (
            <span className="ll-course-path-card-active-tag">Đang học</span>
          )}
        </span>
      </div>

      {/* Title */}
      <h3 className="ll-course-path-card-title">{title}</h3>

      {/* Meta */}
      <div className="ll-course-path-card-meta">
        {metaSlot ?? <span>{lessons} bài học</span>}
      </div>

      {/* Progress / shimmer */}
      <div className="ll-course-path-card-progress" aria-hidden="true">
        <div
          className="ll-course-path-card-progress-fill"
          style={{ width: `${isDone ? 100 : isActive ? progress : 0}%` }}
        />
        {isActive && <div className="ll-course-path-card-progress-shimmer" />}
      </div>
    </button>
  );
}
