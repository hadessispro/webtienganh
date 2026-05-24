"use client";

/**
 * Path: apps/web/app/placement/_components/goal-context-screen.tsx
 *
 * Stage 2 of Placement v2 — narrow down the goal.
 *
 * Branches on primaryGoal:
 *   work       → grid of 10 industries (single-pick)
 *   exam       → list of 5 exams + target-score slider
 *   foundation → multi-select 5 weak skills
 *   travel     → multi-select 5 focus situations
 *   other      → free text note
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  EXAMS,
  FOUNDATION_WEAKNESSES,
  INDUSTRIES,
  TRAVEL_FOCUSES,
  type ExamType,
  type FoundationWeakness,
  type GoalContext,
  type PrimaryGoal,
  type TravelFocus,
} from "../_lib/types";

type Props = {
  primaryGoal: PrimaryGoal;
  onPick: (context: GoalContext) => void;
  onBack: () => void;
};

const HEADINGS: Record<PrimaryGoal, { title: string; sub: string }> = {
  work: {
    title: "Bạn làm ngành nào?",
    sub: "Chúng tôi sẽ ưu tiên từ vựng và mẫu câu liên quan đến công việc của bạn.",
  },
  exam: {
    title: "Bạn thi gì? Mục tiêu bao nhiêu?",
    sub: "Cho chúng tôi biết để tập trung dạng đề phù hợp.",
  },
  foundation: {
    title: "Phần nào bạn cảm thấy yếu nhất?",
    sub: "Có thể chọn nhiều phần. Chúng tôi sẽ ưu tiên ôn các điểm đó trước.",
  },
  travel: {
    title: "Bạn muốn giao tiếp về?",
    sub: "Chọn các tình huống bạn thường gặp khi đi du lịch.",
  },
  other: {
    title: "Mô tả thêm về mục tiêu của bạn",
    sub: "Bạn có thể bỏ qua nếu muốn — chúng tôi vẫn sẽ tạo lộ trình phù hợp.",
  },
};

export default function GoalContextScreen({ primaryGoal, onPick, onBack }: Props) {
  const heading = HEADINGS[primaryGoal];

  return (
    <motion.div
      className="pv2-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button type="button" className="pv2-back" onClick={onBack}>
        ← Quay lại
      </button>
      <div className="pv2-step-badge">Bước 2 / 4</div>

      <div className="pv2-inner">
        <motion.header
          className="pv2-head"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h1>{heading.title}</h1>
          <p>{heading.sub}</p>
        </motion.header>

        {primaryGoal === "work" && <WorkBranch onPick={onPick} />}
        {primaryGoal === "exam" && <ExamBranch onPick={onPick} />}
        {primaryGoal === "foundation" && <FoundationBranch onPick={onPick} />}
        {primaryGoal === "travel" && <TravelBranch onPick={onPick} />}
        {primaryGoal === "other" && <OtherBranch onPick={onPick} />}
      </div>
    </motion.div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Sub-branches
   ──────────────────────────────────────────────────────────────────── */

function WorkBranch({ onPick }: { onPick: (ctx: GoalContext) => void }) {
  return (
    <motion.div
      className="pv2-pill-grid"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {INDUSTRIES.map((ind) => (
        <motion.button
          key={ind.id}
          type="button"
          className="pv2-pill"
          onClick={() => onPick({ kind: "work", industry: ind.id })}
          variants={{
            hidden: { y: 20, opacity: 0 },
            visible: { y: 0, opacity: 1 },
          }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="pv2-pill-emoji">{ind.emoji}</span>
          <span>{ind.vi}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}

function ExamBranch({ onPick }: { onPick: (ctx: GoalContext) => void }) {
  const [examId, setExamId] = useState<ExamType | null>(null);
  const exam = EXAMS.find((e) => e.id === examId);
  const [target, setTarget] = useState<number>(exam?.defaultTarget ?? 70);

  const handleSelectExam = (id: ExamType) => {
    setExamId(id);
    const e = EXAMS.find((x) => x.id === id)!;
    setTarget(e.defaultTarget);
  };

  const scaledByTen = exam && (exam.id === "ielts" || exam.id === "vstep");
  const displayTarget = exam
    ? scaledByTen
      ? (target / 10).toFixed(1)
      : `${target}`
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      <div className="pv2-pill-grid">
        {EXAMS.map((e) => {
          const active = examId === e.id;
          return (
            <button
              key={e.id}
              type="button"
              className={`pv2-pill ${active ? "is-active" : ""}`}
              onClick={() => handleSelectExam(e.id)}
            >
              <span>{e.vi}</span>
              {active && <span className="pv2-pill-check">✓</span>}
            </button>
          );
        })}
      </div>

      {exam && (
        <motion.div
          className="pv2-exam-target"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <label>
            Mục tiêu điểm:
            <strong>{displayTarget}</strong>
          </label>
          <input
            type="range"
            min={0}
            max={exam.max}
            step={scaledByTen ? 0.5 : 10}
            value={scaledByTen ? target / 10 : target}
            onChange={(e) => {
              const v = Number(e.target.value);
              setTarget(scaledByTen ? v * 10 : v);
            }}
          />
          <button
            type="button"
            className="pv2-cta"
            style={{ alignSelf: "flex-end" }}
            onClick={() =>
              onPick({ kind: "exam", exam: exam.id, targetScore: target })
            }
          >
            Tiếp theo →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function FoundationBranch({ onPick }: { onPick: (ctx: GoalContext) => void }) {
  const [picked, setPicked] = useState<Set<FoundationWeakness>>(new Set());
  const toggle = (id: FoundationWeakness) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };
  const submit = () =>
    onPick({ kind: "foundation", weaknesses: Array.from(picked) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      <div className="pv2-pill-grid">
        {FOUNDATION_WEAKNESSES.map((w) => {
          const active = picked.has(w.id);
          return (
            <button
              key={w.id}
              type="button"
              className={`pv2-pill ${active ? "is-active" : ""}`}
              onClick={() => toggle(w.id)}
            >
              <span className="pv2-pill-emoji">{w.emoji}</span>
              <span>{w.vi}</span>
              {active && <span className="pv2-pill-check">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="pv2-foot">
        <span className="pv2-foot-hint">
          {picked.size === 0 ? "Chọn ít nhất 1 để tiếp tục" : `Đã chọn ${picked.size}`}
        </span>
        <button
          type="button"
          className="pv2-cta"
          disabled={picked.size === 0}
          onClick={submit}
        >
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}

function TravelBranch({ onPick }: { onPick: (ctx: GoalContext) => void }) {
  const [picked, setPicked] = useState<Set<TravelFocus>>(new Set());
  const toggle = (id: TravelFocus) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };
  const submit = () =>
    onPick({ kind: "travel", focuses: Array.from(picked) });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
      <div className="pv2-pill-grid">
        {TRAVEL_FOCUSES.map((f) => {
          const active = picked.has(f.id);
          return (
            <button
              key={f.id}
              type="button"
              className={`pv2-pill ${active ? "is-active" : ""}`}
              onClick={() => toggle(f.id)}
            >
              <span className="pv2-pill-emoji">{f.emoji}</span>
              <span>{f.vi}</span>
              {active && <span className="pv2-pill-check">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="pv2-foot">
        <span className="pv2-foot-hint">
          {picked.size === 0 ? "Chọn ít nhất 1 để tiếp tục" : `Đã chọn ${picked.size}`}
        </span>
        <button
          type="button"
          className="pv2-cta"
          disabled={picked.size === 0}
          onClick={submit}
        >
          Tiếp theo →
        </button>
      </div>
    </div>
  );
}

function OtherBranch({ onPick }: { onPick: (ctx: GoalContext) => void }) {
  const [note, setNote] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <textarea
        className="pv2-textarea"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ví dụ: Tôi muốn đọc sách kỹ thuật bằng tiếng Anh, hay tôi muốn xem phim không phụ đề..."
        rows={4}
      />
      <button
        type="button"
        className="pv2-cta"
        style={{ alignSelf: "flex-end" }}
        onClick={() =>
          onPick({ kind: "other", note: note.trim() || undefined })
        }
      >
        Tiếp theo →
      </button>
    </div>
  );
}
