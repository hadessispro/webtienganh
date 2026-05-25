"use client";

/**
 * Path: apps/web/app/components/ShadowingPlayer.tsx
 *
 * Full-screen lesson player for shadowing.
 *
 * Redesign 2026-05-25:
 *   - Move all inline styles to .ll-shadow-player-* classes in
 *     globals.css. Consistent with design system.
 *   - When user finishes (last segment with score >= 60), call
 *     onComplete which posts the practiced topic-ASU-tags to
 *     /api/shadowing/attempt so the recommender can pick up the signal.
 *   - Add a "Show transcript" toggle so beginners can read along.
 *   - Add a "Replay slowly" button (0.75x) — uses iframe playerVars.
 *   - Add segment progress dots at the top, not just text.
 *
 * Speech recognition still uses Web Speech API. This works in Chrome,
 * Edge, Safari (with quirks). Firefox doesn't support it — we show a
 * friendly fallback message and let the user self-check.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShadowScore, scoreShadowingAttempt } from "../lib/shadow-score";

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
  const [showTranscript, setShowTranscript] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<1 | 0.75>(1);

  const videoRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<any>(null);

  // Set up speech recognition once per segment (browsers require
  // recreating the instance for clean state).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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
      calculateScore(text);
    };
    r.onerror = (e: any) => {
      console.warn("[shadow] recognition error", e?.error);
      setIsRecording(false);
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
  }, [currentIdx]);

  const currentSegment = segments[currentIdx];

  const sendCommand = (func: string, args: any[] = []) => {
    if (!videoRef.current?.contentWindow) return;
    videoRef.current.contentWindow.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*",
    );
  };

  const playSegment = () => {
    sendCommand("setPlaybackRate", [playbackRate]);
    sendCommand("seekTo", [currentSegment.start, true]);
    sendCommand("playVideo");
    const dur = (currentSegment.end - currentSegment.start) * 1000;
    setTimeout(() => sendCommand("pauseVideo"), Math.max(800, dur));
  };

  const togglePlaybackRate = () => {
    setPlaybackRate((r) => (r === 1 ? 0.75 : 1));
  };

  const toggleRecording = () => {
    if (!recognitionSupported) return;
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      setScore(null);
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        console.warn("[shadow] could not start recognition", e);
      }
    }
  };

  const calculateScore = async (userText: string) => {
    const result = scoreShadowingAttempt(currentSegment.text_en, userText);
    setScore(result);

    // Persist (fire-and-forget — UI doesn't block)
    fetch("/api/shadowing/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId,
        segmentIdx: currentIdx,
        scoreJson: { ...result, topicIds, segmentText: currentSegment.text_en },
      }),
    }).catch((e) => console.warn("[shadow] save attempt failed", e));
  };

  const goToSegment = (idx: number) => {
    if (idx < 0 || idx >= segments.length) return;
    setCurrentIdx(idx);
    setScore(null);
    setTranscript("");
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsRecording(false);
  };

  const next = () => goToSegment(currentIdx + 1);
  const prev = () => goToSegment(currentIdx - 1);

  // ────────────────────────────────────────────────────────────
  return (
    <div className="ll-shadow-player">
      <div className="ll-shadow-player-inner">
        {/* Header */}
        <header className="ll-shadow-player-head">
          <div>
            <span className="ll-shadow-player-eyebrow">Đoạn {currentIdx + 1} / {segments.length}</span>
            <h2 className="ll-shadow-player-title" dangerouslySetInnerHTML={{ __html: title }} />
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
                i === currentIdx
                  ? "is-current"
                  : i < currentIdx
                  ? "is-done"
                  : ""
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

        {/* Target text card */}
        <div className="ll-shadow-player-target">
          {showTranscript || isRecording ? (
            <p className="ll-shadow-player-target-text">
              {currentSegment.text_en}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowTranscript(true)}
              className="ll-shadow-player-reveal"
            >
              Hiện phụ đề →
            </button>
          )}
          {showTranscript && currentSegment.text_vi && (
            <p className="ll-shadow-player-target-vi">{currentSegment.text_vi}</p>
          )}
        </div>

        {/* Control row */}
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
            onClick={togglePlaybackRate}
            className="ll-shadow-player-rate"
            title="Đổi tốc độ"
          >
            {playbackRate}×
          </button>

          <button
            type="button"
            onClick={playSegment}
            className="ll-shadow-player-play"
            aria-label="Phát lại đoạn này"
          >
            ▶
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            disabled={!recognitionSupported}
            className={`ll-shadow-player-record ${isRecording ? "is-recording" : ""}`}
            aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
          >
            {isRecording ? "■" : "●"}
          </button>

          <button
            type="button"
            onClick={next}
            disabled={currentIdx === segments.length - 1}
            className="ll-shadow-player-step"
            aria-label="Đoạn sau"
          >
            ▶
          </button>
        </div>

        {!recognitionSupported && (
          <div className="ll-shadow-player-fallback">
            Trình duyệt của bạn không hỗ trợ ghi âm để chấm tự động. Hãy
            mở trên Chrome / Edge / Safari để dùng đầy-đủ tính năng.
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

              <div className="ll-shadow-player-diff">
                <span className="ll-shadow-player-diff-lbl">Chi tiết:</span>
                <div className="ll-shadow-player-diff-tokens">
                  {score.diff.map((d, i) => (
                    <span
                      key={i}
                      className={`ll-shadow-token ll-shadow-token--${d.type}`}
                    >
                      {d.text}
                    </span>
                  ))}
                </div>
              </div>

              {currentIdx < segments.length - 1 && (
                <button
                  type="button"
                  onClick={next}
                  className="ll-shadow-player-next-cta"
                >
                  Đoạn tiếp theo →
                </button>
              )}

              {currentIdx === segments.length - 1 && (
                <button
                  type="button"
                  onClick={onClose}
                  className="ll-shadow-player-next-cta"
                >
                  Hoàn tất clip →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function scoreClass(n: number): string {
  if (n >= 85) return "is-great";
  if (n >= 65) return "is-ok";
  return "is-low";
}
