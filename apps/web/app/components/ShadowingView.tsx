"use client";

/**
 * Path: apps/web/app/components/ShadowingView.tsx
 *
 * Redesign 2026-05-25 (PR-Shadowing-Redesign).
 *
 * Fixes the previous version's biggest problems:
 *   - Topic suggestions are now PROFILE-AWARE. A user who picked
 *     "mất gốc / foundation A1" sees beginner topics like "Chào hỏi"
 *     and "Sinh hoạt hàng ngày", not "TED Talks".
 *   - Hardcoded styles → uses .ll-shadowing-* CSS classes from
 *     globals.css that match the rest of the design system.
 *   - Search query is augmented with topic-specific hints
 *     (not just "english conversation subtitle" for everything).
 *   - Clip cards show CEFR estimate + warning when a clip is
 *     significantly above the user's level.
 *
 * Layout: 4 zones
 *   Zone 1  hero card with greeting + profile context
 *   Zone 2  search box (paste YouTube URL OR type topic)
 *   Zone 3  recommended topic grid (filtered to profile)
 *   Zone 4  "Clip bạn đã luyện" history grid
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { ShadowingPlayer } from "./ShadowingPlayer";
import {
  estimateClipCefr,
  recommendTopicsFor,
  type ShadowingTopic,
} from "../lib/shadowing-topics";
import { loadProfileFromStorage } from "../lib/recommend-engine";
import { buildVocabBoost } from "../lib/shadowing-link";
import type { CEFRLevel } from "../placement/_lib/types";

interface SavedClip {
  id: string;
  youtubeId: string;
  title: string;
  durationSec: number;
  cefrEstimate: string;
  topics: string[];
  segments: ClipSegment[];
}

interface ClipSegment {
  start: number;
  end: number;
  text_en: string;
  text_vi?: string;
}

interface YouTubeSearchHit {
  id: { videoId: string };
  snippet: { title: string; channelTitle: string };
}

interface Playlist {
  id: string;
  title: string;
  clips: { order: number; clip: SavedClip }[];
}

export function ShadowingView() {
  const [clips, setClips] = useState<SavedClip[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activeTab, setActiveTab] = useState<"clips" | "playlists">("clips");
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [addingClipToPlaylist, setAddingClipToPlaylist] = useState<SavedClip | null>(null);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [activeClip, setActiveClip] = useState<SavedClip | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile state — read from localStorage first (works without login);
  // when authenticated user has DB profile, /api/profile takes over.
  const [profile, setProfile] = useState<{
    cefr: CEFRLevel;
    primaryGoal: string;
  } | null>(null);

  useEffect(() => {
    // 1. Local placement profile
    const local = loadProfileFromStorage();
    if (local) {
      setProfile({ cefr: local.cefr, primaryGoal: local.primaryGoal });
    }

    // 2. In parallel, try server profile (may override / supplement)
    Promise.all([
      fetch("/api/shadowing/clips")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/shadowing/playlists")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/profile")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([clipsData, playlistsData, profileData]) => {
      if (Array.isArray(clipsData)) setClips(clipsData);
      if (Array.isArray(playlistsData)) setPlaylists(playlistsData);
      if (profileData?.cefr && profileData?.primaryGoal) {
        setProfile({
          cefr: profileData.cefr,
          primaryGoal: profileData.primaryGoal,
        });
      }
      setLoading(false);
    });
  }, []);

  const recommendedTopics = useMemo<ShadowingTopic[]>(
    () =>
      recommendTopicsFor({
        primaryGoal: (profile?.primaryGoal as any) ?? null,
        cefr: profile?.cefr ?? null,
        maxResults: 6,
      }),
    [profile?.primaryGoal, profile?.cefr],
  );

  // ─── Search / pick topic flow ──────────────────────────────────
  const handlePickTopic = (t: ShadowingTopic) => {
    runQuery(t.searchQuery, t);
  };

  const handleSubmitSearch = () => {
    const q = searchInput.trim();
    if (!q) return;

    // Detect YouTube URL paste
    const urlMatch = q.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
    );
    if (urlMatch) {
      ingestVideoId(urlMatch[1], q);
      return;
    }
    runQuery(q, null);
  };

  const runQuery = async (
    rawQuery: string,
    topic: ShadowingTopic | null,
  ) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      // Augment with profile context AND user's recent vocab so YouTube
      // returns videos containing words the user is actively studying.
      // (e.g. learning "budget" + "meeting" right now → favor clips with
      // those words.)
      const vocabBoost = buildVocabBoost();
      const baseQuery = topic ? topic.searchQuery : rawQuery;
      const cefrHint =
        profile?.cefr === "A1" || profile?.cefr === "A2" ? "beginner slow" : "";
      const fullQuery = [vocabBoost, baseQuery, cefrHint, "english"]
        .filter(Boolean)
        .join(" ")
        .trim();

      const searchRes = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(fullQuery)}`,
      );
      if (!searchRes.ok) {
        const err = await searchRes.json().catch(() => ({}));
        setErrorMsg(err.error ?? "Không tìm được video phù hợp.");
        return;
      }
      const searchData = (await searchRes.json()) as YouTubeSearchHit[];
      if (!searchData.length) {
        setErrorMsg("Không tìm thấy video nào có phụ đề cho chủ đề này.");
        return;
      }

      // Pick the first hit with usable transcript
      let savedClip: SavedClip | null = null;
      for (const video of searchData.slice(0, 5)) {
        const videoId = video.id?.videoId;
        if (!videoId) continue;
        savedClip = await ingestVideoId(videoId, video.snippet.title, topic);
        if (savedClip) break;
      }
      if (!savedClip) {
        setErrorMsg(
          "Các video tìm thấy đều chưa có phụ đề tiếng Anh. Thử chủ đề khác hoặc dán link cụ thể.",
        );
      }
    } catch (e) {
      console.error("[shadowing] search failed", e);
      setErrorMsg("Có lỗi mạng khi tìm video. Hãy thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const ingestVideoId = async (
    videoId: string,
    title: string,
    topic?: ShadowingTopic | null,
  ): Promise<SavedClip | null> => {
    try {
      const trRes = await fetch(`/api/youtube/transcript?videoId=${videoId}`);
      if (!trRes.ok) return null;
      const segments = (await trRes.json()) as ClipSegment[];
      if (!Array.isArray(segments) || segments.length === 0) return null;

      const estimatedCefr = estimateClipCefr(segments);

      const clipData = {
        youtubeId: videoId,
        title,
        durationSec: segments[segments.length - 1]?.end ?? 60,
        cefrEstimate: estimatedCefr,
        topics: topic ? [topic.id] : [],
        segments,
      };

      const saveRes = await fetch("/api/shadowing/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clipData),
      });
      const saved = (await saveRes.json()) as SavedClip;
      setClips((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
      setActiveClip(saved);
      return saved;
    } catch (e) {
      console.warn("[shadowing] ingest failed", e);
      return null;
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistTitle.trim()) return;
    try {
      const res = await fetch("/api/shadowing/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newPlaylistTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists([data, ...playlists]);
        setNewPlaylistTitle("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddClipToPlaylist = async (playlistId: string) => {
    if (!addingClipToPlaylist) return;
    try {
      const res = await fetch("/api/shadowing/playlists/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId, clipId: addingClipToPlaylist.id }),
      });
      if (res.ok) {
        // Refresh playlists
        const plRes = await fetch("/api/shadowing/playlists");
        const plData = await plRes.json();
        setPlaylists(plData);
        setAddingClipToPlaylist(null);
      } else {
        alert("Video này có thể đã tồn tại trong danh sách phát.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Render player full-screen when active ─────────────────────
  if (activeClip) {
    return (
      <ShadowingPlayer
        clipId={activeClip.id}
        youtubeId={activeClip.youtubeId}
        title={activeClip.title}
        segments={activeClip.segments}
        topicIds={activeClip.topics ?? []}
        onClose={() => setActiveClip(null)}
      />
    );
  }

  return (
    <div className="ll-shadowing-v2">
      {/* ── Zone 1 — Hero with profile context ───────────────────── */}
      <motion.header
        className="ll-shadow-hero"
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span className="ll-shadow-eyebrow">Luyện phát âm · Shadowing</span>
        <h2 className="ll-shadow-title">
          Nghe và <span className="ll-accent">nhại theo</span> giọng người bản xứ
        </h2>
        {profile ? (
          <p className="ll-shadow-sub">
            Lộ trình của bạn: <strong>{describeGoalVi(profile.primaryGoal)}</strong>{" "}
            · trình độ <strong>{profile.cefr}</strong>. Chủ đề bên dưới được
            chọn riêng cho bạn.
          </p>
        ) : (
          <p className="ll-shadow-sub">
            Để có chủ đề phù hợp hơn, hãy{" "}
            <a href="/placement" className="ll-shadow-link">
              làm bài kiểm tra xếp lớp
            </a>{" "}
            trước.
          </p>
        )}
      </motion.header>

      {/* ── Zone 2 — Search box ───────────────────────────────────── */}
      <section className="ll-shadow-search">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitSearch()}
          placeholder="Dán link YouTube hoặc gõ chủ đề (ví dụ: ordering food)"
          className="ll-shadow-search-input"
          disabled={isProcessing}
        />
        <button
          type="button"
          onClick={handleSubmitSearch}
          disabled={isProcessing || !searchInput.trim()}
          className="ll-shadow-search-btn"
        >
          {isProcessing ? "Đang xử lý..." : "Bắt đầu"}
        </button>
      </section>

      {errorMsg && (
        <motion.div
          className="ll-shadow-error"
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {errorMsg}
        </motion.div>
      )}

      {/* ── Zone 3 — Recommended topics ───────────────────────────── */}
      <section>
        <header className="ll-shadow-section-head">
          <h3>Gợi ý cho bạn</h3>
          <span className="ll-shadow-section-sub">
            {profile
              ? `${recommendedTopics.length} chủ đề phù hợp trình độ ${profile.cefr}`
              : "Khám phá theo chủ đề"}
          </span>
        </header>

        {recommendedTopics.length === 0 ? (
          <p className="ll-shadow-empty">
            Chưa có chủ đề khớp. Hãy thử gõ chủ đề riêng phía trên.
          </p>
        ) : (
          <div className="ll-shadow-topics">
            {recommendedTopics.map((t) => (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => handlePickTopic(t)}
                disabled={isProcessing}
                className="ll-shadow-topic-card"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="ll-shadow-topic-emoji" aria-hidden="true">
                  {t.emoji}
                </span>
                <span className="ll-shadow-topic-title">{t.labelVi}</span>
                <span className="ll-shadow-topic-desc">{t.descVi}</span>
                <span className="ll-shadow-topic-levels">
                  {t.levels.join(" · ")}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* ── Zone 4 — History & Playlists ──────────────────────────────────────── */}
      <section>
        <header className="ll-shadow-section-head" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '24px', borderBottom: '2px solid var(--line)', paddingBottom: '0' }}>
            <button 
              onClick={() => setActiveTab("clips")}
              style={{ padding: '0 0 12px 0', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '18px', cursor: 'pointer', borderBottom: activeTab === "clips" ? '2px solid var(--ink)' : '2px solid transparent', color: activeTab === "clips" ? 'var(--ink)' : 'var(--muted)', marginBottom: '-2px' }}
            >
              Tất cả Clip
            </button>
            <button 
              onClick={() => setActiveTab("playlists")}
              style={{ padding: '0 0 12px 0', border: 'none', background: 'transparent', fontWeight: 700, fontSize: '18px', cursor: 'pointer', borderBottom: activeTab === "playlists" ? '2px solid var(--ink)' : '2px solid transparent', color: activeTab === "playlists" ? 'var(--ink)' : 'var(--muted)', marginBottom: '-2px' }}
            >
              Danh sách phát
            </button>
          </div>
        </header>

        {loading ? (
          <div className="ll-shadow-loader">
            <div className="ll-shadow-spinner" />
          </div>
        ) : activeTab === "clips" ? (
          clips.length === 0 ? (
            <p className="ll-shadow-empty">
              Sau khi bạn luyện xong một clip, nó sẽ xuất hiện ở đây để ôn lại.
            </p>
          ) : (
            <div className="ll-shadow-clip-grid">
              {clips.map((clip, index) => (
                <ClipCard
                  key={clip.id || `clip-${index}`}
                  clip={clip}
                  userCefr={profile?.cefr}
                  onPick={() => setActiveClip(clip)}
                  onDelete={async () => {
                    if (!confirm("Bạn có chắc chắn muốn xóa video này khỏi lịch sử luyện tập không?")) return;
                    try {
                      const res = await fetch(`/api/shadowing/clips?id=${clip.id}`, { method: 'DELETE' });
                      if (res.ok) {
                        setClips(prev => prev.filter(c => c.id !== clip.id));
                      }
                    } catch (e) {
                      console.error("Failed to delete clip", e);
                    }
                  }}
                  onAddToPlaylist={() => setAddingClipToPlaylist(clip)}
                />
              ))}
            </div>
          )
        ) : activePlaylist ? (
          // PLAYLIST DETAIL VIEW
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button onClick={() => setActivePlaylist(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--line)', background: 'white', cursor: 'pointer', fontWeight: 600 }}>← Quay lại</button>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>{activePlaylist.title}</h3>
            </div>
            {activePlaylist.clips.length === 0 ? (
              <p className="ll-shadow-empty">Danh sách phát này chưa có video nào.</p>
            ) : (
              <div className="ll-shadow-clip-grid">
                {activePlaylist.clips.map((pc, index) => (
                  <ClipCard
                    key={`pl-clip-${index}`}
                    clip={pc.clip}
                    userCefr={profile?.cefr}
                    onPick={() => setActiveClip(pc.clip)}
                    onDelete={async () => {
                       if (!confirm("Xóa khỏi danh sách phát?")) return;
                       try {
                         const res = await fetch(`/api/shadowing/playlists/clips?playlistId=${activePlaylist.id}&clipId=${pc.clip.id}`, { method: 'DELETE' });
                         if (res.ok) {
                           const plRes = await fetch("/api/shadowing/playlists");
                           const plData = await plRes.json();
                           setPlaylists(plData);
                           const updatedActive = plData.find((p: any) => p.id === activePlaylist.id);
                           setActivePlaylist(updatedActive || null);
                         }
                       } catch (e) {}
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // PLAYLIST GRID
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="Tên danh sách phát mới..." 
                value={newPlaylistTitle}
                onChange={e => setNewPlaylistTitle(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--line)', fontSize: '15px' }}
                onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
              />
              <button 
                onClick={handleCreatePlaylist}
                style={{ padding: '0 24px', borderRadius: '12px', background: 'var(--ink)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Tạo mới
              </button>
            </div>
            
            {playlists.length === 0 ? (
              <p className="ll-shadow-empty">Bạn chưa có danh sách phát nào.</p>
            ) : (
              <div className="ll-shadow-clip-grid">
                {playlists.map((pl) => (
                  <motion.button
                    key={pl.id}
                    onClick={() => setActivePlaylist(pl)}
                    className="ll-shadow-clip"
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.99 }}
                    style={{ textAlign: 'left', minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}
                  >
                    <h4 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>{pl.title}</h4>
                    <span style={{ color: 'var(--muted)', fontSize: '14px' }}>{pl.clips?.length || 0} video</span>
                    
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm("Xóa danh sách phát này?")) return;
                        try {
                          const res = await fetch(`/api/shadowing/playlists?id=${pl.id}`, { method: 'DELETE' });
                          if (res.ok) {
                            setPlaylists(prev => prev.filter(p => p.id !== pl.id));
                            if (activePlaylist?.id === pl.id) setActivePlaylist(null);
                          }
                        } catch (err) {}
                      }}
                      style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* MODAL: Thêm vào Playlist */}
      {addingClipToPlaylist && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div style={{ background: 'white', padding: '24px', borderRadius: '24px', width: '90%', maxWidth: '400px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px' }}>Thêm vào Danh sách phát</h3>
              {playlists.length === 0 ? (
                <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>Chưa có danh sách phát nào. Hãy quay lại tạo danh sách phát mới nhé.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                  {playlists.map(pl => (
                    <button 
                      key={pl.id}
                      onClick={() => handleAddClipToPlaylist(pl.id)}
                      style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--line)', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {pl.title}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setAddingClipToPlaylist(null)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
           </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────────────────────────────────── */

function ClipCard({
  clip,
  userCefr,
  onPick,
  onDelete,
  onAddToPlaylist,
}: {
  clip: SavedClip;
  userCefr?: CEFRLevel;
  onPick: () => void;
  onDelete: () => void;
  onAddToPlaylist?: () => void;
}) {
  const tooHard = useMemo(() => {
    if (!userCefr) return false;
    const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
    return (
      order.indexOf(clip.cefrEstimate) - order.indexOf(userCefr) >= 2
    );
  }, [clip.cefrEstimate, userCefr]);

  const mm = Math.floor(clip.durationSec / 60);
  const ss = String(clip.durationSec % 60).padStart(2, "0");

  return (
    <div className="ll-shadow-clip-wrapper" style={{ position: 'relative' }}>
      <motion.button
        type="button"
        onClick={onPick}
        className="ll-shadow-clip"
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        style={{ width: '100%', textAlign: 'left' }}
      >
        <div className="ll-shadow-clip-thumb">
          <img
            src={`https://i.ytimg.com/vi/${clip.youtubeId}/mqdefault.jpg`}
            alt={clip.title}
            loading="lazy"
          />
          <span className="ll-shadow-clip-duration">
            {mm}:{ss}
          </span>
        </div>
        <div className="ll-shadow-clip-body">
          <h4
            className="ll-shadow-clip-title"
            dangerouslySetInnerHTML={{ __html: clip.title }}
          />
          <div className="ll-shadow-clip-meta">
            <span
              className={`ll-shadow-clip-cefr ${
                tooHard ? "ll-shadow-clip-cefr--warn" : ""
              }`}
            >
              {clip.cefrEstimate}
              {tooHard && " (khó)"}
            </span>
            <span className="ll-shadow-clip-segs">
              {clip.segments.length} đoạn
            </span>
          </div>
        </div>
      </motion.button>
      
      {/* Add to playlist button */}
      {onAddToPlaylist && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist();
          }}
          className="ll-shadow-clip-add"
          title="Thêm vào danh sách phát"
          style={{
            position: 'absolute',
            top: '8px',
            right: '40px',
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            opacity: 0.8,
            transition: 'all 0.2s',
            fontSize: '18px',
            paddingBottom: '2px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          +
        </button>
      )}

      {/* Delete button positioned absolute */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ll-shadow-clip-delete"
        title="Xóa khỏi lịch sử"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          opacity: 0.8,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ✕
      </button>
    </div>
  );
}

function describeGoalVi(goal: string): string {
  switch (goal) {
    case "work":
      return "Tiếng Anh công việc";
    case "exam":
      return "Luyện thi";
    case "foundation":
      return "Lấy lại căn bản";
    case "travel":
      return "Giao tiếp du lịch";
    default:
      return "Học cá nhân";
  }
}
