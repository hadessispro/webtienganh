"use client";

/**
 * Path: apps/web/app/components/ShadowingPlayer.tsx
 *
 * Full-screen shadowing player.
 *
 * 2026-05-25 (V3.1) fixes user-reported bugs:
 *
 *   1. Auto-loop got STUCK at "Đến lượt bạn" when SpeechRecognition's
 *      onend fired without a result (user spoke too softly / mic
 *      permission still pending / silent room). Now we add an
 *      8-second timeout AND wire onend to gracefully reset.
 *
 *   2. YouTube embed often loads MUTED because Chrome's autoplay
 *      policy. Now on first ▶ we explicitly send unmute + setVolume.
 *
 *   3. The recognition handler stale-closed over isAutoLoop. Moved
 *      the dynamic state out of the closure via a ref.
 *
 *   4. Added "Bỏ qua đoạn này" skip button — never let the user
 *      get stuck if a segment is too hard or the mic just won't work.
 *
 *   5. Mic permission state surfaced clearly: "Trình duyệt chưa cấp
 *      mic — bấm icon 🎤 trên thanh URL để cho phép".
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
const RECOGNITION_TIMEOUT_MS = 8000; // give up after 8s of silence

type LoopMode = "idle" | "playing" | "recording" | "scored";
type MicPermissionState = "unknown" | "granted" | "denied" | "pending";

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
  const [micPermission, setMicPermission] =
    useState<MicPermissionState>("unknown");
  const [playbackRate, setPlaybackRate] = useState<1 | 0.75 | 0.5>(1);

  // Auto-loop state
  const [isAutoLoop, setIsAutoLoop] = useState(true);
  const [loopAttempts, setLoopAttempts] = useState(0);
  const [loopMode, setLoopMode] = useState<LoopMode>("idle");

  const videoRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<any>(null);
  const playTimeoutRef = useRef<number | null>(null);
  const recognitionTimeoutRef = useRef<number | null>(null);
  // Refs for state-that-handlers-need so we don't re-create the
  // recognition object on every render.
  const isAutoLoopRef = useRef(isAutoLoop);
  const loopAttemptsRef = useRef(loopAttempts);
  const currentIdxRef = useRef(currentIdx);
  const gotResultRef = useRef(false);
  const youtubeUnmutedRef = useRef(false);

  useEffect(() => {
    isAutoLoopRef.current = isAutoLoop;
  }, [isAutoLoop]);
  useEffect(() => {
    loopAttemptsRef.current = loopAttempts;
  }, [loopAttempts]);
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  // Subscribe to YouTube currentTime for karaoke
  const { currentTime, playerState } = useYouTubeTime(videoRef, true);

  const currentSegment = segments[currentIdx];

  /* ── Detect mic permission on mount ────────────────────────── */
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions) {
      return;
    }
    navigator.permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        setMicPermission(status.state as MicPermissionState);
        status.onchange = () =>
          setMicPermission(status.state as MicPermissionState);
      })
      .catch(() => {
        // Some browsers don't support querying mic perm — silent.
      });
  }, []);

  /* ── Speech recognition (created ONCE per segment) ─────────── */
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
      gotResultRef.current = true;
      const text = event.results[0][0].transcript ?? "";
      setTranscript(text);
      processScore(text);
    };
    r.onerror = (e: any) => {
      const err = e?.error ?? "unknown";
      console.warn("[shadow] recognition error:", err);
      setIsRecording(false);
      if (err === "not-allowed" || err === "permission-denied") {
        setMicPermission("denied");
      }
      // Exit loop mode so user isn't trapped
      setLoopMode("idle");
      clearRecognitionTimeout();
    };
    r.onend = () => {
      setIsRecording(false);
      clearRecognitionTimeout();
      // If we never got a result, fall back to scored:idle so the user
      // can retry / skip instead of being stuck.
      if (!gotResultRef.current) {
        if (isAutoLoopRef.current) {
          // Count this as a failed attempt, but don't auto-retry
          // because there's no signal that anything was heard.
          setLoopMode("idle");
        } else {
          setLoopMode("idle");
        }
      }
    };
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

  /* ── Cleanup timeouts on unmount + segment change ──────────── */
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) {
        clearTimeout(playTimeoutRef.current);
        playTimeoutRef.current = null;
      }
      clearRecognitionTimeout();
    };
  }, [currentIdx]);

  const clearRecognitionTimeout = () => {
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
  };

  /* ── YouTube postMessage helpers ───────────────────────────── */
  const sendCmd = (func: string, args: any[] = []) => {
    if (!videoRef.current?.contentWindow) return;
    videoRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  };

  const ensureUnmuted = () => {
    // Chrome autoplay policy mutes the iframe by default. Unmute on
    // user-initiated play (this satisfies the autoplay policy).
    if (!youtubeUnmutedRef.current) {
      sendCmd("unMute");
      sendCmd("setVolume", [100]);
      youtubeUnmutedRef.current = true;
    }
  };

  /* ── Play the current segment once ─────────────────────────── */
  const playSegmentOnce = (onEnd?: () => void) => {
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    ensureUnmuted();
    sendCmd("setPlaybackRate", [playbackRate]);
    sendCmd("seekTo", [currentSegment.start, true]);
    sendCmd("playVideo");
    const durMs = Math.max(
      800,
      ((currentSegment.end - currentSegment.start) * 1000) / playbackRate,
    );
    playTimeoutRef.current = window.setTimeout(() => {
      sendCmd("pauseVideo");
      playTimeoutRef.current = null;
      onEnd?.();
    }, durMs);
  };

  /* ── Start recognition with timeout safety net ─────────────── */
  const startRecognitionSafe = () => {
    if (!recognitionRef.current) return;
    gotResultRef.current = false;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setMicPermission((p) => (p === "unknown" ? "pending" : p));
      // Safety timeout — force stop if browser silently hangs
      clearRecognitionTimeout();
      recognitionTimeoutRef.current = window.setTimeout(() => {
        try {
          recognitionRef.current?.stop();
        } catch {
          // ignore
        }
        // onend will fire and handle the rest
      }, RECOGNITION_TIMEOUT_MS);
    } catch (e) {
      console.warn("[shadow] could not start recognition", e);
      setIsRecording(false);
      setLoopMode("idle");
    }
  };

  const stopRecognition = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    clearRecognitionTimeout();
  };

  /* ── Manual play (non-loop) ────────────────────────────────── */
  const handleManualPlay = () => {
    setLoopMode("playing");
    playSegmentOnce(() => setLoopMode("idle"));
  };

  /* ── Auto-loop one cycle ───────────────────────────────────── */
  const runAutoLoopStep = () => {
    if (!isAutoLoopRef.current) return;
    if (!recognitionSupported) return;
    if (loopAttemptsRef.current >= MAX_AUTOLOOP_ATTEMPTS) return;

    setScore(null);
    setWordDiffs([]);
    setTranscript("");
    setLoopMode("playing");

    playSegmentOnce(() => {
      // After segment finishes, start recognition
      setLoopMode("recording");
      startRecognitionSafe();
    });
  };

  /* ── Process scoring + advance ─────────────────────────────── */
  const processScore = (userText: string) => {
    const segText = currentSegment.text_en;
    const result = scoreShadowingAttempt(segText, userText);
    const inlineDiffs = scoreWordsInline(segText, userText);
    setScore(result);
    setWordDiffs(inlineDiffs);
    setLoopMode("scored");

    // Persist attempt
    fetch("/api/shadowing/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId,
        segmentIdx: currentIdxRef.current,
        scoreJson: {
          ...result,
          topicIds,
          segmentText: segText,
          attemptInLoop: loopAttemptsRef.current + 1,
        },
      }),
    }).catch(() => {});

    // Auto-advance check
    if (isAutoLoopRef.current) {
      const advance = shouldAdvance(result, inlineDiffs, AUTOLOOP_PASS_THRESHOLD);
      if (advance) {
        setTimeout(() => recordCompletionAndAdvance(), 1400);
      } else {
        const nextAttempts = loopAttemptsRef.current + 1;
        setLoopAttempts(nextAttempts);
        if (nextAttempts < MAX_AUTOLOOP_ATTEMPTS) {
          setTimeout(() => runAutoLoopStep(), 1600);
        } else {
          // Used all attempts — surface the skip option
          setLoopMode("scored");
        }
      }
    }
  };

  /* ── Mark complete + advance ───────────────────────────────── */
  const recordCompletionAndAdvance = () => {
    recordShadowingCompletion({
      clipId,
      transcriptText: currentSegment.text_en,
      topicIds,
    }).catch(() => {});

    if (currentIdxRef.current < segments.length - 1) {
      goToSegment(currentIdxRef.current + 1);
    } else {
      setTimeout(() => onClose(), 800);
    }
  };

  /* ── Manual mic toggle ─────────────────────────────────────── */
  const toggleRecording = () => {
    if (!recognitionSupported) return;
    if (isRecording) {
      stopRecognition();
      setIsRecording(false);
    } else {
      setTranscript("");
      setScore(null);
      setWordDiffs([]);
      startRecognitionSafe();
    }
  };

  /* ── Segment navigation ────────────────────────────────────── */
  const goToSegment = (idx: number) => {
    if (idx < 0 || idx >= segments.length) return;
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    clearRecognitionTimeout();
    stopRecognition();
    setIsRecording(false);
    setCurrentIdx(idx);
    setScore(null);
    setWordDiffs([]);
    setTranscript("");
    setLoopAttempts(0);
    setLoopMode("idle");
  };
  const next = () => goToSegment(currentIdx + 1);
  const prev = () => goToSegment(currentIdx - 1);

  const skipSegment = () => {
    // Skip is "give up this segment without bumping skill state".
    if (currentIdx < segments.length - 1) {
      goToSegment(currentIdx + 1);
    } else {
      onClose();
    }
  };

  const toggleAutoLoop = () => {
    setIsAutoLoop((v) => !v);
    setLoopAttempts(0);
    setLoopMode("idle");
  };

  /* ── Karaoke current-word index (estimate) ─────────────────── */
  const karaokeIdx = useMemo(() => {
    if (playerState !== 1) return -1;
    if (
      currentTime < currentSegment.start ||
      currentTime > currentSegment.end + 0.5
    ) {
      return -1;
    }
    const words = currentSegment.text_en.trim().split(/\s+/).length;
    const elapsed = Math.max(0, currentTime - currentSegment.start);
    const total = Math.max(0.5, currentSegment.end - currentSegment.start);
    const pct = Math.min(1, elapsed / total);
    return Math.min(words - 1, Math.floor(pct * words));
  }, [currentTime, currentSegment, playerState]);

  const usedAllAttempts =
    isAutoLoop && loopAttempts >= MAX_AUTOLOOP_ATTEMPTS;

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

        {/* Mic permission warning */}
        {recognitionSupported && micPermission === "denied" && (
          <div className="ll-shadow-player-warning">
            ⚠️ Trình duyệt đang chặn microphone. Bấm icon 🔒 hoặc 🎤 ở thanh
            địa chỉ → chọn <strong>Cho phép</strong> → tải lại trang.
          </div>
        )}

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
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&playsinline=1`}
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
          <LoopStatus
            mode={loopMode}
            attempts={loopAttempts}
            usedAll={usedAllAttempts}
            isRecording={isRecording}
          />
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
              disabled={!recognitionSupported || micPermission === "denied"}
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

          <button
            type="button"
            onClick={skipSegment}
            className="ll-shadow-player-skip"
            title="Bỏ qua đoạn này"
          >
            Bỏ qua ⏭
          </button>
        </div>

        {!recognitionSupported && (
          <div className="ll-shadow-player-fallback">
            Trình duyệt của bạn không hỗ trợ ghi âm để chấm tự động. Hãy mở
            trên Chrome / Edge / Safari để dùng đầy đủ tính năng. Trong khi
            đó, bạn vẫn có thể nghe và đọc theo, sau đó dùng nút <strong>
            Bỏ qua ⏭</strong> để chuyển đoạn.
          </div>
        )}

        {/* Score panel */}
        <AnimatePresence mode="wait">
          {transcript && score && (
            <motion.div
              key={`score-${currentIdx}-${loopAttempts}`}
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

              {(!isAutoLoop || usedAllAttempts) && (
                <div className="ll-shadow-player-actions">
                  {currentIdx < segments.length - 1 ? (
                    <button
                      type="button"
                      onClick={recordCompletionAndAdvance}
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
  usedAll,
  isRecording,
}: {
  mode: LoopMode;
  attempts: number;
  usedAll: boolean;
  isRecording: boolean;
}) {
  if (usedAll) {
    return (
      <div className="ll-shadow-player-loopstatus is-warn">
        ⏭️ Đã thử {MAX_AUTOLOOP_ATTEMPTS} lần. Bấm <strong>Đoạn tiếp theo</strong> ở
        thẻ điểm phía dưới hoặc <strong>Bỏ qua ⏭</strong> ở thanh điều khiển.
      </div>
    );
  }
  const text = (() => {
    switch (mode) {
      case "playing":
        return "🔊 Đang phát đoạn — chuẩn bị đọc theo...";
      case "recording":
        return isRecording
          ? "🎤 Đến lượt bạn! Đọc theo câu vừa nghe (có 8 giây)..."
          : "🎤 Đang khởi tạo mic, chờ chút...";
      case "scored":
        return "✅ Đã chấm xong — chuẩn bị lặp lần nữa.";
      default:
        return attempts === 0
          ? "Nhấn ▶ để bắt đầu: tự động phát → bật mic → chấm → lặp."
          : "Sẵn sàng cho lần thử tiếp theo. Nhấn ▶.";
    }
  })();
  return (
    <div className={`ll-shadow-player-loopstatus ${mode === "recording" ? "is-recording" : ""}`}>
      {text}
    </div>
  );
}

function scoreClass(n: number): string {
  if (n >= 85) return "is-great";
  if (n >= 65) return "is-ok";
  return "is-low";
}
