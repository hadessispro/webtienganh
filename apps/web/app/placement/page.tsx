"use client";

/**
 * Path: apps/web/app/placement/page.tsx
 *
 * Placement v2 — multi-stage flow.
 *
 * Stage machine:
 *   splash  →  why  →  goal-context  →  time  →  picker* / quiz  →  calibration  →  result
 *
 *   * picker is a legacy "skip the quiz" path. Still supported.
 *
 * Each stage owns one screen component in `_components/`. The page is
 * just the reducer + presentation switcher. AnimatePresence wraps the
 * screens so framer-motion can animate stage transitions.
 */

import { useReducer, useCallback } from "react";
import { AnimatePresence } from "framer-motion";

import "./_components/placement-v2.css";

import SplashScreen from "./_components/splash-screen";
import WhyScreen from "./_components/why-screen";
import GoalContextScreen from "./_components/goal-context-screen";
import TimeBudgetScreen from "./_components/time-budget-screen";
import LevelPicker from "./_components/level-picker";
import QuizSlider from "./_components/quiz-slider";
import CalibrationScreen from "./_components/calibration-screen";
import ResultScreen from "./_components/result-screen";

import type {
  CEFRLevel,
  CalibrationAnswer,
  DailyMinutes,
  ErrorPattern,
  GoalContext,
  PlacementAction,
  PlacementAnswer,
  PlacementState,
  PrimaryGoal,
  SkillScores,
} from "./_lib/types";

const initialState: PlacementState = {
  stage: "splash",
  primaryGoal: null,
  goalContext: null,
  dailyMinutes: null,
  selectedLevel: null,
  testedLevel: null,
  answers: [],
  skillScores: { grammar: 0, listening: 0, vocab: 0, speaking: 0 },
  calibrationAnswers: [],
  errorPatterns: [],
};

function reducer(state: PlacementState, action: PlacementAction): PlacementState {
  switch (action.type) {
    case "SPLASH_DONE":
      return { ...state, stage: "why" };

    case "WHY_PICK":
      return { ...state, primaryGoal: action.goal, stage: "goal-context" };

    case "WHY_BACK":
      return { ...state, stage: "splash", primaryGoal: null };

    case "GOAL_CTX_PICK":
      return { ...state, goalContext: action.context, stage: "time" };

    case "GOAL_CTX_BACK":
      return { ...state, stage: "why", goalContext: null };

    case "TIME_PICK":
      return { ...state, dailyMinutes: action.minutes, stage: "picker" };

    case "TIME_BACK":
      return { ...state, stage: "goal-context", dailyMinutes: null };

    case "PICK_LEVEL":
      // Skip-quiz path: jump straight to result.
      return {
        ...state,
        stage: "result",
        selectedLevel: action.level,
        testedLevel: action.level,
      };

    case "START_TEST":
      return { ...state, stage: "quiz" };

    case "QUIZ_DONE":
      // After quiz, go to calibration to detect error patterns
      return {
        ...state,
        stage: "calibration",
        testedLevel: action.level,
        answers: action.answers,
        skillScores: action.skillScores,
      };

    case "CALIBRATION_DONE":
      return {
        ...state,
        stage: "result",
        calibrationAnswers: action.answers,
        errorPatterns: action.patterns,
      };

    case "SKIP_CALIBRATION":
      return {
        ...state,
        stage: "result",
        calibrationAnswers: [],
        errorPatterns: [],
      };

    case "RESTART":
      return initialState;

    default:
      return state;
  }
}

export default function PlacementPage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleSplashDone   = useCallback(() => dispatch({ type: "SPLASH_DONE" }), []);
  const handleWhyPick      = useCallback((goal: PrimaryGoal) => dispatch({ type: "WHY_PICK", goal }), []);
  const handleWhyBack      = useCallback(() => dispatch({ type: "WHY_BACK" }), []);
  const handleGoalCtxPick  = useCallback((context: GoalContext) => dispatch({ type: "GOAL_CTX_PICK", context }), []);
  const handleGoalCtxBack  = useCallback(() => dispatch({ type: "GOAL_CTX_BACK" }), []);
  const handleTimePick     = useCallback((minutes: DailyMinutes) => dispatch({ type: "TIME_PICK", minutes }), []);
  const handleTimeBack     = useCallback(() => dispatch({ type: "TIME_BACK" }), []);
  const handlePickLevel    = useCallback((level: CEFRLevel) => dispatch({ type: "PICK_LEVEL", level }), []);
  const handleStartTest    = useCallback(() => dispatch({ type: "START_TEST" }), []);
  const handleQuizDone     = useCallback(
    (level: CEFRLevel, answers: PlacementAnswer[], skillScores: SkillScores) =>
      dispatch({ type: "QUIZ_DONE", level, answers, skillScores }),
    [],
  );
  const handleCalibDone    = useCallback(
    (answers: CalibrationAnswer[], patterns: ErrorPattern[]) =>
      dispatch({ type: "CALIBRATION_DONE", answers, patterns }),
    [],
  );
  const handleCalibSkip    = useCallback(() => dispatch({ type: "SKIP_CALIBRATION" }), []);
  const handleRestart      = useCallback(() => dispatch({ type: "RESTART" }), []);

  return (
    <main className="placement-root">
      <AnimatePresence mode="wait">
        {state.stage === "splash" && (
          <SplashScreen key="splash" onDone={handleSplashDone} />
        )}
        {state.stage === "why" && (
          <WhyScreen key="why" onPick={handleWhyPick} />
        )}
        {state.stage === "goal-context" && state.primaryGoal && (
          <GoalContextScreen
            key="goal-context"
            primaryGoal={state.primaryGoal}
            onPick={handleGoalCtxPick}
            onBack={handleWhyBack}
          />
        )}
        {state.stage === "time" && (
          <TimeBudgetScreen
            key="time"
            onPick={handleTimePick}
            onBack={handleGoalCtxBack}
          />
        )}
        {state.stage === "picker" && (
          <LevelPicker
            key="picker"
            onPickLevel={handlePickLevel}
            onStartTest={handleStartTest}
          />
        )}
        {state.stage === "quiz" && (
          <QuizSlider key="quiz" onDone={handleQuizDone} />
        )}
        {state.stage === "calibration" && state.testedLevel && (
          <CalibrationScreen
            key="calibration"
            level={state.testedLevel}
            onDone={handleCalibDone}
            onSkip={handleCalibSkip}
          />
        )}
        {state.stage === "result" && (
          <ResultScreen
            key="result"
            level={state.testedLevel!}
            skillScores={state.skillScores}
            onRestart={handleRestart}
            isFromQuiz={state.answers.length > 0}
            primaryGoal={state.primaryGoal}
            goalContext={state.goalContext}
            dailyMinutes={state.dailyMinutes}
            errorPatterns={state.errorPatterns}
          />
        )}
      </AnimatePresence>

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
