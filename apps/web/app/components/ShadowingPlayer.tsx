"use client";

/**
 * Path: apps/web/app/components/ShadowingPlayer.tsx
 *
 * Full-screen shadowing player with 4 core features (PR-Shadowing-V3):
 *
 *  1. AUTO-LOOP — when isAutoLoop is on, the player automatically replays
 *     the current segment in a loop until the user passes (score ≥ 70 + low
 *     missed-rate) OR they manually advance. Removes the "click play, record,
 *     click play, record" friction.
 *
 *  2. KARAOKE TRANSCRIPT — the script for the current segment is rendered
 *     INLINE with per-word highlighting:
 *        green   = matched
 *        yellow  = approximate (close pronunciation)
 *        red     = missed
 *        bold    = current word being spoken (from YT currentTime)
 *
 *  3. ASU INTEGRATION — on segment complete, we call
 *     recordShadowingCompletion() so vocab the user is currently studying
 *     gets a small confidence bump when it appears in the clip.
 *
 *  4. WORD-LEVEL FEEDBACK — score panel now shows the actual word list
 *     with each word's status, not just the linear diff.
 *
 * Speech recognition still uses Web Speech API. Browsers that lack it
 * (Firefox, some mobile) get a friendly fallback.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  scoreShadowingAttempt,
  scoreWordsInline,
  shouldAdvance,
  type ShadowScore,
  type WordDiff,
} from "../lib/shadow-score";
import { recordShadowingCompletion } from "../lib/shadowing-link";
import { useYouTubeTime } from "./useYouTubeTime";

interface Segment {
  start: number;
  end: number;
  text_en: string;
  text_vi?: string;
}

interface ShadowingPlayerProps {
  clipId: string;
  youtubeId: string;
  title: string;
  segments: Segment[];
  topicIds: string[];
  onClose: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const AUTOLOOP_PASS_THRESHOLD = 70;
const MAX_AUTOLOOP_ATTEMPTS = 5;

export function ShadowingPlayer({
  clipId,
  youtubeId,
  title,
  segments,
  topicIds,
  onClose,
}: ShadowingPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<ShadowScore | null>(null);
  const [wordDiffs, setWordDiffs] = useState<WordDiff[]>([]);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<1 | 0.75 | 0.5>(1);

  // Auto-loop state
  const [isAutoLoop, setIsAutoLoop] = useState(true);
  const [loopAttempts, setLoopAttempts] = useState(0);
  const [loopMode, setLoopMode] = useState<"idle" | "playing" | "recording" | "scored">(
    "idle",
  );

  const videoRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<any>(null);
  const playTimeoutRef = useRef<number | null>(null);

  // Subscribe to YouTube currentTime for karaoke word highlight
  const { currentTime, playerState } = useYouTubeTime(videoRef, true);

  const currentSegment = segments[currentIdx];

  /* ── Speech recognition setup (per segment) ───────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setRecognitionSupported(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processScore(text);
    };
    r.onerror = (e: any) => {
      console.warn("[shadow] recognition error", e?.error);
      setIsRecording(false);
      if (isAutoLoop) {
        // Don't trap the user — exit loop mode
        setLoopMode("idle");
      }
    };
    r.onend = () => setIsRecording(false);
    recognitionRef.current = r;
    return () => {
      try {
        r.stop();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx]);

  /* ── Clear pending timers when leaving segment ─────────────── */
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }
    };
  }, [currentIdx]);

  /* ── YouTube postMessage helpers ───────────────────────────── */
  const sendCmd = (func: string, args: any[] = []) => {
    if (!videoRef.current?.contentWindow) return;
    videoRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  };

  /* ── Play the current segment once ─────────────────────────── */
  const playSegmentOnce = (onEnd?: () => void) => {
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    sendCmd("setPlaybackRate", [playbackRate]);
    sendCmd("seekTo", [currentSegment.start, true]);
    sendCmd("playVideo");
    const durMs = Math.max(800, (currentSegment.end - currentSegment.start) * 1000 / playbackRate);
    playTimeoutRef.current = window.setTimeout(() => {
      sendCmd("pauseVideo");
      playTimeoutRef.current = null;
      onEnd?.();
    }, durMs);
  };

  const handleManualPlay = () => {
    setLoopMode("playing");
    playSegmentOnce(() => setLoopMode("idle"));
  };

  /* ── Auto-loop step ────────────────────────────────────────── */
  const runAutoLoopStep = () => {
    if (!isAutoLoop) return;
    if (!recognitionSupported) return;
    if (loopAttempts >= MAX_AUTOLOOP_ATTEMPTS) return;

    setScore(null);
    setWordDiffs([]);
    setTranscript("");
    setLoopMode("playing");

    playSegmentOnce(() => {
      // After segment finishes playing, start recognition
      setLoopMode("recording");
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.warn("[shadow] could not start recognition in autoloop", e);
        setLoopMode("idle");
      }
    });
  };

  /* ── Process a transcript through scoring ──────────────────── */
  const processScore = (userText: string) => {
    const result = scoreShadowingAttempt(currentSegment.text_en, userText);
    const inlineDiffs = scoreWordsInline(currentSegment.text_en, userText);
    setScore(result);
    setWordDiffs(inlineDiffs);
    setLoopMode("scored");

    // Persist attempt (fire-and-forget)
    fetch("/api/shadowing/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId,
        segmentIdx: currentIdx,
        scoreJson: {
          ...result,
          topicIds,
          segmentText: currentSegment.text_en,
          attemptInLoop: loopAttempts + 1,
        },
      }),
    }).catch(() => {});

    // Auto-advance check
    if (isAutoLoop) {
      const advance = shouldAdvance(result, inlineDiffs, AUTOLOOP_PASS_THRESHOLD);
      if (advance) {
        // Pass — record + move on after a short pause so user sees the score
        setTimeout(() => {
          recordCompletionAndAdvance();
        }, 1400);
      } else {
        // Fail — bump attempts; if under limit, loop again
        const nextAttempts = loopAttempts + 1;
        setLoopAttempts(nextAttempts);
        if (nextAttempts < MAX_AUTOLOOP_ATTEMPTS) {
          setTimeout(() => {
            runAutoLoopStep();
          }, 1600);
        }
      }
    }
  };

  /* ── Mark segment "done" and advance ───────────────────────── */
  const recordCompletionAndAdvance = () => {
    // Boost vocab ASUs that appeared in this segment
    recordShadowingCompletion({
      clipId,
      transcriptText: currentSegment.text_en,
      topicIds,
    }).catch(() => {});

    if (currentIdx < segments.length - 1) {
      goToSegment(currentIdx + 1);
    } else {
      // Last segment — close player after a moment
      setTimeout(() => onClose(), 800);
    }
  };

  /* ── Manual recording toggle (non-loop mode) ───────────────── */
  const toggleRecording = () => {
    if (!recognitionSupported) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      setScore(null);
      setWordDiffs([]);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.warn("[shadow] could not start recognition", e);
      }
    }
  };

  /* ── Segment navigation ────────────────────────────────────── */
  const goToSegment = (idx: number) => {
    if (idx < 0 || idx >= segments.length) return;
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    setCurrentIdx(idx);
    setScore(null);
    setWordDiffs([]);
    setTranscript("");
    setLoopAttempts(0);
    setLoopMode("idle");
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  };
  const next = () => goToSegment(currentIdx + 1);
  const prev = () => goToSegment(currentIdx - 1);

  /* ── Toggle auto-loop ──────────────────────────────────────── */
  const toggleAutoLoop = () => {
    setIsAutoLoop((v) => !v);
    setLoopAttempts(0);
    setLoopMode("idle");
  };

  /* ── Karaoke: word currently being spoken in the video ─────── */
  const karaokeIdx = useMemo(() => {
    // Estimate which word in the segment is currently being heard by
    // dividing elapsed time within the segment evenly across words.
    // Imperfect but smooth — real word timestamps would need a
    // forced-aligner.
    if (playerState !== 1) return -1; // only highlight when playing
    if (currentTime < currentSegment.start || currentTime > currentSegment.end + 0.5) {
      return -1;
    }
    const words = currentSegment.text_en.trim().split(/\s+/).length;
    const elapsed = Math.max(0, currentTime - currentSegment.start);
    const total = Math.max(0.5, currentSegment.end - currentSegment.start);
    const pct = Math.min(1, elapsed / total);
    return Math.min(words - 1, Math.floor(pct * words));
  }, [currentTime, currentSegment, playerState]);

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="ll-shadow-player">
      <div className="ll-shadow-player-inner">
        {/* Header */}
        <header className="ll-shadow-player-head">
          <div>
            <span className="ll-shadow-player-eyebrow">
              Đoạn {currentIdx + 1} / {segments.length}
              {isAutoLoop && loopAttempts > 0 && (
                <> · lượt {loopAttempts + 1}/{MAX_AUTOLOOP_ATTEMPTS}</>
              )}
            </span>
            <h2
              className="ll-shadow-player-title"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          </div>
          <button type="button" onClick={onClose} className="ll-shadow-player-close">
            ✕
          </button>
        </header>

        {/* Segment progress dots */}
        <div className="ll-shadow-player-dots">
          {segments.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSegment(i)}
              className={`ll-shadow-player-dot ${
                i === currentIdx ? "is-current" : i < currentIdx ? "is-done" : ""
              }`}
              aria-label={`Đến đoạn ${i + 1}`}
            />
          ))}
        </div>

        {/* Video */}
        <div className="ll-shadow-player-video">
          <iframe
            ref={videoRef}
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0`}
            allow="autoplay; encrypted-media"
            title={title}
          />
        </div>

        {/* Karaoke target text */}
        <div className="ll-shadow-player-target">
          <KaraokeLine
            text={currentSegment.text_en}
            wordDiffs={wordDiffs}
            karaokeIdx={karaokeIdx}
          />
          {currentSegment.text_vi && (
            <p className="ll-shadow-player-target-vi">{currentSegment.text_vi}</p>
          )}
        </div>

        {/* Status banner */}
        {isAutoLoop && (
          <LoopStatus mode={loopMode} attempts={loopAttempts} />
        )}

        {/* Controls */}
        <div className="ll-shadow-player-controls">
          <button
            type="button"
            onClick={prev}
            disabled={currentIdx === 0}
            className="ll-shadow-player-step"
            aria-label="Đoạn trước"
          >
            ◀
          </button>

          <button
            type="button"
            onClick={() =>
              setPlaybackRate((r) => (r === 1 ? 0.75 : r === 0.75 ? 0.5 : 1))
            }
            className="ll-shadow-player-rate"
            title="Đổi tốc độ"
          >
            {playbackRate}×
          </button>

          <button
            type="button"
            onClick={isAutoLoop ? runAutoLoopStep : handleManualPlay}
            className="ll-shadow-player-play"
            aria-label="Bắt đầu / phát lại"
            disabled={loopMode === "playing" || loopMode === "recording"}
          >
            ▶
          </button>

          {!isAutoLoop && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={!recognitionSupported}
              className={`ll-shadow-player-record ${isRecording ? "is-recording" : ""}`}
              aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
            >
              {isRecording ? "■" : "●"}
            </button>
          )}

          <button
            type="button"
            onClick={next}
            disabled={currentIdx === segments.length - 1}
            className="ll-shadow-player-step"
            aria-label="Đoạn sau"
          >
            ▶
          </button>

          <button
            type="button"
            onClick={toggleAutoLoop}
            className={`ll-shadow-player-loop ${isAutoLoop ? "is-on" : ""}`}
            title={isAutoLoop ? "Tắt lặp tự động" : "Bật lặp tự động"}
          >
            🔁 {isAutoLoop ? "Tự động" : "Thủ công"}
          </button>
        </div>

        {!recognitionSupported && (
          <div className="ll-shadow-player-fallback">
            Trình duyệt của bạn không hỗ trợ ghi âm để chấm tự động. Hãy mở
            trên Chrome / Edge / Safari để dùng đầy đủ tính năng.
          </div>
        )}

        {/* Score panel */}
        <AnimatePresence mode="wait">
          {transcript && score && (
            <motion.div
              key="score"
              className="ll-shadow-player-score"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="ll-shadow-player-userline">
                <span className="ll-shadow-player-userlbl">Bạn vừa đọc:</span>
                <span className="ll-shadow-player-usertxt">{transcript}</span>
              </div>

              <div className="ll-shadow-player-scorebar">
                <span className="ll-shadow-player-scorebar-lbl">Điểm tổng</span>
                <span
                  className={`ll-shadow-player-scorebar-num ${scoreClass(score.overall)}`}
                >
                  {score.overall}%
                </span>
              </div>

              <div className="ll-shadow-player-subscores">
                <div>
                  <div className="ll-shadow-player-sublbl">Chính xác</div>
                  <div className="ll-shadow-player-subnum">{score.accuracy}%</div>
                </div>
                <div>
                  <div className="ll-shadow-player-sublbl">Trôi chảy</div>
                  <div className="ll-shadow-player-subnum">{score.fluency}%</div>
                </div>
              </div>

              {!isAutoLoop && (
                <div className="ll-shadow-player-actions">
                  {currentIdx < segments.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        recordCompletionAndAdvance();
                      }}
                      className="ll-shadow-player-next-cta"
                    >
                      Đoạn tiếp theo →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onClose}
                      className="ll-shadow-player-next-cta"
                    >
                      Hoàn tất clip →
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════════════════ */

function KaraokeLine({
  text,
  wordDiffs,
  karaokeIdx,
}: {
  text: string;
  wordDiffs: WordDiff[];
  karaokeIdx: number;
}) {
  const words = text.trim().split(/\s+/);
  return (
    <p className="ll-shadow-karaoke">
      {words.map((w, i) => {
        const diff = wordDiffs[i];
        const cls = [
          "ll-shadow-karaoke-word",
          diff?.status === "match" && "is-match",
          diff?.status === "approx" && "is-approx",
          diff?.status === "missed" && "is-missed",
          i === karaokeIdx && "is-current",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <span key={i} className={cls}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </p>
  );
}

function LoopStatus({
  mode,
  attempts,
}: {
  mode: "idle" | "playing" | "recording" | "scored";
  attempts: number;
}) {
  const text = (() => {
    switch (mode) {
      case "playing":
        return "🔊 Đang phát đoạn — chuẩn bị đọc theo...";
      case "recording":
        return "🎤 Đến lượt bạn! Đọc theo câu vừa nghe.";
      case "scored":
        return attempts >= MAX_AUTOLOOP_ATTEMPTS
          ? "⏭️ Đã đủ số lần thử. Chuyển đoạn tiếp theo bằng nút ▶ nhé."
          : "✅ Đã chấm xong — chờ lặp lại lượt nữa.";
      default:
        return "Nhấn ▶ để bắt đầu lặp tự động (nghe → đọc theo → chấm điểm).";
    }
  })();
  return <div className="ll-shadow-player-loopstatus">{text}</div>;
}

function scoreClass(n: number): string {
  if (n >= 85) return "is-great";
  if (n >= 65) return "is-ok";
  return "is-low";
}
