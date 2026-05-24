"use client";

/**
 * Path: apps/web/app/placement/_components/why-screen.tsx
 *
 * Stage 1 of Placement v2 — "Why are you learning?"
 */

import { motion } from "framer-motion";
import { PRIMARY_GOALS, type PrimaryGoal } from "../_lib/types";

type Props = {
  onPick: (goal: PrimaryGoal) => void;
};

export default function WhyScreen({ onPick }: Props) {
  return (
    <motion.div
      className="pv2-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="pv2-step-badge">Bước 1 / 4</div>

      <div className="pv2-inner">
        <motion.header
          className="pv2-head"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h1>Bạn học tiếng Anh vì điều gì?</h1>
          <p>
            Câu trả lời sẽ giúp chúng tôi chọn bài học đúng người, đúng việc.
            Bạn có thể đổi sau.
          </p>
        </motion.header>

        <div className="pv2-card-grid">
          {PRIMARY_GOALS.map((goal, idx) => (
            <motion.button
              key={goal.id}
              type="button"
              className="pv2-card"
              onClick={() => onPick(goal.id)}
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.45 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="pv2-card-emoji" aria-hidden="true">
                {goal.emoji}
              </span>
              <span className="pv2-card-title">{goal.vi}</span>
              <span className="pv2-card-desc">{goal.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
