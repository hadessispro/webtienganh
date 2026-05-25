"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const QUOTES = [
  "Tập trung tốt hơn, đạt điểm cao hơn",
  "Học tập là hạt giống của kiến thức, kiến thức là hạt giống của hạnh phúc",
  "Kỷ luật là cầu nối giữa mục tiêu và thành tựu",
  "Không có áp lực, không có kim cương",
  "Thành công là sự lặp lại của những nỗ lực nhỏ mỗi ngày",
  "Đừng mong đích đến sẽ thay đổi nếu bạn không thay đổi con đường"
];

const AUDIO_TRACKS = [
  { id: "lofi", name: "Lofi Radio", url: "https://lofiradio.ru/lofi_mp3_128" },
  { id: "rain", name: "Tiếng Mưa Rơi", url: "https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg" },
  { id: "cafe", name: "Quán Cafe", url: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg" }
];

export function ExamRoom({ examId, onExit }: { examId: string, onExit: () => void }) {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusic, setShowMusic] = useState(true);
  const [isMiniMode, setIsMiniMode] = useState(false);
  
  const [examData, setExamData] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  
  const [quote, setQuote] = useState(QUOTES[0]);
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    
    // Fetch Exam
    fetch(`/api/exams/${examId}`)
      .then(res => res.json())
      .then(data => {
        setExamData(data);
        if (data.durationMin) setDurationMinutes(data.durationMin);
        setLoadingExam(false);
      })
      .catch(err => {
        console.error("Failed to load exam", err);
        setLoadingExam(false);
      });
  }, [examId]);

  useEffect(() => {
    setTimeLeft(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (activeAudio && audioRef.current) {
      const track = AUDIO_TRACKS.find(t => t.id === activeAudio);
      if (track) {
        audioRef.current.src = track.url;
        audioRef.current.play().catch(e => console.log("Audio play failed", e));
      }
    } else if (!activeAudio && audioRef.current) {
      audioRef.current.pause();
    }
  }, [activeAudio]);

  // Backgrounds for focus mode
  const backgrounds = [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop", // Forest
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop", // Beach
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop", // Mountains
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "white",
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgrounds[0]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Top Bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20 }}>
        <div style={{ fontWeight: "bold", fontSize: "20px", letterSpacing: "1px" }}>
          Focus Workspace <span style={{ opacity: 0.5, fontWeight: "normal", fontSize: "14px", marginLeft: "8px" }}>Phòng Thi Ảo</span>
        </div>
        <button 
          onClick={onExit}
          style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "8px", border: "none", color: "white", cursor: "pointer", fontWeight: "500" }}
        >
          Rời phòng
        </button>
      </div>

      {/* Main Focus Area (Full Screen) */}
      <AnimatePresence>
        {!isMiniMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -100 }}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}
          >
            <h2 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "8px", marginTop: 0 }}>Phiên tập trung làm bài</h2>
            <p style={{ opacity: 0.8, marginBottom: "32px", fontSize: "18px", fontStyle: "italic" }}>"{quote}"</p>

            <div style={{ fontSize: "160px", fontWeight: "bold", lineHeight: 1, letterSpacing: "-2px", marginBottom: "32px", textShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
              {formatTime(timeLeft)}
            </div>

            {!isPlaying && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
                {[25, 30, 45, 60].map(mins => (
                  <button 
                    key={mins}
                    onClick={() => setDurationMinutes(mins)}
                    style={{
                      padding: "6px 16px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.3)",
                      background: durationMinutes === mins ? "white" : "transparent",
                      color: durationMinutes === mins ? "black" : "white", cursor: "pointer", fontWeight: "500"
                    }}
                  >
                    {mins}p
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "16px" }}>
              <button 
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  if (!isPlaying) setIsMiniMode(true); // Auto mini mode when start
                }}
                style={{ padding: "12px 32px", background: "white", color: "black", borderRadius: "99px", fontWeight: "bold", fontSize: "18px", border: "none", cursor: "pointer" }}
              >
                {isPlaying ? "Tạm dừng" : "Bắt đầu làm bài"}
              </button>
              <button 
                onClick={() => setTimeLeft(durationMinutes * 60)}
                style={{ padding: "12px 24px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: "99px", fontWeight: "500", border: "none", color: "white", cursor: "pointer" }}
              >
                Đặt lại
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Native Audio Player Widget */}
      {showMusic && (
        <div style={{ position: "absolute", bottom: "24px", right: "24px", zIndex: 20, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", width: "320px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>🎵 Ambient Sound</span>
            <button onClick={() => setShowMusic(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer" }}>Đóng</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {AUDIO_TRACKS.map(track => (
              <button
                key={track.id}
                onClick={() => setActiveAudio(activeAudio === track.id ? null : track.id)}
                style={{
                  padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", textAlign: "left",
                  background: activeAudio === track.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                  color: activeAudio === track.id ? "white" : "rgba(255,255,255,0.7)",
                  fontWeight: activeAudio === track.id ? "bold" : "normal",
                  display: "flex", justifyContent: "space-between"
                }}
              >
                <span>{track.name}</span>
                {activeAudio === track.id && <span style={{ fontSize: "12px" }}>Đang phát...</span>}
              </button>
            ))}
          </div>

          <audio ref={audioRef} loop style={{ display: "none" }} />
          
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "12px", textAlign: "center", marginBottom: 0 }}>
            Tiếng ồn trắng (White noise) giúp tăng khả năng tập trung
          </p>
        </div>
      )}

      {/* Mini Timer & Exam Content Layer */}
      <AnimatePresence>
        {isMiniMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 15, display: "flex", flexDirection: "column" }}
          >
            {/* Top Bar with Mini Timer */}
            <div style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                <div style={{ fontSize: "36px", fontWeight: "bold", fontFamily: "monospace", letterSpacing: "-1px" }}>
                  {formatTime(timeLeft)}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setIsPlaying(!isPlaying)} style={{ padding: "6px 16px", borderRadius: "100px", border: "none", background: "white", color: "black", fontWeight: "bold", cursor: "pointer" }}>
                    {isPlaying ? "Tạm dừng" : "Tiếp tục"}
                  </button>
                  <button onClick={() => setIsMiniMode(false)} style={{ padding: "6px 16px", borderRadius: "100px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "white", cursor: "pointer" }}>
                    Phóng to
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
                Đề thi: {examData?.title || examId}
              </div>
            </div>

            {/* Split Screen Exam Content Area */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", background: "white", color: "black" }}>
              {loadingExam ? (
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>Đang tải đề thi...</div>
              ) : examData ? (
                <>
                  {/* Left Panel: Passage / Context */}
                  <div style={{ flex: 1, borderRight: "2px solid #e5e7eb", padding: "40px", overflowY: "auto", background: "#f9fafb" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "24px" }}>Nội dung bài thi</h2>
                    {examData.parts.map((part: any) => (
                      <div key={part.id} style={{ marginBottom: "40px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#059669" }}>{part.title}</h3>
                        {part.content && (
                          <div style={{ padding: "24px", background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", marginTop: "16px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                            {part.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right Panel: Questions */}
                  <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "24px" }}>Phiếu trả lời</h2>
                    {examData.parts.map((part: any) => (
                      <div key={`q-${part.id}`} style={{ marginBottom: "32px" }}>
                        {part.questions.map((q: any) => (
                          <div key={q.id} style={{ marginBottom: "32px", padding: "24px", background: "#f3f4f6", borderRadius: "12px" }}>
                            <p style={{ fontWeight: "600", fontSize: "16px", marginBottom: "16px" }}>
                              <span style={{ color: "#059669", marginRight: "8px" }}>Câu {q.order}:</span> {q.question}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {q.options?.map((ans: string, i: number) => (
                                <label key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer" }}>
                                  <input type="radio" name={`q${q.id}`} value={ans} />
                                  <span>{ans}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}

                    <button style={{ width: "100%", padding: "16px", background: "#059669", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginTop: "16px" }}>
                      Nộp Bài
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "red" }}>Không tìm thấy dữ liệu đề thi.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>    </div>
  );
}
