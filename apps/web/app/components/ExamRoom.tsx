"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function ExamRoom({ examId, onExit }: { examId: string, onExit: () => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25:00 for mock
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMusic, setShowMusic] = useState(true);

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

      {/* Main Focus Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}
      >
        <h2 style={{ fontSize: "36px", fontWeight: "bold", marginBottom: "8px", marginTop: 0 }}>Phiên tập trung làm bài</h2>
        <p style={{ opacity: 0.8, marginBottom: "32px", fontSize: "18px" }}>Tập trung tốt hơn, đạt điểm cao hơn</p>

        <div style={{ fontSize: "160px", fontWeight: "bold", lineHeight: 1, letterSpacing: "-2px", marginBottom: "32px", textShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          {formatTime(timeLeft)}
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: "12px 32px", background: "white", color: "black", borderRadius: "99px", fontWeight: "bold", fontSize: "18px", border: "none", cursor: "pointer" }}
          >
            {isPlaying ? "Tạm dừng" : "Bắt đầu tính giờ"}
          </button>
          <button 
            onClick={() => setTimeLeft(25 * 60)}
            style={{ padding: "12px 24px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: "99px", fontWeight: "500", border: "none", color: "white", cursor: "pointer" }}
          >
            Đặt lại
          </button>
        </div>
      </motion.div>

      {/* Lofi Music Player Widget */}
      {showMusic && (
        <div style={{ position: "absolute", bottom: "24px", right: "24px", zIndex: 20, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)", padding: "16px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", width: "320px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontWeight: "bold", fontSize: "14px" }}>🎵 Chill Lofi Radio</span>
            <button onClick={() => setShowMusic(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer" }}>Đóng</button>
          </div>
          <div style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9", background: "black" }}>
            <iframe 
              width="100%" 
              height="100%" 
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0&controls=1" 
              title="lofi hip hop radio" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "12px", textAlign: "center", marginBottom: 0 }}>Bật nhạc để tăng 200% khả năng tập trung</p>
        </div>
      )}
    </div>
  );
}
