"use client";

/**
 * Path: apps/web/app/components/LessonsViewV2.tsx
 *
 * "Bài học" tab — rebuilt from legacy hardcoded `todayTasks +
 * learningPath` (mock data) to use the real ASU pool + SM-2 SkillState.
 *
 * Each card is one ASU from FOUNDATION_SEED filtered by the user's
 * track. Status (Mới / Đang học / Hoàn thành) is computed from the
 * user's actual practice history.
 *
 * Filter chips: Tất cả / Đang học / Hoàn thành / Mới — with live counts.
 * Search box filters by preview text + tags.
 *
 * Clicking a card launches SessionPlayer with [thatASU] queue.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { SessionPlayer } from "./SessionPlayer";
import { FOUNDATION_SEED } from "../lib/skill-seed-foundation";
import { defaultTrackForGoal } from "../lib/track-templates";
import {
  loadProfileFromStorage,
  type RecommenderProfile,
} from "../lib/recommend-engine";
import {
  loadAllSkillStates,
  decayedStrength,
  type SkillState,
} from "../lib/user-skill-state";
import type { SkillUnit } from "../lib/skill-units";

type LessonStatus = "new" | "learning" | "done";
type FilterKey = "all" | "learning" | "done" | "new";

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Tất cả",
  learning: "Đang học",
  done: "Hoàn thành",
  new: "Mới",
};

const TYPE_LABELS: Record<string, { vi: string; emoji: string }> = {
  vocab: { vi: "Từ vựng", emoji: "📝" },
  phrase: { vi: "Cụm từ", emoji: "💬" },
  grammar: { vi: "Ngữ pháp", emoji: "📐" },
  listening: { vi: "Nghe", emoji: "👂" },
  pronunciation: { vi: "Phát âm", emoji: "🗣️" },
  reading: { vi: "Đọc", emoji: "📖" },
  writing: { vi: "Viết", emoji: "✍️" },
};

export function LessonsViewV2() {
  const [profile, setProfile] = useState<RecommenderProfile | null>(null);
  const [states, setStates] = useState<Record<string, SkillState>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchInput, setSearchInput] = useState("");
  const [activeQueue, setActiveQueue] = useState<SkillUnit[] | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(loadProfileFromStorage());
    setStates(loadAllSkillStates());
  }, []);

  const refreshStates = () => setStates(loadAllSkillStates());

  const track = useMemo(() => {
    if (!profile) return null;
    return defaultTrackForGoal(profile.primaryGoal);
  }, [profile]);

  // ASUs in the user's track (foundation = full pool since only that
  // track has seeded ASUs right now)
  const lessons = useMemo<SkillUnit[]>(() => {
    if (!track) return [];
    return FOUNDATION_SEED.filter((s) =>
      track.required_tags.every((t) =>
        (s.tags as readonly string[]).includes(t as any),
      ),
    );
  }, [track]);

  const filtered = useMemo<SkillUnit[]>(() => {
    const now = new Date().toISOString();
    const q = searchInput.trim().toLowerCase();

    return lessons.filter((skill) => {
      if (filter !== "all") {
        const status = getStatus(skill.id, states, now);
        if (filter === "new" && status !== "new") return false;
        if (filter === "learning" && status !== "learning") return false;
        if (filter === "done" && status !== "done") return false;
      }
      if (q) {
        const preview = previewText(skill).toLowerCase();
        const tags = (skill.tags as readonly string[]).join(" ").toLowerCase();
        if (!preview.includes(q) && !tags.includes(q)) return false;
      }
      return true;
    });
  }, [lessons, states, filter, searchInput]);

  if (!mounted) return <div className="ll-lessons-v2-skeleton" />;

  if (activeQueue) {
    return (
      <SessionPlayer
        queue={activeQueue}
        onExit={() => {
          setActiveQueue(null);
          refreshStates();
        }}
      />
    );
  }

  if (!profile) {
    return (
      <div className="ll-lessons-empty">
        <p>
          Hãy{" "}
          <a
            href="/placement"
            className="ll-accent"
            style={{ fontWeight: 700 }}
          >
            làm bài kiểm tra xếp lớp
          </a>{" "}
          trước để chúng tôi biết bài nào phù hợp với bạn.
        </p>
      </div>
    );
  }

  const counts = computeStatusCounts(lessons, states);

  return (
    <div className="ll-lessons-v2">
      <div className="ll-lessons-filter">
        <div className="ll-lessons-search">
          <span className="ll-lessons-search-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm bài học, chủ đề, từ vựng..."
          />
        </div>
        <div className="ll-lessons-chips">
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => {
            const count =
              key === "all"
                ? lessons.length
                : key === "learning"
                ? counts.learning
                : key === "done"
                ? counts.done
                : counts.new;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`ll-lessons-chip ${
                  filter === key ? "is-active" : ""
                }`}
              >
                {FILTER_LABELS[key]}
                <span className="ll-lessons-chip-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState filter={filter} totalLessons={lessons.length} />
      ) : (
        <div className="ll-lessons-grid">
          {filtered.map((skill, i) => (
            <LessonCard
              key={skill.id}
              skill={skill}
              state={states[skill.id]}
              index={i}
              onStart={() => setActiveQueue([skill])}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonCard({
  skill,
  state,
  index,
  onStart,
}: {
  skill: SkillUnit;
  state: SkillState | undefined;
  index: number;
  onStart: () => void;
}) {
  const type = skill.payload.type;
  const typeLabel = TYPE_LABELS[type] ?? { vi: type, emoji: "✦" };
  const nowISO = new Date().toISOString();
  const status = getStatus(
    skill.id,
    state ? { [skill.id]: state } : {},
    nowISO,
  );
  const decayed = state ? decayedStrength(state, nowISO) : 0;
  const pct = Math.round(decayed * 100);

  const ctaLabel =
    status === "done" ? "Mở lại" : status === "learning" ? "Ôn lại" : "Bắt đầu";
  const statusLabel =
    status === "done" ? "Hoàn thành" : status === "learning" ? "Đang học" : "Mới";

  const tagLabel = (skill.tags as readonly string[]).find(
    (t) => !t.startsWith("level:") && !t.startsWith("goal:"),
  );

  return (
    <motion.article
      className="ll-lesson-card-v2"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35 }}
    >
      <div className="ll-lesson-card-v2-head">
        <div className="ll-lesson-card-v2-icon" aria-hidden="true">
          {typeLabel.emoji}
        </div>
        <span
          className={`ll-lesson-card-v2-status ll-lesson-card-v2-status--${status}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="ll-lesson-card-v2-body">
        <div className="ll-lesson-card-v2-type">{typeLabel.vi}</div>
        <h3 className="ll-lesson-card-v2-title">{previewText(skill)}</h3>

        <div className="ll-lesson-card-v2-meta">
          <span className="ll-lesson-card-v2-meta-chip">{skill.level}</span>
          {tagLabel && (
            <span className="ll-lesson-card-v2-meta-chip">
              {prettyTag(tagLabel)}
            </span>
          )}
          <span className="ll-lesson-card-v2-meta-time">
            {Math.max(1, Math.round(skill.estimated_seconds / 60))} phút
          </span>
        </div>
      </div>

      <div className="ll-lesson-card-v2-progress">
        <div className="ll-lesson-card-v2-progress-bar">
          <div
            className="ll-lesson-card-v2-progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="ll-lesson-card-v2-progress-pct">{pct}%</span>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={`ll-lesson-card-v2-cta ll-lesson-card-v2-cta--${status}`}
      >
        {ctaLabel}
      </button>
    </motion.article>
  );
}

function EmptyState({
  filter,
  totalLessons,
}: {
  filter: FilterKey;
  totalLessons: number;
}) {
  if (totalLessons === 0) {
    return (
      <div className="ll-lessons-empty">
        <p>Lộ trình của bạn chưa có bài học. Hãy chọn lộ trình ở tab Khóa học.</p>
      </div>
    );
  }
  const msg =
    filter === "learning"
      ? "Bạn chưa đang học bài nào. Bấm một thẻ 'Mới' để bắt đầu."
      : filter === "done"
      ? "Chưa có bài nào hoàn thành. Cố lên!"
      : filter === "new"
      ? "Bạn đã thử qua hết bài rồi. Hãy ôn các bài 'Đang học'."
      : "Không tìm thấy bài phù hợp.";
  return (
    <div className="ll-lessons-empty">
      <p>{msg}</p>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────── */

function getStatus(
  skillId: string,
  states: Record<string, SkillState>,
  nowISO: string,
): LessonStatus {
  const s = states[skillId];
  if (!s) return "new";
  const decayed = decayedStrength(s, nowISO);
  if (decayed >= 0.7) return "done";
  return "learning";
}

function computeStatusCounts(
  lessons: SkillUnit[],
  states: Record<string, SkillState>,
): { learning: number; done: number; new: number } {
  const out = { learning: 0, done: 0, new: 0 };
  const now = new Date().toISOString();
  for (const l of lessons) {
    const s = getStatus(l.id, states, now);
    out[s]++;
  }
  return out;
}

function previewText(s: SkillUnit): string {
  switch (s.payload.type) {
    case "vocab":
      return s.payload.word;
    case "phrase":
      return s.payload.phrase_en;
    case "grammar":
      return s.payload.rule_title_vi;
    case "listening":
      return s.payload.question_vi;
    case "pronunciation":
      return s.payload.target_text_en;
    case "reading":
      return s.payload.passage_en.slice(0, 50) + "…";
    case "writing":
      return s.payload.prompt_vi.slice(0, 50) + "…";
    default:
      return s.id;
  }
}

function prettyTag(tag: string): string {
  const [, rest] = tag.split(":");
  if (!rest) return tag;
  const map: Record<string, string> = {
    pronunciation: "Phát âm",
    grammar: "Ngữ pháp",
    listening: "Nghe",
    vocab: "Từ vựng",
    speaking: "Nói",
    it_software: "IT",
    food: "Ăn uống",
    directions: "Hỏi đường",
    hotel: "Khách sạn",
    shopping: "Mua sắm",
    small_talk: "Trò chuyện",
    ielts: "IELTS",
    toeic: "TOEIC",
  };
  return map[rest] ?? rest.replace(/_/g, " ");
}
