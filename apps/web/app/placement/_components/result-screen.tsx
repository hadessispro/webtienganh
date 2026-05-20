"use client";

/**
 * Path: apps/web/app/placement/_components/result-screen.tsx
 *
 * Reveal level + skill chart radar + CTA "Mo dashboard hoc".
 * Animation: level number zoom-in with glow, skill bars stagger fill.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CEFR_LABELS } from "../_lib/types";
import type { CEFRLevel, SkillScores } from "../_lib/types";

interface Props {
  level: CEFRLevel;
  skillScores: SkillScores;
  onRestart: () => void;
  /** If true, show test-derived score breakdown. If false (picked directly), show simpler view. */
  isFromQuiz: boolean;
}

const PATH_LABELS: Record<CEFRLevel, string> = {
  A1: "Work Talk Starter A1",
  A2: "Work Talk Elementary A2",
  B1: "Office English B1",
  B2: "Professional English B2",
  C1: "Business Fluency C1",
  C2: "Native-like C2",
};

const PATH_DESCRIPTIONS: Record<CEFRLevel, string> = {
  A1: "Câu chào hỏi công việc, tự giới thiệu, cập nhật việc đơn giản và phản xạ nghe chậm.",
  A2: "Email ngắn, họp hằng tuần, trả lời câu hỏi thường gặp trong văn phòng.",
  B1: "Họp nội bộ, cập nhật tiến độ, đàm phán đơn giản và viết email rõ ý.",
  B2: "Trình bày ý kiến, phản biện lịch sự, viết báo cáo và email khách hàng.",
  C1: "Thuyết trình thuyết phục, đàm phán phức tạp, viết tài liệu chuyên môn.",
  C2: "Diễn đạt như native, viết học thuật, đàm phán cấp lãnh đạo.",
};

export default function ResultScreen({ level, skillScores, onRestart, isFromQuiz }: Props) {
  const [animBars, setAnimBars] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimBars(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleOpenDashboard = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "lumalang:placement",
          JSON.stringify({
            level,
            skillScores,
            completedAt: new Date().toISOString(),
            via: isFromQuiz ? "quiz" : "pick",
          })
        );
      } catch (e) {
        console.warn("[placement] could not persist", e);
      }
      window.location.href = "/app/dashboard";
    }
  };

  return (
    <motion.div
      className="result-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="result-eyebrow"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {isFromQuiz ? "Kết quả test" : "Lộ trình của bạn"}
      </motion.div>

      <motion.div
        className="result-level-block"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.9,
          delay: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <div className="result-level-glow" />
        <h1 className="result-level">{level}</h1>
        <p className="result-level-name">{CEFR_LABELS[level].vi}</p>
      </motion.div>

      <motion.div
        className="result-path"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.55 }}
      >
        <p className="result-path-eyebrow">Mở khóa</p>
        <h2 className="result-path-name">{PATH_LABELS[level]}</h2>
        <p className="result-path-desc">{PATH_DESCRIPTIONS[level]}</p>
      </motion.div>

      {isFromQuiz && (
        <motion.div
          className="result-skills"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.75 }}
        >
          {(["grammar", "vocab", "listening", "speaking"] as const).map((s, i) => {
            const score = skillScores[s];
            const label = LABELS[s];
            const valid = score >= 0;
            return (
              <div key={s} className="skill-row">
                <div className="skill-row-head">
                  <span className="skill-name">{label}</span>
                  <span className="skill-pct">{valid ? `${score}%` : "—"}</span>
                </div>
                <div className="skill-bar">
                  <motion.div
                    className="skill-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: animBars ? `${valid ? score : 0}%` : 0 }}
                    transition={{
                      duration: 0.9,
                      delay: 0.85 + i * 0.08,
                      ease: "easeOut",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      <motion.div
        className="result-actions"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <button className="result-cta" onClick={handleOpenDashboard}>
          <span>Mở dashboard học</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button className="result-restart" onClick={onRestart}>
          Làm lại
        </button>
      </motion.div>

      <style jsx>{`
        .result-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          gap: 18px;
          overflow-y: auto;
        }

        .result-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #5cffa3;
        }

        .result-level-block {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 36px;
        }

        .result-level-glow {
          position: absolute;
          inset: -30px;
          background: radial-gradient(
            circle,
            rgba(92, 255, 163, 0.35) 0%,
            transparent 60%
          );
          filter: blur(20px);
          z-index: -1;
        }

        .result-level {
          font-size: 96px;
          font-weight: 600;
          line-height: 1;
          color: #f0fff5;
          margin: 0;
          letter-spacing: -0.04em;
          background: linear-gradient(180deg, #ffffff 0%, #5cffa3 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 40px rgba(92, 255, 163, 0.4);
        }

        .result-level-name {
          font-size: 14px;
          font-weight: 400;
          color: rgba(240, 255, 245, 0.7);
          margin: 0;
          letter-spacing: 0.04em;
        }

        .result-path {
          text-align: center;
          max-width: 480px;
          background: rgba(20, 87, 58, 0.22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(140, 255, 158, 0.18);
          border-radius: 18px;
          padding: 18px 24px;
        }
        .result-path-eyebrow {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.24em;
          color: rgba(140, 255, 158, 0.7);
          text-transform: uppercase;
          margin: 0 0 6px 0;
        }
        .result-path-name {
          font-size: 18px;
          font-weight: 600;
          color: #f0fff5;
          margin: 0 0 8px 0;
          letter-spacing: -0.01em;
        }
        .result-path-desc {
          font-size: 13.5px;
          line-height: 1.5;
          color: rgba(240, 255, 245, 0.7);
          margin: 0;
        }

        .result-skills {
          width: min(420px, 100%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 6px;
        }

        .skill-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .skill-row-head {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .skill-name {
          color: rgba(240, 255, 245, 0.7);
        }
        .skill-pct {
          color: #5cffa3;
          font-weight: 600;
        }
        .skill-bar {
          height: 4px;
          background: rgba(240, 255, 245, 0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .skill-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #5cffa3, #8bff9e);
          border-radius: 2px;
          box-shadow: 0 0 10px rgba(92, 255, 163, 0.6);
        }

        .result-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }

        .result-cta {
          appearance: none;
          background: linear-gradient(135deg, #5cffa3 0%, #8bff9e 100%);
          border: none;
          color: #052010;
          padding: 14px 32px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 220ms ease;
          box-shadow: 0 10px 30px rgba(92, 255, 163, 0.4);
        }
        .result-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 16px 40px rgba(92, 255, 163, 0.55);
        }

        .result-restart {
          appearance: none;
          background: transparent;
          border: none;
          color: rgba(240, 255, 245, 0.55);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 6px 12px;
          transition: color 200ms ease;
        }
        .result-restart:hover {
          color: rgba(240, 255, 245, 0.85);
        }
      `}</style>
    </motion.div>
  );
}

const LABELS = {
  grammar: "Ngữ pháp",
  vocab: "Từ vựng",
  listening: "Nghe",
  speaking: "Phản xạ nói",
} as const;
