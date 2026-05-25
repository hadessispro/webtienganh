"use client";

/**
 * Path: apps/web/app/components/PracticeViewV2.tsx
 *
 * "Luyện đề" tab — rebuilt from legacy hardcoded metrics + mock quiz
 * rows to use ASU pool + SM-2 SkillState.
 *
 * Now:
 *   - 3 metric cards computed from SkillState + recent sessions
 *   - "Tạo đề mới" generates a fresh 10-ASU mixed queue via recommender
 *   - Quick-pick chips per skill type (vocab / grammar / listening / ...)
 *   - Recent quiz list = StudySessions from /api/study-sessions
 *     (gracefully empty when API doesn't exist yet)
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
      // not logged in or API not ready — silent
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

  if (!mounted) return <div className="ll-practice-v2-skeleton" />;

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
      <div className="ll-practice-v2-empty">
        <p>
          Hãy{" "}
          <a
            href="/placement"
            className="ll-accent"
            style={{ fontWeight: 700 }}
          >
            làm bài kiểm tra xếp lớp
          </a>{" "}
          để hệ thống biết tạo đề phù hợp với bạn.
        </p>
      </div>
    );
  }

  return (
    <div className="ll-practice-v2">
      <div className="ll-practice-v2-cta-row">
        <button
          type="button"
          onClick={startMixed}
          className="ll-practice-v2-cta-primary"
        >
          Tạo đề mới (10 câu hỗn hợp) →
        </button>
      </div>

      <div className="ll-practice-v2-metrics">
        <MetricCard
          label="Đề đã làm"
          unit="tuần này"
          value={metrics.weeklyCount}
          delta={metrics.weeklyDelta}
        />
        <MetricCard
          label="Điểm trung bình"
          unit="/100"
          value={metrics.avgScore}
          isScore
        />
        <MetricCard
          label="Chính xác"
          unit="tổng đáp án"
          value={metrics.accuracy}
          isPercent
        />
      </div>

      <section className="ll-practice-v2-section">
        <header className="ll-practice-v2-section-head">
          <h3>Chọn nhanh theo kỹ năng</h3>
          <span className="ll-practice-v2-section-sub">
            Đề 8 câu cho riêng kỹ năng bạn muốn ôn
          </span>
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
                className="ll-practice-v2-quick"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="ll-practice-v2-quick-emoji">{q.emoji}</span>
                <span className="ll-practice-v2-quick-label">{q.label}</span>
                <span className="ll-practice-v2-quick-meta">
                  {total} bài có sẵn
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="ll-practice-v2-section">
        <header className="ll-practice-v2-section-head">
          <h3>Đề gần đây</h3>
          <span className="ll-practice-v2-section-sub">
            {recentSessions.length === 0
              ? "Chưa có lần làm đề nào"
              : `${recentSessions.length} đề gần nhất`}
          </span>
        </header>
        {recentSessions.length === 0 ? (
          <div className="ll-practice-v2-empty-inline">
            Bấm <strong>Tạo đề mới</strong> ở trên để bắt đầu. Lần làm đầu
            tiên sẽ xuất hiện ở đây.
          </div>
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
  isScore,
  isPercent,
}: {
  label: string;
  unit: string;
  value: number;
  delta?: number;
  isScore?: boolean;
  isPercent?: boolean;
}) {
  const display = isScore
    ? value.toFixed(1)
    : isPercent
    ? `${Math.round(value)}%`
    : `${Math.round(value)}`;
  const numClass =
    isScore || isPercent
      ? "ll-practice-v2-metric-num green"
      : "ll-practice-v2-metric-num";

  return (
    <div className="ll-practice-v2-metric">
      <div className="ll-practice-v2-metric-label">{label}</div>
      <div className="ll-practice-v2-metric-row">
        <span>{unit}</span>
        <strong className={numClass}>{display}</strong>
      </div>
      {typeof delta === "number" && delta !== 0 ? (
        <div
          className={`ll-practice-v2-metric-delta ${delta > 0 ? "up" : "down"}`}
        >
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} so với tuần trước
        </div>
      ) : (
        <div className="ll-practice-v2-metric-delta neutral">
          Tích lũy từ phiên đầu tiên
        </div>
      )}
    </div>
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
    <article className="ll-practice-v2-row">
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
  const thisWeekSessions = sessions.filter(
    (s) => now - new Date(s.startedAt).getTime() < oneWeekMs,
  );
  const lastWeekSessions = sessions.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t < now - oneWeekMs && t > now - 2 * oneWeekMs;
  });

  let totalCorrect = 0;
  let totalAttempts = 0;
  for (const s of sessions) {
    totalCorrect += s.correctCount;
    totalAttempts += s.totalSkills;
  }

  const stateValues = Object.values(states);
  const nowISO = new Date().toISOString();
  let avgScore = 0;
  if (stateValues.length > 0) {
    const sum = stateValues.reduce(
      (acc, s) => acc + decayedStrength(s, nowISO) * 100,
      0,
    );
    avgScore = sum / stateValues.length;
  }

  return {
    weeklyCount: thisWeekSessions.length,
    weeklyDelta: thisWeekSessions.length - lastWeekSessions.length,
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
