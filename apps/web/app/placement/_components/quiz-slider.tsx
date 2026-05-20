"use client";

/**
 * Path: apps/web/app/placement/_components/quiz-slider.tsx
 *
 * Adaptive 5-cau quiz:
 * - Bat dau B1
 * - Dung => level up, sai => level down
 * - 5 cau du de hoi tu CEFR
 * - Slide horizontal giua cac cau (Tinder-like)
 * - Progress bar tren cung
 * - Bam dap an => show explain ngan 1.2s => slide tiep
 */

import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pickQuestion } from "../_lib/question-bank";
import { levelUp, levelDown } from "../_lib/types";
import type {
  CEFRLevel,
  PlacementAnswer,
  PlacementQuestion,
  SkillScores,
} from "../_lib/types";

interface Props {
  onDone: (
    level: CEFRLevel,
    answers: PlacementAnswer[],
    skillScores: SkillScores
  ) => void;
}

const TOTAL_QUESTIONS = 5;
const START_LEVEL: CEFRLevel = "B1";

function speakText(text: string) {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  synth.speak(u);
}

export default function QuizSlider({ onDone }: Props) {
  const initialQuestion = useMemo(
    () => pickQuestion(START_LEVEL, []) ?? pickQuestion("A2", []),
    []
  );
  const [currentLevel, setCurrentLevel] = useState<CEFRLevel>(START_LEVEL);
  const [currentQuestion, setCurrentQuestion] = useState<PlacementQuestion | null>(
    initialQuestion
  );
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);
  const [showExplain, setShowExplain] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  if (!currentQuestion) {
    return <div style={{ color: "white", padding: 40 }}>Khong co cau hoi.</div>;
  }

  const handleSelect = (optionIdx: number) => {
    if (selected !== null) return;
    setSelected(optionIdx);

    const correct = optionIdx === currentQuestion.answerIndex;
    const timeMs = Date.now() - startTimeRef.current;

    const answer: PlacementAnswer = {
      questionId: currentQuestion.id,
      level: currentQuestion.level,
      skill: currentQuestion.skill,
      selectedIndex: optionIdx,
      correct,
      timeMs,
    };
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setShowExplain(true);

    setTimeout(() => {
      const nextStep = step + 1;
      if (nextStep >= TOTAL_QUESTIONS) {
        finish(nextAnswers);
        return;
      }
      // adaptive: dung => kho hon, sai => de hon
      const nextLevel = correct ? levelUp(currentLevel) : levelDown(currentLevel);
      const excludeIds = nextAnswers.map((a) => a.questionId);
      const nextQ = pickQuestion(nextLevel, excludeIds);

      setCurrentLevel(nextLevel);
      setCurrentQuestion(nextQ);
      setStep(nextStep);
      setSelected(null);
      setShowExplain(false);
      startTimeRef.current = Date.now();
    }, 1300);
  };

  const finish = (allAnswers: PlacementAnswer[]) => {
    // Compute final level: weighted avg of question levels for correct answers
    const correctLevels = allAnswers.filter((a) => a.correct).map((a) => a.level);
    const levelMap: Record<CEFRLevel, number> = {
      A1: 1,
      A2: 2,
      B1: 3,
      B2: 4,
      C1: 5,
      C2: 6,
    };
    const reverseMap: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

    let finalLevel: CEFRLevel;
    if (correctLevels.length === 0) {
      finalLevel = "A1";
    } else {
      const avg =
        correctLevels.reduce((sum, l) => sum + levelMap[l], 0) /
        correctLevels.length;
      const idx = Math.round(avg) - 1;
      finalLevel = reverseMap[Math.max(0, Math.min(5, idx))];
    }

    // Skill scores: % correct per skill
    const skills: (keyof SkillScores)[] = ["grammar", "listening", "vocab", "speaking"];
    const skillScores: SkillScores = { grammar: 0, listening: 0, vocab: 0, speaking: 0 };
    skills.forEach((s) => {
      const items = allAnswers.filter((a) => a.skill === s);
      if (items.length === 0) {
        skillScores[s] = -1; // not tested
      } else {
        const correctCount = items.filter((a) => a.correct).length;
        skillScores[s] = Math.round((correctCount / items.length) * 100);
      }
    });

    setTimeout(() => onDone(finalLevel, allAnswers, skillScores), 300);
  };

  const progress = ((step + (selected !== null ? 1 : 0)) / TOTAL_QUESTIONS) * 100;

  return (
    <motion.div
      className="quiz-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top progress */}
      <div className="quiz-top">
        <div className="quiz-meta">
          <span className="quiz-step">
            Câu <strong>{step + 1}</strong> / {TOTAL_QUESTIONS}
          </span>
          <span className="quiz-level-badge">{currentQuestion.level}</span>
        </div>
        <div className="quiz-progress">
          <motion.div
            className="quiz-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="quiz-stage">
        <AnimatePresence mode="wait" custom={step}>
          <motion.div
            key={currentQuestion.id}
            className="quiz-card"
            custom={step}
            initial={{ x: 120, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -120, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="quiz-tag">
              <span className="quiz-tag-skill">{labelForSkill(currentQuestion.skill)}</span>
              <span className="quiz-tag-dot">·</span>
              <span className="quiz-tag-type">{labelForType(currentQuestion.type)}</span>
            </div>

            <h2 className="quiz-prompt">{currentQuestion.prompt}</h2>

            {currentQuestion.audioText && (
              <button
                className="quiz-audio"
                onClick={() => speakText(currentQuestion.audioText!)}
                aria-label="Phát âm thanh"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 5L6 9H2v6h4l5 4V5z"
                    fill="currentColor"
                  />
                  <path
                    d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Nghe lại</span>
              </button>
            )}

            <div className="quiz-options">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = i === currentQuestion.answerIndex;
                const showState = selected !== null;
                let stateClass = "";
                if (showState) {
                  if (isCorrect) stateClass = "is-correct";
                  else if (isSelected) stateClass = "is-wrong";
                  else stateClass = "is-dim";
                }
                return (
                  <button
                    key={i}
                    className={`quiz-option ${stateClass}`}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                  >
                    <span className="quiz-option-bullet">{String.fromCharCode(65 + i)}</span>
                    <span className="quiz-option-text">{opt}</span>
                    {showState && isCorrect && (
                      <svg
                        className="quiz-option-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {showState && isSelected && !isCorrect && (
                      <svg
                        className="quiz-option-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {showExplain && (
                <motion.div
                  className="quiz-explain"
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="quiz-explain-dot" />
                  <p>{currentQuestion.explainVi}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <style jsx>{`
        .quiz-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          padding: 0;
        }

        .quiz-top {
          padding: 28px 32px 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quiz-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .quiz-step {
          font-size: 13px;
          letter-spacing: 0.04em;
          color: rgba(240, 255, 245, 0.6);
        }
        .quiz-step strong {
          color: #f0fff5;
          font-weight: 600;
        }

        .quiz-level-badge {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(92, 255, 163, 0.12);
          border: 1px solid rgba(92, 255, 163, 0.3);
          color: #5cffa3;
        }

        .quiz-progress {
          height: 3px;
          background: rgba(240, 255, 245, 0.08);
          border-radius: 2px;
          overflow: hidden;
        }
        .quiz-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #5cffa3, #8bff9e);
          border-radius: 2px;
          box-shadow: 0 0 12px rgba(92, 255, 163, 0.6);
        }

        .quiz-stage {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          overflow: hidden;
        }

        .quiz-card {
          width: min(640px, 100%);
          background: rgba(20, 87, 58, 0.22);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(140, 255, 158, 0.18);
          border-radius: 22px;
          padding: 32px 28px 28px;
          box-shadow: 0 12px 50px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .quiz-tag {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(140, 255, 158, 0.7);
          margin-bottom: 14px;
        }
        .quiz-tag-dot {
          opacity: 0.5;
        }

        .quiz-prompt {
          font-size: 22px;
          font-weight: 500;
          line-height: 1.35;
          color: #f0fff5;
          margin: 0 0 20px 0;
          letter-spacing: -0.01em;
        }

        .quiz-audio {
          appearance: none;
          background: rgba(92, 255, 163, 0.1);
          border: 1px solid rgba(92, 255, 163, 0.25);
          color: #5cffa3;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          margin-bottom: 18px;
          transition: all 200ms ease;
        }
        .quiz-audio:hover {
          background: rgba(92, 255, 163, 0.18);
          border-color: rgba(92, 255, 163, 0.5);
        }

        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quiz-option {
          appearance: none;
          background: rgba(240, 255, 245, 0.05);
          border: 1px solid rgba(240, 255, 245, 0.1);
          color: #f0fff5;
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 200ms ease;
        }
        .quiz-option:hover:not(:disabled) {
          background: rgba(240, 255, 245, 0.1);
          border-color: rgba(140, 255, 158, 0.4);
          transform: translateX(4px);
        }
        .quiz-option:disabled {
          cursor: default;
        }
        .quiz-option.is-correct {
          background: rgba(92, 255, 163, 0.18);
          border-color: rgba(92, 255, 163, 0.6);
          color: #d8ffe8;
        }
        .quiz-option.is-wrong {
          background: rgba(255, 107, 107, 0.15);
          border-color: rgba(255, 107, 107, 0.5);
          color: #ffd6d6;
        }
        .quiz-option.is-dim {
          opacity: 0.4;
        }

        .quiz-option-bullet {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(240, 255, 245, 0.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0;
        }
        .quiz-option.is-correct .quiz-option-bullet {
          background: rgba(92, 255, 163, 0.3);
          color: #d8ffe8;
        }
        .quiz-option.is-wrong .quiz-option-bullet {
          background: rgba(255, 107, 107, 0.25);
          color: #ffd6d6;
        }

        .quiz-option-text {
          flex: 1;
          line-height: 1.4;
        }

        .quiz-option-icon {
          flex-shrink: 0;
          color: currentColor;
        }

        .quiz-explain {
          margin-top: 18px;
          padding: 12px 14px;
          background: rgba(92, 255, 163, 0.08);
          border-left: 2px solid #5cffa3;
          border-radius: 8px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }
        .quiz-explain-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #5cffa3;
          margin-top: 8px;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(92, 255, 163, 0.7);
        }
        .quiz-explain p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          color: rgba(240, 255, 245, 0.85);
        }

        @media (max-width: 640px) {
          .quiz-top {
            padding: 20px 20px 0;
          }
          .quiz-card {
            padding: 24px 20px 20px;
          }
          .quiz-prompt {
            font-size: 18px;
          }
        }
      `}</style>
    </motion.div>
  );
}

function labelForSkill(skill: string) {
  switch (skill) {
    case "grammar":
      return "Ngữ pháp";
    case "vocab":
      return "Từ vựng";
    case "listening":
      return "Nghe";
    case "speaking":
      return "Phản xạ";
    default:
      return skill;
  }
}

function labelForType(type: string) {
  switch (type) {
    case "grammar":
      return "Sửa câu";
    case "vocab":
      return "Nghĩa từ";
    case "listening":
      return "Audio";
    case "fill_blank":
      return "Điền vào";
    case "natural":
      return "Tự nhiên";
    default:
      return type;
  }
}
