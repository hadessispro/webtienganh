"use client";

/**
 * Path: apps/web/app/components/CoursesViewV2.tsx
 *
 * The new "Khóa học" tab. Replaces the legacy 13-course grid with a
 * 3-zone personalized layout:
 *
 *   Zone 1 — LearnPathHero (top): the user's main track + today's queue
 *   Zone 2 — Topic packs (middle): browseable extras
 *   Zone 3 — Adjust settings (bottom): re-run placement, change goal
 *
 * When the user clicks "Bắt đầu phiên học", we render a SessionPlayer
 * full-screen modal-style. Exiting goes back to this view.
 */

import { useState } from "react";
import Link from "next/link";

import { LearnPathHero } from "./LearnPathHero";
import { SessionPlayer } from "./SessionPlayer";
import { TRACK_TEMPLATES } from "../lib/track-templates";
import type { SkillUnit } from "../lib/skill-units";

export function CoursesViewV2() {
  const [activeQueue, setActiveQueue] = useState<SkillUnit[] | null>(null);

  if (activeQueue) {
    return (
      <SessionPlayer
        queue={activeQueue}
        onExit={() => setActiveQueue(null)}
      />
    );
  }

  return (
    <div className="ll-courses-v2">
      {/* ─── Zone 1 — Personalized hero ─── */}
      <LearnPathHero onStartSession={(q) => setActiveQueue(q)} />

      {/* ─── Zone 2 — Topic packs ─── */}
      <section className="ll-topic-packs">
        <header className="ll-topic-packs-head">
          <h3>Khám phá thêm</h3>
          <p>Các chủ đề bạn có thể học thêm song song với lộ trình chính.</p>
        </header>
        <div className="ll-topic-packs-grid">
          {TRACK_TEMPLATES.map((t) => (
            <article key={t.id} className="ll-topic-pack">
              <div className="ll-topic-pack-meta">
                <span className="ll-topic-pack-level">
                  {t.cefr_range.join(" → ")}
                </span>
                <span className="ll-topic-pack-hours">
                  ~{t.estimated_hours}h
                </span>
              </div>
              <h4 className="ll-topic-pack-name">{t.name_vi}</h4>
              <p className="ll-topic-pack-desc">{t.description_vi}</p>
              <button type="button" className="ll-topic-pack-cta" disabled>
                Sắp ra mắt
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Zone 3 — Adjust settings ─── */}
      <section className="ll-path-adjust">
        <h3>Điều chỉnh lộ trình</h3>
        <p>Đổi mục tiêu, ngành nghề hoặc cường độ học bất kỳ lúc nào.</p>
        <Link href="/placement" className="ll-path-adjust-cta">
          Cập nhật hồ sơ học tập →
        </Link>
      </section>
    </div>
  );
}
