"use client";

/**
 * Path: apps/web/app/components/PracticeViewV2.tsx
 *
 * "Luyện đề" tab — REDESIGN 2026-05-25 (match site design system).
 *
 * Fixes from previous attempt:
 *   - Avg score now shows "—" when no states yet (was showing "14.3"
 *     awkwardly from a single SM-2 state).
 *   - Metric cards use .ll-glass (28px radius) to match Groups + hero.
 *   - Quick chips use the same "icon + title + meta" pattern as the
 *     ASU recommendation chips on LearnPathHero so they feel like part
 *     of the same family.
 *   - Empty state for "Đề gần đây" is a styled glass card, not a bare
 *     dashed div.
 *   - "Tạo đề mới" CTA moved into the same row as section header,
 *     matching the "Tạo nhóm" placement in Groups tab.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { SessionPlayer } from "./SessionPlayer";
import { FOUNDATION_SEED } from "../lib/skill-seed-foundation";
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
import type { SkillType, SkillUnit } from "../lib/skill-units";

type QuickType = "vocab" | "phrase" | "grammar" | "listening" | "pronunciation";

const QUICK_TYPES: Array<{
  id: QuickType;
  label: string;
  emoji: string;
}> = [
  { id: "vocab", label: "Từ vựng", emoji: "📝" },
  { id: "phrase", label: "Cụm từ", emoji: "💬" },
  { id: "grammar", label: "Ngữ pháp", emoji: "📐" },
  { id: "listening", label: "Nghe", emoji: "👂" },
  { id: "pronunciation", label: "Phát âm", emoji: "🗣️" },
];

interface RecentSession {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  totalSkills: number;
  correctCount: number;
  wrongCount: number;
  primaryType?: SkillType;
}

export function PracticeViewV2() {
  const [profile, setProfile] = useState<RecommenderProfile | null>(null);
  const [states, setStates] = useState<Record<string, SkillState>>({});
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [activeQueue, setActiveQueue] = useState<SkillUnit[] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(loadProfileFromStorage());
    setStates(loadAllSkillStates());
    fetchRecentSessions();
  }, []);

  const refresh = () => {
    setStates(loadAllSkillStates());
    fetchRecentSessions();
  };

  async function fetchRecentSessions() {
    try {
      const res = await fetch("/api/study-sessions?limit=8");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setRecentSessions(data);
    } catch {
      // silent
    }
  }

  const metrics = useMemo(
    () => computeMetrics(states, recentSessions),
    [states, recentSessions],
  );

  const startMixed = () => {
    if (!profile) return;
    const queue = recommendDaily(FOUNDATION_SEED, profile, { n: 10 });
    if (queue.length > 0) setActiveQueue(queue);
  };

  const startByType = (type: QuickType) => {
    if (!profile) return;
    const allByType = FOUNDATION_SEED.filter((s) => s.payload.type === type);
    if (allByType.length === 0) return;
    const queue = recommendDaily(allByType, profile, { n: 8 });
    if (queue.length > 0) setActiveQueue(queue);
  };

  if (!mounted) return <div className="ll-practice-v2-skeleton ll-glass" />;

  if (activeQueue) {
    return (
      <SessionPlayer
        queue={activeQueue}
        onExit={() => {
          setActiveQueue(null);
          refresh();
        }}
      />
    );
  }

  if (!profile) {
    return (
      <article className="ll-practice-v2-empty ll-glass">
        <p>
          Hãy{" "}
          <a href="/placement" className="ll-accent" style={{ fontWeight: 700 }}>
            làm bài kiểm tra xếp lớp
          </a>{" "}
          để hệ thống biết tạo đề phù hợp với bạn.
        </p>
      </article>
    );
  }

  return (
    <div className="ll-practice-v2">
      {/* Metric row */}
      <div className="ll-practice-v2-metrics">
        <MetricCard
          label="Đề đã làm"
          unit="tuần này"
          value={metrics.weeklyCount}
          delta={metrics.weeklyDelta}
          format="int"
        />
        <MetricCard
          label="Điểm trung bình"
          unit="/100"
          value={metrics.avgScore}
          hasData={metrics.avgScore > 0}
          format="score"
        />
        <MetricCard
          label="Chính xác"
          unit="tổng đáp án"
          value={metrics.accuracy}
          hasData={recentSessions.length > 0}
          format="percent"
        />
      </div>

      {/* Quick-pick by skill */}
      <section className="ll-practice-v2-section">
        <header className="ll-practice-v2-section-head">
          <div>
            <span className="ll-practice-v2-section-eyebrow">CHỌN NHANH · 5 KỸ NĂNG</span>
            <h3>Luyện theo từng kỹ năng</h3>
          </div>
          <button
            type="button"
            onClick={startMixed}
            className="ll-practice-v2-cta-primary"
          >
            Tạo đề mới (10 câu hỗn hợp) →
          </button>
        </header>
        <div className="ll-practice-v2-quick-grid">
          {QUICK_TYPES.map((q) => {
            const total = FOUNDATION_SEED.filter(
              (s) => s.payload.type === q.id,
            ).length;
            return (
              <motion.button
                key={q.id}
                type="button"
                onClick={() => startByType(q.id)}
                disabled={total === 0}
                className="ll-practice-v2-quick ll-glass"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="ll-practice-v2-quick-emoji" aria-hidden="true">
                  {q.emoji}
                </span>
                <span className="ll-practice-v2-quick-label">{q.label}</span>
                <span className="ll-practice-v2-quick-meta">
                  {total} bài có sẵn
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Recent */}
      <section className="ll-practice-v2-section">
        <header className="ll-practice-v2-section-head">
          <div>
            <span className="ll-practice-v2-section-eyebrow">LỊCH SỬ</span>
            <h3>Đề gần đây</h3>
          </div>
          <span className="ll-practice-v2-section-sub">
            {recentSessions.length === 0
              ? "Chưa có lần làm đề nào"
              : `${recentSessions.length} đề gần nhất`}
          </span>
        </header>
        {recentSessions.length === 0 ? (
          <article className="ll-practice-v2-empty-inline ll-glass">
            <p>
              Bấm <strong>Tạo đề mới</strong> ở trên để bắt đầu. Lần làm đầu
              tiên sẽ xuất hiện ở đây.
            </p>
          </article>
        ) : (
          <div className="ll-practice-v2-history">
            {recentSessions.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  unit,
  value,
  delta,
  hasData,
  format,
}: {
  label: string;
  unit: string;
  value: number;
  delta?: number;
  hasData?: boolean;
  format: "int" | "score" | "percent";
}) {
  const showValue = hasData !== false;
  const display = !showValue
    ? "—"
    : format === "score"
    ? value.toFixed(1)
    : format === "percent"
    ? `${Math.round(value)}%`
    : `${Math.round(value)}`;
  const numClass = `ll-practice-v2-metric-num ${showValue && (format !== "int") ? "is-green" : ""}`;

  return (
    <article className="ll-practice-v2-metric ll-glass">
      <div className="ll-practice-v2-metric-label">{label}</div>
      <div className="ll-practice-v2-metric-row">
        <span className="ll-practice-v2-metric-unit">{unit}</span>
        <strong className={numClass}>{display}</strong>
      </div>
      {typeof delta === "number" && delta !== 0 && showValue ? (
        <div
          className={`ll-practice-v2-metric-delta ${delta > 0 ? "is-up" : "is-down"}`}
        >
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} so với tuần trước
        </div>
      ) : (
        <div className="ll-practice-v2-metric-delta is-neutral">
          {showValue ? "Tích lũy từ phiên đầu tiên" : "Chưa có dữ liệu"}
        </div>
      )}
    </article>
  );
}

function SessionRow({ session }: { session: RecentSession }) {
  const accuracy =
    session.totalSkills > 0
      ? Math.round((session.correctCount / session.totalSkills) * 100)
      : 0;
  const score = (accuracy / 10).toFixed(1);
  const date = new Date(session.startedAt);
  const today = new Date();
  const ddiff = Math.floor(
    (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  const when =
    ddiff === 0
      ? `Hôm nay ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`
      : ddiff === 1
      ? "Hôm qua"
      : ddiff < 7
      ? `${ddiff} ngày trước`
      : date.toLocaleDateString("vi-VN");

  return (
    <article className="ll-practice-v2-row ll-glass">
      <div className="ll-practice-v2-row-icon" aria-hidden="true">
        {sessionEmoji(session.primaryType)}
      </div>
      <div className="ll-practice-v2-row-body">
        <h4>{sessionTitle(session)}</h4>
        <p>
          {session.totalSkills} câu · {when}
        </p>
      </div>
      <div className="ll-practice-v2-row-score">{score}</div>
    </article>
  );
}

interface PracticeMetrics {
  weeklyCount: number;
  weeklyDelta: number;
  avgScore: number;
  accuracy: number;
}

function computeMetrics(
  states: Record<string, SkillState>,
  sessions: RecentSession[],
): PracticeMetrics {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeek = sessions.filter(
    (s) => now - new Date(s.startedAt).getTime() < oneWeekMs,
  );
  const lastWeek = sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t < now - oneWeekMs && t > now - 2 * oneWeekMs;
  });

  let totalCorrect = 0;
  let totalAttempts = 0;
  for (const s of sessions) {
    totalCorrect += s.correctCount;
    totalAttempts += s.totalSkills;
  }

  // Avg score: only meaningful when user has done >= 3 ASUs.
  // For < 3, show 0 (which the MetricCard renders as "—").
  const stateValues = Object.values(states);
  const nowISO = new Date().toISOString();
  let avgScore = 0;
  if (stateValues.length >= 3) {
    const sum = stateValues.reduce(
      (acc, s) => acc + decayedStrength(s, nowISO) * 100,
      0,
    );
    avgScore = sum / stateValues.length;
  }

  return {
    weeklyCount: thisWeek.length,
    weeklyDelta: thisWeek.length - lastWeek.length,
    avgScore,
    accuracy: totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0,
  };
}

function sessionEmoji(type?: SkillType): string {
  switch (type) {
    case "vocab":
      return "📝";
    case "phrase":
      return "💬";
    case "grammar":
      return "📐";
    case "listening":
      return "👂";
    case "pronunciation":
      return "🗣️";
    case "reading":
      return "📖";
    case "writing":
      return "✍️";
    default:
      return "✦";
  }
}

function sessionTitle(s: RecentSession): string {
  if (s.primaryType) return `Đề ${typeLabel(s.primaryType)}`;
  return `Đề hỗn hợp · ${s.totalSkills} câu`;
}

function typeLabel(t: SkillType): string {
  switch (t) {
    case "vocab":
      return "Từ vựng";
    case "phrase":
      return "Cụm từ";
    case "grammar":
      return "Ngữ pháp";
    case "listening":
      return "Nghe";
    case "pronunciation":
      return "Phát âm";
    case "reading":
      return "Đọc hiểu";
    case "writing":
      return "Viết";
    default:
      return t;
  }
}
