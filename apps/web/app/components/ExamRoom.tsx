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
  { id: "jfKfPfyJRdk", name: "Lofi Girl", author: "Hip Hop Radio" },
  { id: "4xDzrJKXOOY", name: "Synthwave", author: "Lofi Boy" },
  { id: "7NOSDKb0HlU", name: "Chillhop", author: "Raccoon Radio" }
];

function extractYoutubeId(input: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = input.match(regExp);
  return (match && match[2].length === 11) ? match[2] : input.trim();
}

const MusicWave = ({ isPlaying }: { isPlaying: boolean }) => (
  <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "18px" }}>
    {[0.2, 0.4, 0.1, 0.5, 0.3].map((delay, i) => (
      <motion.div
        key={i}
        animate={isPlaying ? { scaleY: [0.3, 1, 0.3] } : { scaleY: 0.1 }}
        transition={isPlaying ? { duration: 0.9, repeat: Infinity, ease: "easeInOut", delay } : { duration: 0.3 }}
        style={{ width: "4px", height: "100%", background: "#10b981", borderRadius: "99px", transformOrigin: "bottom" }}
      />
    ))}
  </div>
);

export function ExamRoom({ examId, onExit }: { examId: string, onExit: () => void }) {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusic, setShowMusic] = useState(true);
  const [isMusicMinimized, setIsMusicMinimized] = useState(false);
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
        if (data.error || !data.parts) {
          console.error("Exam error:", data.error);
          setExamData(null);
        } else {
          setExamData(data);
          if (data.durationMin) setDurationMinutes(data.durationMin);
        }
        setLoadingExam(false);
      })
      .catch(err => {
        console.error("Failed to load exam", err);
        setExamData(null);
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

      {/* YouTube Iframe Audio Player Widget (Vinyl Design) */}
      {showMusic && (
        <AnimatePresence>
          {!isMusicMinimized ? (
            <motion.div 
              key="player"
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              style={{ 
                position: "fixed", bottom: "32px", right: "32px", zIndex: 100, 
                background: "rgba(17, 24, 39, 0.75)", backdropFilter: "blur(24px)", 
                padding: "24px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)", 
                width: "440px", display: "flex", gap: "24px", boxShadow: "0 30px 60px -12px rgba(0,0,0,0.5)"
              }}
              drag
              dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
            >
              {/* Vinyl Record */}
              <div style={{ position: "relative", width: "120px", height: "120px", flexShrink: 0, cursor: "grab" }}>
                {/* Playhead Arm (Decorative) */}
                <div style={{ position: "absolute", top: "-10px", right: "-10px", width: "40px", height: "80px", borderRight: "4px solid #9ca3af", borderTop: "4px solid #9ca3af", borderRadius: "0 16px 0 0", transformOrigin: "top right", transform: isYtPlaying ? "rotate(15deg)" : "rotate(-10deg)", transition: "transform 0.5s ease-in-out", zIndex: 10, pointerEvents: "none" }} />
                
                <motion.div
                  animate={{ rotate: isYtPlaying ? 360 : 0 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  style={{
                    width: "100%", height: "100%", borderRadius: "50%",
                    background: "repeating-radial-gradient(circle at center, #111 0, #111 4px, #222 5px, #222 6px)",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.8)",
                    display: "flex", justifyContent: "center", alignItems: "center", position: "relative", zIndex: 5
                  }}
                >
                  {/* Glossy reflection on vinyl */}
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%)", pointerEvents: "none" }} />
                  
                  {/* Label / Thumbnail in center */}
                  <div style={{
                    width: "44px", height: "44px", borderRadius: "50%",
                    backgroundImage: `url(https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg)`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    border: "2px solid #10b981", position: "relative", zIndex: 6
                  }}>
                    {/* Spindle hole */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "8px", height: "8px", background: "#111", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)" }} />
                  </div>
                </motion.div>
              </div>

              {/* Info & Controls */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ overflow: "hidden", flex: 1, position: "relative", height: "45px" }}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={ytVideoId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: "absolute", inset: 0 }}
                      >
                        <div style={{ fontWeight: "900", fontSize: "20px", color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "1px", textTransform: "uppercase" }}>
                          {PRESET_YOUTUBE_IDS.find(p => p.id === ytVideoId)?.name || "Custom Track"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase" }}>
                          {PRESET_YOUTUBE_IDS.find(p => p.id === ytVideoId)?.author || "YouTube Audio"}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => setIsMusicMinimized(true)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "16px", padding: "4px" }} className="exam-option-hover" title="Thu nhỏ (Ẩn vào tường)">_</button>
                    <button onClick={() => setShowMusic(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "20px", padding: "4px" }} className="exam-option-hover" title="Đóng">×</button>
                  </div>
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <button 
                    onClick={toggleYtPlay}
                    style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "50%", background: "white", color: "black", border: "none", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 12px rgba(255,255,255,0.2)", transition: "transform 0.1s" }}
                    onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
                    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    {isYtPlaying ? "⏸" : "▶"}
                  </button>
                  <div style={{ flexShrink: 0 }}><MusicWave isPlaying={isYtPlaying} /></div>
                  <input type="range" min="0" max="100" value={ytVolume} onChange={e => setYtVolume(Number(e.target.value))} style={{ flex: 1, accentColor: "#10b981", height: "4px", cursor: "pointer" }} />
                </div>

                {/* Playlist mini */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center", width: "100%" }}>
                  {PRESET_YOUTUBE_IDS.map((preset, idx) => (
                    <div
                      key={preset.id}
                      onClick={() => { setYtVideoId(preset.id); setIsYtPlaying(true); }}
                      style={{
                        width: "38px", height: "38px", flexShrink: 0, borderRadius: "6px", cursor: "pointer",
                        backgroundImage: `url(https://img.youtube.com/vi/${preset.id}/mqdefault.jpg)`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        border: ytVideoId === preset.id ? "2px solid #10b981" : "2px solid transparent",
                        opacity: ytVideoId === preset.id ? 1 : 0.4,
                        transition: "all 0.2s",
                        position: "relative"
                      }}
                      className="exam-option-hover"
                    >
                      <div style={{ position: "absolute", bottom: "-6px", right: "-6px", background: "#111827", color: "white", fontSize: "10px", width: "16px", height: "16px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", zIndex: 2 }}>
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                  
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minWidth: "60px" }}>
                    <input 
                      type="text" 
                      placeholder="Dán URL YouTube..." 
                      value={ytCustomId}
                      onChange={e => setYtCustomId(e.target.value)}
                      onKeyDown={e => { if(e.key === "Enter" && ytCustomId) { setYtVideoId(extractYoutubeId(ytCustomId)); setIsYtPlaying(true); } }}
                      style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.2)", padding: "4px 0", color: "white", fontSize: "11px", outline: "none", transition: "all 0.2s" }}
                      onFocus={e => e.target.style.borderBottom = "1px solid #10b981"}
                      onBlur={e => e.target.style.borderBottom = "1px solid rgba(255,255,255,0.2)"}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="minimized"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => setIsMusicMinimized(false)}
              style={{
                position: "fixed", bottom: "32px", right: "0", zIndex: 100,
                background: "rgba(17, 24, 39, 0.9)", backdropFilter: "blur(12px)",
                padding: "12px 16px", borderRadius: "100px 0 0 100px", border: "1px solid rgba(255,255,255,0.1)",
                borderRight: "none", display: "flex", alignItems: "center", gap: "12px",
                cursor: "pointer", boxShadow: "-5px 5px 20px rgba(0,0,0,0.5)",
              }}
              className="exam-option-hover"
            >
              <motion.div
                animate={{ rotate: isYtPlaying ? 360 : 0 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                style={{ width: "24px", height: "24px", borderRadius: "50%", background: "repeating-radial-gradient(circle at center, #111 0, #111 2px, #222 3px, #222 4px)", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid #10b981" }}
              >
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundImage: `url(https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg)`, backgroundSize: "cover" }} />
              </motion.div>
              <span style={{ color: "white", fontSize: "13px", fontWeight: "bold" }}>Lofi Player</span>
              <MusicWave isPlaying={isYtPlaying} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Hidden YouTube Player */}
      {showMusic && (
        <div style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: "10px", height: "10px", overflow: "hidden" }}>
            <iframe 
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${ytVideoId}?enablejsapi=1&autoplay=1&controls=0`}
              allow="autoplay"
              width="10" height="10"
              title="YouTube Lofi Background"
            />
          </div>
        </motion.div>
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
                    {examData.parts?.map((part: any) => (
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
                    {examData.parts?.map((part: any) => (
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
