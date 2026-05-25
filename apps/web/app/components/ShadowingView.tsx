"use client"
import { useState, useEffect } from "react";
import { ShadowingPlayer } from "./ShadowingPlayer";

export function ShadowingView() {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const [isProcessingNew, setIsProcessingNew] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/shadowing/clips").then(res => res.json()),
      fetch("/api/profile").then(res => res.json())
    ]).then(([clipsData, profileData]) => {
      if (Array.isArray(clipsData)) setClips(clipsData);
      if (profileData && profileData.cefr) setProfile(profileData);
      setLoading(false);
    });
  }, []);

  const handleSearch = async (queryToSearch?: string) => {
    const q = queryToSearch || searchQuery;
    if (!q) return;
    setIsProcessingNew(true);
    try {
      const searchRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(q + " english conversation subtitle")}`);
      const searchData = await searchRes.json();
      
      if (searchData.length > 0) {
        const video = searchData[0];
        const videoId = video.id.videoId;
        
        const transcriptRes = await fetch(`/api/youtube/transcript?videoId=${videoId}`);
        const segments = await transcriptRes.json();
        
        if (Array.isArray(segments) && segments.length > 0) {
          const clipData = {
            youtubeId: videoId,
            title: video.snippet.title,
            durationSec: segments[segments.length - 1].end,
            cefrEstimate: profile?.cefr || "B1",
            topics: [q],
            segments
          };
          
          const saveRes = await fetch("/api/shadowing/clips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clipData)
          });
          const savedClip = await saveRes.json();
          
          setClips(prev => [savedClip, ...prev]);
          setActiveClip(savedClip);
        } else {
          alert("Video này không có phụ đề (Closed Captions) phù hợp.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Có lỗi xảy ra khi lấy video từ YouTube.");
    }
    setIsProcessingNew(false);
  };

  if (activeClip) {
    return (
      <ShadowingPlayer 
        clipId={activeClip.id}
        youtubeId={activeClip.youtubeId}
        segments={activeClip.segments}
        onClose={() => setActiveClip(null)}
      />
    );
  }

  return (
    <div style={{ padding: "0 24px 64px" }}>
      <header className="ll-topbar ll-glass" style={{ marginBottom: "32px", padding: "32px", borderRadius: "24px" }}>
        <div>
          <div className="ll-label">Luyện phát âm</div>
          <h1 style={{ fontSize: "32px", margin: "8px 0" }}>Shadowing <span className="ll-accent">Nhại giọng</span></h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "16px" }}>Luyện tập phát âm bằng cách nghe và lặp lại các đoạn video thực tế.</p>
        </div>
      </header>

      <div className="ll-glass" style={{ display: "flex", gap: "16px", padding: "16px", borderRadius: "16px", marginBottom: "40px", alignItems: "center" }}>
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Dán link YouTube hoặc tìm kiếm chủ đề bạn muốn luyện tập..." 
          style={{ flex: 1, padding: "16px 20px", background: "var(--page)", border: "1px solid var(--line)", borderRadius: "12px", outline: "none", color: "var(--ink)", fontSize: "16px", minWidth: 0 }}
        />
        <button 
          onClick={() => handleSearch()}
          disabled={isProcessingNew}
          className="primary-button"
          style={{ padding: "0 32px", height: "54px", opacity: isProcessingNew ? 0.7 : 1, borderRadius: "12px", fontSize: "15px", flexShrink: 0 }}
        >
          {isProcessingNew ? "Đang xử lý..." : "Bắt đầu học"}
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--line)", borderTopColor: "var(--blue)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        </div>
      ) : clips.length === 0 ? (
        <div>
          <h2 style={{ fontSize: "20px", marginBottom: "8px", color: "var(--ink)", paddingLeft: "8px" }}>Gợi ý cho bạn</h2>
          <p style={{ paddingLeft: "8px", color: "var(--muted)", marginBottom: "24px" }}>Dựa trên trình độ <strong style={{color: "var(--blue)"}}>{profile?.cefr || 'A2'}</strong> và mục tiêu <strong style={{color: "var(--blue)"}}>{profile?.primaryGoal === 'work' ? 'Công việc' : 'Giao tiếp'}</strong> của bạn</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            {[
              { title: "Business Meetings", desc: "Giao tiếp trong phòng họp", icon: "💼" },
              { title: "Job Interview", desc: "Trả lời phỏng vấn trôi chảy", icon: "🤝" },
              { title: "TED Talks", desc: "Luyện giọng điệu thuyết trình", icon: "🎤" },
              { title: "Daily Conversation", desc: "Giao tiếp hàng ngày tự nhiên", icon: "☕" }
            ].map(topic => (
              <div 
                key={topic.title}
                className="ll-glass"
                style={{ padding: "24px", borderRadius: "20px", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "12px" }}
                onClick={() => {
                  setSearchQuery(topic.title);
                  handleSearch(topic.title);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = "var(--blue)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--line)";
                }}
              >
                <div style={{ fontSize: "32px" }}>{topic.icon}</div>
                <h3 style={{ fontSize: "18px", margin: 0, color: "var(--ink)" }}>{topic.title}</h3>
                <p style={{ margin: 0, color: "var(--soft)", fontSize: "14px" }}>{topic.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: "20px", marginBottom: "20px", color: "var(--ink)", paddingLeft: "8px" }}>Clip bạn đã luyện tập</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {clips.map(clip => (
            <div 
              key={clip.id} 
              className="ll-glass"
              style={{ borderRadius: "20px", overflow: "hidden", cursor: "pointer", transition: "transform 0.3s, box-shadow 0.3s", display: "flex", flexDirection: "column" }}
              onClick={() => setActiveClip(clip)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ position: "relative", aspectRatio: "16/9", background: "var(--line)" }}>
                <img 
                  src={`https://i.ytimg.com/vi/${clip.youtubeId}/mqdefault.jpg`} 
                  alt={clip.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", bottom: "12px", right: "12px", background: "rgba(0,0,0,0.7)", color: "white", fontSize: "12px", fontWeight: "600", padding: "4px 8px", borderRadius: "6px", backdropFilter: "blur(4px)" }}>
                  {Math.round(clip.durationSec / 60)}:{String(clip.durationSec % 60).padStart(2, '0')}
                </div>
              </div>
              <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: "16px", margin: "0 0 16px 0", color: "var(--ink)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.5" }} dangerouslySetInnerHTML={{__html: clip.title}}></h3>
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: 600 }}>
                  <span style={{ padding: "4px 10px", background: "var(--page)", borderRadius: "8px", color: "var(--muted)" }}>{clip.cefrEstimate}</span>
                  <span style={{ color: "var(--blue)" }}>{clip.segments.length} đoạn</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
