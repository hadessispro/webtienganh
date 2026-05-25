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

const PRESET_YOUTUBE_IDS = [
  { id: "jfKfPfyJRdk", name: "Lofi Girl (Hip Hop)" },
  { id: "4xDzrJKXOOY", name: "Synthwave Radio" },
  { id: "7NOSDKb0HlU", name: "Chillhop Music" }
];

function extractYoutubeId(input: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = input.match(regExp);
  return (match && match[2].length === 11) ? match[2] : input.trim();
}

export function ExamRoom({ examId, onExit }: { examId: string, onExit: () => void }) {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusic, setShowMusic] = useState(true);
  const [isMiniMode, setIsMiniMode] = useState(false);
  
  const [examData, setExamData] = useState<any>(null);
  const [loadingExam, setLoadingExam] = useState(true);
  
  const [quote, setQuote] = useState(QUOTES[0]);
  
  // YouTube API state
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ytVideoId, setYtVideoId] = useState(PRESET_YOUTUBE_IDS[0].id);
  const [ytCustomId, setYtCustomId] = useState("");
  const [isYtPlaying, setIsYtPlaying] = useState(true);
  const [ytVolume, setYtVolume] = useState(50);

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
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${ytVolume}]}`, '*');
    }
  }, [ytVolume]);

  const toggleYtPlay = () => {
    if (!iframeRef.current?.contentWindow) return;
    if (isYtPlaying) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      setIsYtPlaying(false);
    } else {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      setIsYtPlaying(true);
    }
  };

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
      {!isMiniMode && (
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
      )}

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

      {/* YouTube Iframe Audio Player Widget */}
      {showMusic && (
        <div style={{ position: "absolute", bottom: "24px", right: "24px", zIndex: 20, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.15)", width: "340px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontWeight: "bold", fontSize: "16px", color: "white" }}>🎵 YouTube Lofi API</span>
            <button onClick={() => setShowMusic(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer" }}>Đóng</button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingBottom: "4px" }}>
              {PRESET_YOUTUBE_IDS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => { setYtVideoId(preset.id); setIsYtPlaying(true); }}
                  style={{
                    padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
                    background: ytVideoId === preset.id ? "#10b981" : "rgba(255,255,255,0.1)",
                    color: "white", fontSize: "13px", fontWeight: "600", transition: "all 0.2s"
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input 
                type="text" 
                placeholder="Dán Link hoặc ID YouTube..." 
                value={ytCustomId}
                onChange={e => setYtCustomId(e.target.value)}
                style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "10px", color: "white", fontSize: "13px", outline: "none" }}
              />
              <button 
                onClick={() => { 
                  if(ytCustomId) { 
                    setYtVideoId(extractYoutubeId(ytCustomId)); 
                    setIsYtPlaying(true); 
                  } 
                }}
                style={{ background: "white", color: "black", border: "none", padding: "0 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
              >
                Phát
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "12px" }}>
              <button 
                onClick={toggleYtPlay}
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#10b981", color: "white", border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px" }}
              >
                {isYtPlaying ? "⏸" : "▶"}
              </button>
              <input 
                type="range" min="0" max="100" value={ytVolume} onChange={e => setYtVolume(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#10b981" }}
              />
            </div>
          </div>
          
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "16px", textAlign: "center", marginBottom: 0 }}>
            Sử dụng YouTube Iframe API. Video bị ẩn.
          </p>

          {/* Hidden YouTube Player */}
          <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: "10px", height: "10px", overflow: "hidden" }}>
            <iframe 
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${ytVideoId}?enablejsapi=1&autoplay=1&controls=0`}
              allow="autoplay"
              width="10" height="10"
              title="YouTube Lofi Background"
            />
          </div>
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
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontWeight: "600", color: "rgba(255,255,255,0.8)" }}>
                  Đề thi: {examData?.title || examId}
                </div>
                <button 
                  onClick={onExit}
                  style={{ padding: "6px 16px", background: "rgba(239, 68, 68, 0.8)", borderRadius: "100px", border: "none", color: "white", cursor: "pointer", fontWeight: "bold" }}
                >
                  Rời phòng
                </button>
              </div>
            </div>

            {/* Split Screen Exam Content Area */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", background: "white", color: "black", borderTop: "1px solid #e5e7eb" }}>
              {loadingExam ? (
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "500", color: "#6b7280" }}>
                  <span className="ll-spinner" style={{ marginRight: "12px" }}></span> Đang tải đề thi...
                </div>
              ) : examData ? (
                <>
                  {/* Left Panel: Passage / Context */}
                  <div style={{ flex: 1, borderRight: "2px solid #e5e7eb", padding: "40px", overflowY: "auto", background: "#f9fafb", scrollbarWidth: "thin" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "32px", color: "#111827" }}>Nội dung bài thi</h2>
                    {examData.parts.map((part: any) => (
                      <div key={part.id} style={{ marginBottom: "48px" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: "bold", color: "#059669", marginBottom: "16px", paddingBottom: "8px", borderBottom: "2px solid #d1fae5" }}>{part.title}</h3>
                        {part.content && (
                          <div style={{ padding: "32px", background: "white", borderRadius: "16px", border: "1px solid #e5e7eb", whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "16px", color: "#374151", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
                            {part.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right Panel: Questions */}
                  <div style={{ flex: 1, padding: "40px", overflowY: "auto", scrollbarWidth: "thin", background: "white" }}>
                    <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "32px", color: "#111827" }}>Phiếu trả lời</h2>
                    {examData.parts.map((part: any) => (
                      <div key={`q-${part.id}`} style={{ marginBottom: "40px" }}>
                        {part.questions.map((q: any) => (
                          <div key={q.id} style={{ marginBottom: "24px", padding: "24px", background: "#f9fafb", borderRadius: "16px", border: "1px solid #f3f4f6" }}>
                            <p style={{ fontWeight: "600", fontSize: "16px", marginBottom: "20px", color: "#1f2937", lineHeight: 1.5 }}>
                              <span style={{ color: "#059669", marginRight: "8px", background: "#d1fae5", padding: "4px 8px", borderRadius: "6px" }}>Câu {q.order}</span> {q.question}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              {q.options?.map((ans: string, i: number) => (
                                <label key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", background: "white", border: "2px solid #e5e7eb", borderRadius: "12px", cursor: "pointer", transition: "all 0.2s" }} className="exam-option-hover">
                                  <input type="radio" name={`q${q.id}`} value={ans} style={{ width: "20px", height: "20px", accentColor: "#059669" }} />
                                  <span style={{ fontSize: "15px", color: "#4b5563" }}>{ans}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}

                    <button style={{ width: "100%", padding: "20px", background: "#059669", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "18px", cursor: "pointer", marginTop: "24px", boxShadow: "0 10px 15px -3px rgba(5, 150, 105, 0.3)", transition: "all 0.2s" }} className="exam-submit-btn">
                      Nộp Bài
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", color: "red", fontSize: "18px" }}>Không tìm thấy dữ liệu đề thi.</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>    </div>
  );
}
