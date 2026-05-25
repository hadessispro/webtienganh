"use client"
import { useState, useRef, useEffect } from "react";
import { ShadowScore, scoreShadowingAttempt } from "../lib/shadow-score";

interface Segment {
  start: number;
  end: number;
  text_en: string;
  text_vi: string;
}

interface ShadowingPlayerProps {
  clipId: string;
  youtubeId: string;
  segments: Segment[];
  onClose: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function ShadowingPlayer({ clipId, youtubeId, segments, onClose }: ShadowingPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<ShadowScore | null>(null);
  
  const videoRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          calculateScore(text);
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, [currentIdx]);

  const currentSegment = segments[currentIdx];

  const playSegment = () => {
    if (videoRef.current?.contentWindow) {
      videoRef.current.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: "seekTo",
        args: [currentSegment.start, true]
      }), "*");
      
      videoRef.current.contentWindow.postMessage(JSON.stringify({
        event: "command",
        func: "playVideo",
        args: []
      }), "*");

      setTimeout(() => {
        if (videoRef.current?.contentWindow) {
          videoRef.current.contentWindow.postMessage(JSON.stringify({
            event: "command",
            func: "pauseVideo",
            args: []
          }), "*");
        }
      }, (currentSegment.end - currentSegment.start) * 1000);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      setScore(null);
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const calculateScore = async (userText: string) => {
    const result = scoreShadowingAttempt(currentSegment.text_en, userText);
    setScore(result);

    try {
      await fetch("/api/shadowing/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId,
          segmentIdx: currentIdx,
          scoreJson: result
        })
      });
    } catch (e) {
      console.error("Failed to save attempt", e);
    }
  };

  const nextSegment = () => {
    if (currentIdx < segments.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setScore(null);
      setTranscript("");
    }
  };

  const prevSegment = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setScore(null);
      setTranscript("");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(250,250,250,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: "900px", width: "100%", margin: "0 auto", flex: 1, display: "flex", flexDirection: "column", padding: "40px 24px", gap: "24px", overflowY: "auto" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "24px", margin: 0 }}>Luyện Shadowing</h2>
          <button 
            onClick={onClose} 
            style={{ padding: "8px 20px", background: "var(--line)", border: "none", borderRadius: "999px", fontWeight: 600, cursor: "pointer", color: "var(--ink)", transition: "background 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#e5e7eb"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--line)"}
          >
            Đóng
          </button>
        </div>

        <div style={{ aspectRatio: "16/9", background: "black", borderRadius: "24px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}>
          <iframe
            ref={videoRef}
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0`}
            style={{ width: "100%", height: "100%", border: 0 }}
            allow="autoplay; encrypted-media"
          ></iframe>
        </div>

        <div className="ll-glass" style={{ padding: "32px", borderRadius: "24px", textAlign: "center", minHeight: "140px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontSize: "24px", fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
            {currentSegment.text_en}
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "24px", alignItems: "center", padding: "16px 0" }}>
          <button 
            onClick={prevSegment}
            disabled={currentIdx === 0}
            style={{ width: "56px", height: "56px", borderRadius: "50%", border: "none", background: "var(--page)", cursor: currentIdx === 0 ? "not-allowed" : "pointer", opacity: currentIdx === 0 ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px var(--line)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          
          <button 
            onClick={playSegment}
            style={{ width: "64px", height: "64px", borderRadius: "50%", border: "none", background: "var(--ink)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>
          </button>

          <button 
            onClick={toggleRecording}
            style={{ 
              width: "80px", height: "80px", borderRadius: "50%", border: "none", 
              background: isRecording ? "linear-gradient(135deg, #ff4b4b, #ff0000)" : "linear-gradient(135deg, #10b981, #059669)", 
              color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", 
              boxShadow: isRecording ? "0 0 0 8px rgba(255, 75, 75, 0.2), 0 12px 24px rgba(255, 75, 75, 0.4)" : "0 12px 24px rgba(16, 185, 129, 0.3)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isRecording ? "scale(1.05)" : "scale(1)"
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          
          <button 
            onClick={nextSegment}
            disabled={currentIdx === segments.length - 1}
            style={{ width: "56px", height: "56px", borderRadius: "50%", border: "none", background: "var(--page)", cursor: currentIdx === segments.length - 1 ? "not-allowed" : "pointer", opacity: currentIdx === segments.length - 1 ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 1px var(--line)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {transcript && (
          <div className="ll-glass" style={{ padding: "24px", borderRadius: "24px", border: "1px solid var(--line)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Bạn vừa đọc:</h3>
            <p style={{ fontSize: "20px", marginBottom: "24px", color: "var(--ink)" }}>{transcript}</p>
            
            {score && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.1)", padding: "16px 20px", borderRadius: "16px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <span style={{ fontWeight: 600, color: "#065f46" }}>Điểm tổng:</span>
                  <span style={{ fontSize: "28px", fontWeight: 800, color: "#059669" }}>{score.overall}%</span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "var(--page)", padding: "16px", borderRadius: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Độ chính xác</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px" }}>{score.accuracy}%</div>
                  </div>
                  <div style={{ background: "var(--page)", padding: "16px", borderRadius: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Trôi chảy</div>
                    <div style={{ fontSize: "24px", fontWeight: 700, marginTop: "4px" }}>{score.fluency}%</div>
                  </div>
                </div>

                <div style={{ marginTop: "16px" }}>
                  <h4 style={{ fontWeight: 600, color: "var(--muted)", fontSize: "14px", marginBottom: "12px" }}>Chi tiết lỗi:</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {score.diff.map((d, i) => (
                      <span key={i} style={{ 
                        padding: "6px 10px", 
                        borderRadius: "8px", 
                        fontSize: "15px",
                        fontWeight: 500,
                        background: d.type === 'match' ? "rgba(16, 185, 129, 0.1)" : d.type === 'missing' ? "rgba(239, 68, 68, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        color: d.type === 'match' ? "#065f46" : d.type === 'missing' ? "#991b1b" : "#92400e",
                        textDecoration: d.type === 'missing' ? 'line-through' : 'none'
                      }}>
                        {d.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div style={{ textAlign: "center", fontSize: "14px", color: "var(--soft)", paddingBottom: "40px", fontWeight: 600 }}>
          Đoạn {currentIdx + 1} / {segments.length}
        </div>
      </div>
    </div>
  );
}
