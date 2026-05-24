"use client";

/**
 * Path: apps/web/app/placement/_components/calibration-screen.tsx
 *
 * Stage 5 of Placement v2 — calibration.
 * 3 quick questions that DETECT error patterns. Skippable.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  detectErrorPatterns,
  pickCalibrationSet,
} from "../_lib/calibration-bank";
import type {
  CEFRLevel,
  CalibrationAnswer,
  CalibrationQuestion,
  ErrorPattern,
} from "../_lib/types";

type Props = {
  level: CEFRLevel;
  onDone: (answers: CalibrationAnswer[], patterns: ErrorPattern[]) => void;
  onSkip: () => void;
};

export default function CalibrationScreen({ level, onDone, onSkip }: Props) {
  const [questions] = useState<CalibrationQuestion[]>(() =>
    pickCalibrationSet(level, 3),
  );
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<CalibrationAnswer[]>([]);
  const [showExplain, setShowExplain] = useState(false);

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setShowExplain(true);
    const correct = i === q.answerIndex;
    setAnswers((prev) => [
      ...prev,
      { questionId: q.id, detectsIfWrong: q.detectsIfWrong, correct },
    ]);
  };

  const handleNext = () => {
    if (isLast) {
      const patterns = detectErrorPatterns(answers);
      onDone(answers, patterns);
    } else {
      setIdx((i) => i + 1);
      setSelected(null);
      setShowExplain(false);
    }
  };

  return (
    <motion.div
      className="pv2-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="pv2-step-badge">Bước 4 / 4 · Hiệu chỉnh</div>

      <div className="pv2-inner" style={{ maxWidth: 680 }}>
        <header className="pv2-head">
          <div className="pv2-cal-meta">
            <span style={{ flex: 1 }} />
            <button type="button" className="pv2-cal-skip" onClick={onSkip}>
              Bỏ qua →
            </button>
          </div>
          <h1>Vài câu cuối để hiểu bạn rõ hơn</h1>
          <p>
            Không tính điểm. Câu nào sai chỉ giúp chúng tôi{" "}
            <strong>biết phần nào bạn cần ôn nhiều hơn</strong>.
          </p>
          <div className="pv2-cal-bar">
            <div
              className="pv2-cal-bar-fill"
              style={{
                width: `${((idx + (selected !== null ? 1 : 0)) / questions.length) * 100}%`,
              }}
            />
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            className="pv2-cal-card"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div className="pv2-cal-q">{q.prompt}</div>
            <div className="pv2-cal-opts">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.answerIndex;
                const isPicked = i === selected;
                const showResult = selected !== null;
                const cls = ["pv2-cal-opt"];
                if (showResult && isPicked && isCorrect) cls.push("is-correct");
                if (showResult && isPicked && !isCorrect) cls.push("is-wrong");
                if (showResult && !isPicked && isCorrect) cls.push("is-was-correct");
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls.join(" ")}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                  >
                    <span className="pv2-cal-opt-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {showExplain && (
              <motion.div
                className="pv2-cal-explain"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span>💡</span>
                <span>{q.explainVi}</span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {selected !== null && (
          <motion.div
            style={{ display: "flex", justifyContent: "flex-end" }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <button type="button" className="pv2-cta" onClick={handleNext}>
              {isLast ? "Hoàn tất →" : "Câu tiếp theo →"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
