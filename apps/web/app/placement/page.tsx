"use client";

/**
 * Placement test flow
 * Path: apps/web/app/placement/page.tsx
 *
 * Stages: splash → level-picker → quiz (adaptive, 5 cau) → result
 *
 * Design notes:
 * - Font Inter toan he thong, KHONG tron serif
 * - Background gradient xanh la deep + glassmorphism
 * - 6 giot nuoc CEFR (A1..C2) + 1 CTA "Lam test nhanh"
 * - Adaptive: bat dau B1, dung => kho hon, sai => de hon
 * - Slide horizontal giua cac cau (framer-motion)
 *
 * Phase: 1 (prototype UX, mock data)
 * Backend: chua co - ket qua chi luu localStorage
 */

import { useReducer, useCallback } from "react";
import SplashScreen from "./_components/splash-screen";
import LevelPicker from "./_components/level-picker";
import QuizSlider from "./_components/quiz-slider";
import ResultScreen from "./_components/result-screen";
import type { CEFRLevel, PlacementState, PlacementAction } from "./_lib/types";

const initialState: PlacementState = {
  stage: "splash",
  selectedLevel: null,
  testedLevel: null,
  answers: [],
  skillScores: { grammar: 0, listening: 0, vocab: 0, speaking: 0 },
};

function reducer(state: PlacementState, action: PlacementAction): PlacementState {
  switch (action.type) {
    case "SPLASH_DONE":
      return { ...state, stage: "picker" };
    case "PICK_LEVEL":
      return {
        ...state,
        stage: "result",
        selectedLevel: action.level,
        testedLevel: action.level,
      };
    case "START_TEST":
      return { ...state, stage: "quiz" };
    case "QUIZ_DONE":
      return {
        ...state,
        stage: "result",
        testedLevel: action.level,
        answers: action.answers,
        skillScores: action.skillScores,
      };
    case "RESTART":
      return initialState;
    default:
      return state;
  }
}

export default function PlacementPage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSplashDone = useCallback(() => dispatch({ type: "SPLASH_DONE" }), []);
  const handlePickLevel = useCallback(
    (level: CEFRLevel) => dispatch({ type: "PICK_LEVEL", level }),
    []
  );
  const handleStartTest = useCallback(() => dispatch({ type: "START_TEST" }), []);
  const handleQuizDone = useCallback(
    (
      level: CEFRLevel,
      answers: PlacementState["answers"],
      skillScores: PlacementState["skillScores"]
    ) => dispatch({ type: "QUIZ_DONE", level, answers, skillScores }),
    []
  );
  const handleRestart = useCallback(() => dispatch({ type: "RESTART" }), []);

  return (
    <main className="placement-root">
      {state.stage === "splash" && <SplashScreen onDone={handleSplashDone} />}
      {state.stage === "picker" && (
        <LevelPicker onPickLevel={handlePickLevel} onStartTest={handleStartTest} />
      )}
      {state.stage === "quiz" && <QuizSlider onDone={handleQuizDone} />}
      {state.stage === "result" && (
        <ResultScreen
          level={state.testedLevel!}
          skillScores={state.skillScores}
          onRestart={handleRestart}
          isFromQuiz={state.answers.length > 0}
        />
      )}

      <style jsx global>{`
        .placement-root {
          position: fixed;
          inset: 0;
          overflow: hidden;
          font-family: var(--font-sans), "Inter", system-ui, sans-serif;
          color: var(--text-primary, #f0fff5);
          background:
            radial-gradient(ellipse at top, #14573a 0%, #0a1f14 45%, #050d08 100%);
        }

        .placement-root * {
          font-family: inherit;
        }
      `}</style>
    </main>
  );
}
