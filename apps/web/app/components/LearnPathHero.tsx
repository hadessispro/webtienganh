"use client";

/**
 * Path: apps/web/app/components/LearnPathHero.tsx
 *
 * Personalized hero card shown at the TOP of the "Khóa học" tab.
 * Replaces the legacy 13-course grid as the primary entry point.
 *
 * What it shows:
 *  - Track name (from Placement v2 profile + default mapping)
 *  - Progress bar (skills mastered / total in track)
 *  - 5-7 next-up ASUs from the recommender
 *  - Primary CTA "Bắt đầu hôm nay" → opens lesson player
 *
 * If no Placement v2 profile exists yet, shows a CTA to do placement
 * first instead of an empty broken state.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  loadProfileFromStorage,
  recommendDaily,
  type RecommenderProfile,
} from "../lib/recommend-engine";
import { FOUNDATION_SEED } from "../lib/skill-seed-foundation";
import { defaultTrackForGoal } from "../lib/track-templates";
import { loadAllSkillStates, decayedStrength } from "../lib/user-skill-state";
import type { SkillUnit, TrackTemplate } from "../lib/skill-units";

type Props = {
  onStartSession: (queue: SkillUnit[]) => void;
};

export function LearnPathHero({ onStartSession }: Props) {
  const [profile, setProfile] = useState<RecommenderProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProfile(loadProfileFromStorage());
  }, []);

  if (!mounted) return null;

  if (!profile) {
    return <PlacementCta />;
  }

  return <ActivePathHero profile={profile} onStartSession={onStartSession} />;
}

/* ──────────────────────────────────────────────────────────────────
   When the user has done placement
   ────────────────────────────────────────────────────────────────── */

function ActivePathHero({
  profile,
  onStartSession,
}: {
  profile: RecommenderProfile;
  onStartSession: (queue: SkillUnit[]) => void;
}) {
  const track: TrackTemplate = useMemo(
    () => defaultTrackForGoal(profile.primaryGoal),
    [profile.primaryGoal],
  );

  // Compute today's queue
  const queue = useMemo(
    () => recommendDaily(FOUNDATION_SEED, profile, { n: profile.sessionSize }),
    [profile],
  );

  // Progress = mastered ASUs in the track / total ASUs in the track
  const progress = useMemo(() => {
    const trackPool = FOUNDATION_SEED.filter((s) =>
      track.required_tags.every((t: string) => s.tags.includes(t as any)),
    );
    const states = loadAllSkillStates();
    let mastered = 0;
    const now = new Date().toISOString();
    for (const s of trackPool) {
      const st = states[s.id];
      if (!st) continue;
      if (decayedStrength(st, now) >= 0.7) mastered++;
    }
    return {
      mastered,
      total: trackPool.length,
      pct: trackPool.length === 0 ? 0 : (mastered / trackPool.length) * 100,
    };
  }, [track]);

  return (
    <motion.section
      className="ll-path-hero"
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="ll-path-hero-head">
        <span className="ll-path-eyebrow">Lộ trình của bạn</span>
        <h2 className="ll-path-title">{track.name_vi}</h2>
        <p className="ll-path-desc">{track.description_vi}</p>
      </header>

      <div className="ll-path-progress">
        <div className="ll-path-progress-bar">
          <div
            className="ll-path-progress-fill"
            style={{ width: `${Math.min(100, progress.pct)}%` }}
          />
        </div>
        <span className="ll-path-progress-text">
          {progress.mastered} / {progress.total} kỹ năng đã thành thạo
          <span className="ll-path-progress-pct">
            {" "}·{" "}{progress.pct.toFixed(0)}%
          </span>
        </span>
      </div>

      <div className="ll-path-today">
        <span className="ll-path-today-label">
          Hôm nay → {queue.length} kỹ năng được đề xuất
        </span>
        <div className="ll-path-today-chips">
          {queue.slice(0, 5).map((s) => (
            <SkillChip key={s.id} skill={s} />
          ))}
          {queue.length > 5 && (
            <span className="ll-path-today-more">
              +{queue.length - 5} nữa
            </span>
          )}
        </div>
      </div>

      <div className="ll-path-cta-row">
        <button
          type="button"
          className="ll-path-cta-primary"
          onClick={() => onStartSession(queue)}
          disabled={queue.length === 0}
        >
          {queue.length === 0
            ? "Chưa có kỹ năng đề xuất"
            : "Bắt đầu phiên học hôm nay →"}
        </button>
      </div>
    </motion.section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   When the user has NOT done placement yet
   ────────────────────────────────────────────────────────────────── */

function PlacementCta() {
  return (
    <motion.section
      className="ll-path-hero ll-path-hero--empty"
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <header className="ll-path-hero-head">
        <span className="ll-path-eyebrow">Bắt đầu</span>
        <h2 className="ll-path-title">Tạo lộ trình của riêng bạn</h2>
        <p className="ll-path-desc">
          Làm bài kiểm tra ngắn (5 phút) để chúng tôi hiểu trình độ + mục tiêu,
          sau đó sẽ chọn 5-7 bài học mỗi ngày phù hợp với bạn.
        </p>
      </header>
      <div className="ll-path-cta-row">
        <Link href="/placement" className="ll-path-cta-primary" prefetch>
          Làm test xếp lớp →
        </Link>
      </div>
    </motion.section>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Skill chip — tiny preview of a single ASU
   ────────────────────────────────────────────────────────────────── */

function SkillChip({ skill }: { skill: SkillUnit }) {
  const icon = SKILL_TYPE_ICON[skill.payload.type] ?? "✦";
  const label = SKILL_TYPE_LABEL[skill.payload.type] ?? skill.payload.type;
  const preview = previewText(skill);

  return (
    <span className="ll-skill-chip" title={preview}>
      <span className="ll-skill-chip-icon" aria-hidden="true">{icon}</span>
      <span className="ll-skill-chip-label">{label}</span>
      <span className="ll-skill-chip-preview">{preview}</span>
    </span>
  );
}

function previewText(s: SkillUnit): string {
  switch (s.payload.type) {
    case "vocab":         return s.payload.word;
    case "phrase":        return s.payload.phrase_en;
    case "grammar":       return s.payload.rule_title_vi;
    case "listening":     return s.payload.question_vi;
    case "pronunciation": return s.payload.target_text_en;
    case "reading":       return s.payload.passage_en.slice(0, 40) + "…";
    case "writing":       return s.payload.prompt_vi.slice(0, 40) + "…";
    default:              return s.id;
  }
}

const SKILL_TYPE_ICON: Record<string, string> = {
  vocab: "📝",
  phrase: "💬",
  grammar: "📐",
  listening: "👂",
  pronunciation: "🗣️",
  reading: "📖",
  writing: "✍️",
};

const SKILL_TYPE_LABEL: Record<string, string> = {
  vocab: "Từ vựng",
  phrase: "Cụm từ",
  grammar: "Ngữ pháp",
  listening: "Nghe",
  pronunciation: "Phát âm",
  reading: "Đọc",
  writing: "Viết",
};
