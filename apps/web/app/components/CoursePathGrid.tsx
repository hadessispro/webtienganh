"use client";

/**
 * CoursePathGrid
 *
 * Groups courses into goal-based "tracks", orders each track by CEFR level
 * (A1 → C2), and decides each card's lock/active/completed state by walking
 * the row in order.
 *
 * Rules:
 * - The first course in a track is unlocked by default.
 * - Subsequent courses in the same track are unlocked only when the previous
 *   one is completed (100% progress).
 * - "Đang học" = enrolled and 0 < progress < 100.
 *
 * The component takes the same `Course[]` and `LearnerProfile` shapes the
 * dashboard already uses, so no schema change is needed elsewhere.
 */

import Image from "next/image";
import { CoursePathCard, type CoursePathState } from "./CoursePathCard";
import type { Goal } from "../lib/learning-core";
import type { Course, LearnerProfile } from "../lib/product-data";

const CEFR_ORDER: Record<string, number> = {
  A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6,
  // JLPT support (reverse — N5 easiest)
  N5: 1, N4: 2, N3: 3, N2: 4, N1: 5,
};

type TrackDef = {
  id: Goal;
  label: string;
  icon: string;          // path under /public
  accent: string;        // hex
  description: string;
};

const TRACK_DEFS: TrackDef[] = [
  {
    id: "work",
    label: "Giao tiếp công việc",
    icon: "/icons/fluent/light-bulb.png",
    accent: "#e2a73a",
    description: "Phản xạ meeting, email, đàm phán.",
  },
  {
    id: "exam",
    label: "Luyện thi",
    icon: "/icons/fluent/bullseye.png",
    accent: "#e23a6e",
    description: "IELTS, TOEIC, mock test, blueprint.",
  },
  {
    id: "foundation",
    label: "Nền tảng & Phản xạ",
    icon: "/icons/fluent/books.png",
    accent: "#4187d6",
    description: "Ngữ pháp, từ vựng, nghe chậm, flashcard.",
  },
];

type CoursePathGridProps = {
  courses: Course[];
  profile: LearnerProfile;
  /** Click handler — opens the course in the dashboard's main view. */
  onCourseOpen: (courseId: string) => void;
  /** Click handler for the "Bắt đầu" / "Tiếp tục" CTA when card itself is clicked. */
  onCourseEnroll: (courseId: string) => void;
};

/**
 * Read the learner's progress for a given course id. Today this is mocked
 * because the schema only carries enrolledCourseIds + completedTaskIds; the
 * dashboard uses a hard-coded 68% for the enrolled course elsewhere, so we
 * mirror that behavior here and treat all other courses as 0.
 *
 * Phase 2+: this will pull from `course_progress` table.
 */
function progressFor(profile: LearnerProfile, courseId: string): number {
  if (!profile.enrolledCourseIds.includes(courseId)) return 0;
  // Mock: same value the legacy ProgressBar used.
  return 68;
}

function computeStates(
  trackCourses: Course[],
  profile: LearnerProfile,
): CoursePathState[] {
  const states: CoursePathState[] = [];
  let previousCompleted = true; // first course always unlocked
  for (const course of trackCourses) {
    const p = progressFor(profile, course.id);
    let state: CoursePathState;
    if (!previousCompleted) {
      state = "locked";
    } else if (p >= 100) {
      state = "completed";
    } else if (p > 0) {
      state = "active";
    } else {
      // unlocked but not started — treat as active with 0 progress so user
      // can begin. If we wanted a "ready / not started" 4th state we'd add
      // it here.
      state = "active";
    }
    states.push(state);
    previousCompleted = state === "completed";
  }
  return states;
}

export function CoursePathGrid({
  courses,
  profile,
  onCourseOpen,
  onCourseEnroll,
}: CoursePathGridProps) {
  const byTrack = TRACK_DEFS.map((track) => {
    const trackCourses = courses
      .filter((course) => course.goal === track.id)
      .sort(
        (a, b) =>
          (CEFR_ORDER[a.level] ?? 99) - (CEFR_ORDER[b.level] ?? 99),
      );
    return { track, courses: trackCourses };
  });

  return (
    <div className="ll-course-path-grid">
      {byTrack.map(({ track, courses: trackCourses }) => {
        if (trackCourses.length === 0) return null;
        const states = computeStates(trackCourses, profile);
        const doneCount = states.filter((s) => s === "completed").length;
        return (
          <section key={track.id} className="ll-course-path-track">
            <header
              className="ll-course-path-track-head"
              style={{ ["--track-accent" as string]: track.accent }}
            >
              <div className="ll-course-path-track-icon">
                <Image src={track.icon} alt="" width={44} height={44} priority={false} />
              </div>
              <div className="ll-course-path-track-info">
                <h3>{track.label}</h3>
                <p>{track.description}</p>
              </div>
              <div className="ll-course-path-track-progress">
                <strong>{doneCount}</strong>
                <span>/{trackCourses.length}</span>
              </div>
            </header>

            <div className="ll-course-path-row">
              {trackCourses.map((course, idx) => (
                <CoursePathCard
                  key={course.id}
                  title={course.title}
                  level={course.level}
                  lessons={course.lessons}
                  state={states[idx]}
                  progress={progressFor(profile, course.id)}
                  accent={track.accent}
                  onClick={() => {
                    if (states[idx] === "locked") return;
                    // Treat single click as enroll-or-continue, consistent
                    // with the old "Bắt đầu / Tiếp tục" button.
                    if (profile.enrolledCourseIds.includes(course.id)) {
                      onCourseOpen(course.id);
                    } else {
                      onCourseEnroll(course.id);
                    }
                  }}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
