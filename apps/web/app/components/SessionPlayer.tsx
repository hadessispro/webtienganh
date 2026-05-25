"use client";

/**
 * Path: apps/web/app/components/SessionPlayer.tsx
 *
 * Plays a queue of ASUs one at a time. After each skill the user
 * completes, updates the SM-2 state in localStorage so future
 * recommendations adapt.
 *
 * When the queue is empty, shows a completion screen with stats.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { SkillCard } from "./SkillCard";
import {
  applySm2,
  getSkillState,
  gradeAttempt,
  newSkillState,
  setSkillState,
} from "../lib/user-skill-state";
import type { SkillUnit } from "../lib/skill-units";

type Props = {
  queue: SkillUnit[];
  onExit: () => void;
  onComplete?: (stats: SessionStats) => void;
};

export interface SessionStats {
  total: number;
  correct: number;
  wrong: number;
  durationMs: number;
}

export function SessionPlayer({ queue, onExit, onComplete }: Props) {
  const startMs = useMemo(() => Date.now(), []);
  const [idx, setIdx] = useState(0);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [attempts, setAttempts] = useState<any[]>([]);
  const [hasPosted, setHasPosted] = useState(false);
  const done = idx >= queue.length;

  const handleSkillDone = (correct: boolean, elapsedMs: number) => {
    const current = queue[idx];
    // Persist SM-2 update
    const prev = getSkillState(current.id) ?? newSkillState(current.id);
    const quality = gradeAttempt(correct, elapsedMs);
    const next = applySm2(prev, quality);
    setSkillState(next);

    // Bump session stats
    setStats((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      wrong: s.wrong + (correct ? 0 : 1),
    }));

    setAttempts((prev) => [
      ...prev,
      {
        skillId: current.id,
        type: current.payload.type,
        correct,
        elapsedMs,
        qualityScore: quality,
      },
    ]);

    // Advance after a tiny delay so user sees feedback
    setTimeout(() => setIdx((i) => i + 1), 250);
  };

  if (done) {
    const final: SessionStats = {
      total: queue.length,
      correct: stats.correct,
      wrong: stats.wrong,
      durationMs: Date.now() - startMs,
    };

    if (!hasPosted && queue.length > 0) {
      setHasPosted(true);
      fetch("/api/study-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: new Date(startMs).toISOString(),
          totalSkills: queue.length,
          correctCount: stats.correct,
          wrongCount: stats.wrong,
          attempts,
          durationMs: final.durationMs,
        }),
      }).catch(console.error);
    }
    return (
      <CompletionScreen
        stats={final}
        onExit={() => {
          onComplete?.(final);
          onExit();
        }}
      />
    );
  }

  const current = queue[idx];

  return (
    <div className="ll-session-root">
      <header className="ll-session-head">
        <button type="button" className="ll-session-exit" onClick={onExit}>
          ✕
        </button>
        <div className="ll-session-progress">
          <div className="ll-session-progress-bar">
            <div
              className="ll-session-progress-fill"
              style={{ width: `${((idx) / queue.length) * 100}%` }}
            />
          </div>
          <span className="ll-session-progress-text">
            {idx + 1} / {queue.length}
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <SkillCard key={current.id} skill={current} onComplete={handleSkillDone} />
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Completion screen
   ────────────────────────────────────────────────────────────────── */

function CompletionScreen({
  stats,
  onExit,
}: {
  stats: SessionStats;
  onExit: () => void;
}) {
  const accuracy =
    stats.total === 0 ? 0 : Math.round((stats.correct / stats.total) * 100);
  const minutes = Math.max(1, Math.round(stats.durationMs / 60000));

  return (
    <motion.div
      className="ll-session-complete"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="ll-session-complete-emoji">🎉</div>
      <h2 className="ll-session-complete-title">Hoàn tất phiên học!</h2>
      <div className="ll-session-complete-stats">
        <div className="ll-session-stat">
          <div className="ll-session-stat-num">{stats.total}</div>
          <div className="ll-session-stat-label">Kỹ năng</div>
        </div>
        <div className="ll-session-stat">
          <div className="ll-session-stat-num">{accuracy}%</div>
          <div className="ll-session-stat-label">Chính xác</div>
        </div>
        <div className="ll-session-stat">
          <div className="ll-session-stat-num">{minutes}'</div>
          <div className="ll-session-stat-label">Thời gian</div>
        </div>
      </div>
      <p className="ll-session-complete-msg">
        Tuyệt vời! Hãy quay lại ngày mai để tiếp tục lộ trình.
      </p>
      <button type="button" className="ll-session-complete-cta" onClick={onExit}>
        Về trang chính
      </button>
    </motion.div>
  );
}
