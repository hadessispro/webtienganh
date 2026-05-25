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

  // Vocab integration state
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [selectedVocab, setSelectedVocab] = useState<any | null>(null);

  // AI analysis state
  const [aiData, setAiData] = useState<{ phrases: any[]; grammar: any[] } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(true);

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

  const { currentTime, playerState } = useYouTubeTime(videoRef, true);

  const safeSegments = segments || [];
  const currentSegment = safeSegments[currentIdx] || { start: 0, end: 0, text_en: "" };

  // Fetch vocabulary present in the clip
  useEffect(() => {
    if (safeSegments.length === 0) return;
    const allText = safeSegments.map((s) => s.text_en).join(" ");
    
    // 1. Fetch Local Vocab
    fetch("/api/shadowing/extract-vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: allText }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.matches) setVocabList(data.matches);
      })
      .catch(() => {});

    // 2. Fetch AI Grammar & Phrases (DeepSeek)
    setIsAiLoading(true);
    fetch("/api/shadowing/ai-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: allText, videoId: youtubeId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.phrases || data.grammar) {
          setAiData({ phrases: data.phrases || [], grammar: data.grammar || [] });
        }
      })
      .catch((e) => console.error("AI error", e))
      .finally(() => setIsAiLoading(false));
  }, [segments, youtubeId]);

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

  // Early return if segments are missing
  if (safeSegments.length === 0) {
    return (
      <div className="ll-shadow-workspace" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--page)", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <h2 style={{ color: "var(--ink)", marginBottom: "16px" }}>Dữ liệu phụ đề bị lỗi</h2>
        <p style={{ color: "var(--muted)", marginBottom: "24px" }}>Không thể tải đoạn hội thoại cho video này. Có thể video chưa có phụ đề.</p>
        <button onClick={onClose} style={{ padding: "10px 20px", background: "var(--ink)", color: "white", borderRadius: "8px", border: "none", cursor: "pointer" }}>Quay lại</button>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="ll-shadow-workspace" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--page)", display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
      
      {/* ── CỘT TRÁI: TIẾN TRÌNH & TỪ VỰNG (25%) ── */}
      <div style={{ width: "320px", borderRight: "1px solid var(--line)", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid var(--line)" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", background: "var(--line)", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", marginBottom: "24px", color: "var(--ink)", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"} onMouseLeave={(e) => e.currentTarget.style.background = "var(--line)"}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Thoát học
          </button>
          
          <h2 style={{ fontSize: "18px", margin: "0 0 8px 0", color: "var(--ink)", lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: title }} />
          <div style={{ fontSize: "13px", color: "var(--muted)", fontWeight: 500 }}>
            {segments.length} đoạn {topicIds.length > 0 ? `• ${topicIds.join(", ")}` : ""}
          </div>
        </div>

        <div style={{ padding: "24px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", marginBottom: "16px", fontWeight: 700 }}>Từ vựng nổi bật</h3>
          {vocabList.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {vocabList.map(v => (
                <div 
                  key={v.skillId} 
                  onClick={() => setSelectedVocab(v)} 
                  style={{ 
                    padding: "6px 12px", 
                    background: selectedVocab?.skillId === v.skillId ? "var(--ink)" : "white", 
                    color: selectedVocab?.skillId === v.skillId ? "white" : "var(--ink)", 
                    borderRadius: "100px", 
                    fontSize: "12px", 
                    fontWeight: 600, 
                    border: "1px solid var(--line)", 
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {v.word}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>Không tìm thấy từ vựng khó.</div>
          )}
        </div>

        {/* Cụm từ & Ngữ pháp (AI) */}
        <div style={{ padding: "24px", borderBottom: "1px solid var(--line)" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", marginBottom: "16px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>✨</span> Phân tích AI
          </h3>
          
          {isAiLoading ? (
            <div style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic", display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="ll-shadow-spinner" style={{ width: "14px", height: "14px" }} /> DeepSeek đang phân tích...
            </div>
          ) : !aiData || (aiData.phrases.length === 0 && aiData.grammar.length === 0) ? (
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>Bài hội thoại cơ bản.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {aiData.phrases.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: "8px", textTransform: "uppercase" }}>Cụm từ</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {aiData.phrases.map((p, idx) => (
                      <div key={idx} style={{ background: "var(--glass)", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#f59e0b" }}>{p.phrase}</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{p.definition_vi}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {aiData.grammar.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", marginBottom: "8px", textTransform: "uppercase" }}>Ngữ pháp</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {aiData.grammar.map((g, idx) => (
                      <div key={idx} style={{ background: "var(--glass)", padding: "10px", borderRadius: "8px", border: "1px solid var(--line)" }}>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#3b82f6" }}>{g.structure}</div>
                        <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{g.explanation_vi}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "24px", flex: 1 }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", marginBottom: "16px", fontWeight: 700 }}>Danh sách câu</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {segments.map((seg, i) => (
              <div 
                key={i} 
                onClick={() => goToSegment(i)}
                style={{ 
                  padding: "12px", 
                  borderRadius: "12px", 
                  cursor: "pointer", 
                  background: i === currentIdx ? "var(--ink)" : i < currentIdx ? "rgba(0,0,0,0.02)" : "transparent",
                  color: i === currentIdx ? "white" : "var(--ink)",
                  border: i === currentIdx ? "none" : "1px solid var(--line)",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px", fontWeight: 600 }}>ĐOẠN {i + 1}</div>
                <div style={{ fontSize: "13px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {seg.text_en}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CỘT GIỮA: PLAYER & ĐIỀU KHIỂN (50%) ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--glass)", position: "relative", overflowY: "auto" }}>
        
        {recognitionSupported && micPermission === "denied" && (
          <div className="ll-shadow-player-warning" style={{ margin: "24px 24px 0" }}>
            ⚠️ Trình duyệt đang chặn microphone. Bấm icon 🔒 hoặc 🎤 ở thanh địa chỉ → chọn <strong>Cho phép</strong> → tải lại trang.
          </div>
        )}

        <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "32px", flex: 1, justifyContent: "center", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
          <div style={{ aspectRatio: "16/9", background: "black", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", width: "100%" }}>
            <iframe
              ref={videoRef}
              src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&playsinline=1`}
              allow="autoplay; encrypted-media"
              title={title}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          </div>

          <div style={{ textAlign: "center", minHeight: "120px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <KaraokeLine text={currentSegment.text_en} wordDiffs={wordDiffs} karaokeIdx={karaokeIdx} vocabList={vocabList} onVocabClick={setSelectedVocab} />
            {currentSegment.text_vi && (
              <p style={{ fontSize: "16px", color: "var(--muted)", marginTop: "16px", fontWeight: 500 }}>{currentSegment.text_vi}</p>
            )}
          </div>

          {isAutoLoop && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <LoopStatus mode={loopMode} attempts={loopAttempts} usedAll={usedAllAttempts} isRecording={isRecording} />
            </div>
          )}

          <div className="ll-shadow-player-controls" style={{ marginTop: "0" }}>
            <button type="button" onClick={prev} disabled={currentIdx === 0} className="ll-shadow-player-step">◀</button>
            <button type="button" onClick={() => setPlaybackRate((r) => (r === 1 ? 0.75 : r === 0.75 ? 0.5 : 1))} className="ll-shadow-player-rate">{playbackRate}×</button>
            <button type="button" onClick={isAutoLoop ? runAutoLoopStep : handleManualPlay} className="ll-shadow-player-play" disabled={loopMode === "playing" || loopMode === "recording"}>▶</button>
            {!isAutoLoop && (
              <button type="button" onClick={toggleRecording} disabled={!recognitionSupported || micPermission === "denied"} className={`ll-shadow-player-record ${isRecording ? "is-recording" : ""}`}>
                {isRecording ? "■" : "●"}
              </button>
            )}
            <button type="button" onClick={next} disabled={currentIdx === segments.length - 1} className="ll-shadow-player-step">▶</button>
            <button type="button" onClick={toggleAutoLoop} className={`ll-shadow-player-loop ${isAutoLoop ? "is-on" : ""}`}>
              🔁 {isAutoLoop ? "Tự động" : "Thủ công"}
            </button>
            <button type="button" onClick={skipSegment} className="ll-shadow-player-skip">Bỏ qua ⏭</button>
          </div>
        </div>
      </div>

      {/* ── CỘT PHẢI: PHÂN TÍCH & CÔNG CỤ (25%) ── */}
      <div style={{ width: "360px", borderLeft: "1px solid var(--line)", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        
        <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", marginBottom: "16px", fontWeight: 700 }}>Phân tích phát âm</h3>
            
            <AnimatePresence mode="wait">
              {transcript && score ? (
                <motion.div
                  key={`score-${currentIdx}-${loopAttempts}`}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                >
                  <div style={{ padding: "16px", background: "white", borderRadius: "16px", border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600, marginBottom: "8px" }}>BẠN VỪA ĐỌC:</div>
                    <div style={{ fontSize: "15px", color: "var(--ink)", lineHeight: 1.5 }}>"{transcript}"</div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1, padding: "20px 16px", background: scoreClass(score.overall) === "is-great" ? "rgba(16,185,129,0.1)" : scoreClass(score.overall) === "is-ok" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", borderRadius: "16px", textAlign: "center", border: `1px solid ${scoreClass(score.overall) === "is-great" ? "rgba(16,185,129,0.3)" : scoreClass(score.overall) === "is-ok" ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink)", opacity: 0.7, marginBottom: "4px" }}>ĐIỂM TỔNG</div>
                      <div style={{ fontSize: "32px", fontWeight: 800, color: scoreClass(score.overall) === "is-great" ? "#059669" : scoreClass(score.overall) === "is-ok" ? "#d97706" : "#dc2626" }}>{score.overall}%</div>
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ padding: "16px", background: "white", borderRadius: "16px", border: "1px solid var(--line)", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", marginBottom: "4px" }}>CHÍNH XÁC</div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)" }}>{score.accuracy}%</div>
                    </div>
                    <div style={{ padding: "16px", background: "white", borderRadius: "16px", border: "1px solid var(--line)", textAlign: "center" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", marginBottom: "4px" }}>TRÔI CHẢY</div>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink)" }}>{score.fluency}%</div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div style={{ padding: "32px", textAlign: "center", background: "rgba(0,0,0,0.02)", borderRadius: "16px", border: "1px dashed var(--line)" }}>
                  <div style={{ fontSize: "32px", opacity: 0.5, marginBottom: "12px" }}>🎤</div>
                  <div style={{ fontSize: "14px", color: "var(--muted)", fontWeight: 500, lineHeight: 1.5 }}>
                    Đọc đoạn thoại để xem bảng phân tích<br/>và điểm số chi tiết tại đây.
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ padding: "24px", background: "white", borderRadius: "20px", border: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--muted)", marginBottom: "12px", fontWeight: 700 }}>Từ điển Mini</h3>
            {selectedVocab ? (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "var(--ink)" }}>{selectedVocab.word}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "white", background: "#10b981", padding: "2px 6px", borderRadius: "4px" }}>{selectedVocab.level}</span>
                </div>
                <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "12px", fontStyle: "italic" }}>
                  {selectedVocab.pos} • {selectedVocab.pronunciation_ipa}
                </div>
                <div style={{ fontSize: "15px", color: "var(--ink)", lineHeight: 1.5 }}>
                  {selectedVocab.definition_vi}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--soft)", lineHeight: 1.5, margin: 0 }}>
                💡 Mẹo: Ở các bản cập nhật sau, bạn có thể click vào bất kỳ từ nào được in đậm trong câu (ở cột giữa) để xem phiên âm IPA và nghĩa tiếng Việt ngay tại đây.
              </p>
            )}
          </div>
        </div>

        <div style={{ padding: "24px", borderTop: "1px solid var(--line)", background: "white" }}>
          {(!isAutoLoop || usedAllAttempts) && transcript && score ? (
            currentIdx < segments.length - 1 ? (
              <button type="button" onClick={recordCompletionAndAdvance} style={{ width: "100%", padding: "16px", background: "var(--ink)", color: "white", borderRadius: "12px", fontWeight: 600, border: "none", cursor: "pointer", fontSize: "15px" }}>
                Hoàn thành & Sang đoạn tiếp →
              </button>
            ) : (
              <button type="button" onClick={onClose} style={{ width: "100%", padding: "16px", background: "#10b981", color: "white", borderRadius: "12px", fontWeight: 600, border: "none", cursor: "pointer", fontSize: "15px" }}>
                Hoàn tất bài học 🎉
              </button>
            )
          ) : (
            <button type="button" disabled style={{ width: "100%", padding: "16px", background: "var(--page)", color: "var(--muted)", borderRadius: "12px", fontWeight: 600, border: "1px solid var(--line)", cursor: "not-allowed", fontSize: "15px" }}>
              Chờ bạn luyện tập...
            </button>
          )}
        </div>
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
  vocabList,
  onVocabClick,
}: {
  text: string;
  wordDiffs: WordDiff[];
  karaokeIdx: number;
  vocabList: any[];
  onVocabClick: (vocab: any) => void;
}) {
  const words = text.trim().split(/\s+/);
  return (
    <p className="ll-shadow-karaoke">
      {words.map((w, i) => {
        const diff = wordDiffs[i];
        const cleanW = w.toLowerCase().replace(/[.,!?()[\]{}"']/g, "");
        const matchedVocab = vocabList.find(v => v.word.toLowerCase() === cleanW);
        const isVocab = !!matchedVocab;

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
          <span 
            key={i} 
            className={cls}
            onClick={() => isVocab && onVocabClick(matchedVocab)}
            style={isVocab ? { textDecoration: 'underline', textDecorationThickness: '2px', textUnderlineOffset: '4px', cursor: 'pointer', fontWeight: 800 } : undefined}
          >
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
