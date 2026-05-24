"use client";

/**
 * Path: apps/web/app/placement/_components/time-budget-screen.tsx
 *
 * Stage 3 of Placement v2 — how much time per day?
 */

import { motion } from "framer-motion";
import { DAILY_OPTIONS, type DailyMinutes } from "../_lib/types";

type Props = {
  onPick: (minutes: DailyMinutes) => void;
  onBack: () => void;
};

export default function TimeBudgetScreen({ onPick, onBack }: Props) {
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
      <div className="pv2-step-badge">Bước 3 / 4</div>

      <div className="pv2-inner">
        <motion.header
          className="pv2-head"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h1>Mỗi ngày bạn có bao nhiêu phút để học?</h1>
          <p>
            Hãy chọn mức bạn <strong>thực sự</strong> duy trì được, đừng
            chọn mức lý tưởng. Học ít nhưng đều quan trọng hơn nhiều.
          </p>
        </motion.header>

        <div className="pv2-card-grid">
          {DAILY_OPTIONS.map((opt, idx) => (
            <motion.button
              key={opt.id}
              type="button"
              className="pv2-card"
              onClick={() => onPick(opt.id)}
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + idx * 0.07, duration: 0.45 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="pv2-card-emoji" aria-hidden="true">
                {opt.emoji}
              </span>
              <span className="pv2-card-title">{opt.vi}</span>
              <span className="pv2-card-desc">{opt.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
