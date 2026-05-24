"use client"
import { useState, useEffect } from "react";
import { ShadowingPlayer } from "./ShadowingPlayer";

export function ShadowingView() {
  const [clips, setClips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClip, setActiveClip] = useState<any | null>(null);
  const [isProcessingNew, setIsProcessingNew] = useState(false);

  useEffect(() => {
    fetch("/api/shadowing/clips")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClips(data);
        setLoading(false);
      });
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsProcessingNew(true);
    try {
      // 1. Search YouTube
      const searchRes = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
      const searchData = await searchRes.json();
      
      if (searchData.length > 0) {
        const video = searchData[0];
        const videoId = video.id.videoId;
        
        // 2. Fetch transcript
        const transcriptRes = await fetch(`/api/youtube/transcript?videoId=${videoId}`);
        const segments = await transcriptRes.json();
        
        if (Array.isArray(segments) && segments.length > 0) {
          // 3. Save to DB
          const clipData = {
            youtubeId: videoId,
            title: video.snippet.title,
            durationSec: segments[segments.length - 1].end,
            cefrEstimate: "B1",
            topics: ["Custom Search"],
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
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Shadowing (Nhại giọng)</h1>
      <p className="text-gray-500 mb-8">Luyện tập phát âm bằng cách nghe và lặp lại các đoạn video thực tế.</p>
      
      <div className="flex gap-4 mb-10 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Dán link YouTube hoặc tìm kiếm chủ đề..." 
          className="flex-1 px-4 py-3 bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 transition"
        />
        <button 
          onClick={handleSearch}
          disabled={isProcessingNew}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isProcessingNew ? "Đang xử lý..." : "Bắt đầu học"}
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Clip được đề xuất</h2>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl text-gray-400">
          Chưa có clip nào. Hãy thử tìm kiếm ở trên!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clips.map(clip => (
            <div 
              key={clip.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition cursor-pointer group flex flex-col"
              onClick={() => setActiveClip(clip)}
            >
              <div className="aspect-video relative overflow-hidden bg-gray-200">
                <img 
                  src={`https://i.ytimg.com/vi/${clip.youtubeId}/mqdefault.jpg`} 
                  alt={clip.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition"></div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {Math.round(clip.durationSec / 60)}:{String(clip.durationSec % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition" dangerouslySetInnerHTML={{__html: clip.title}}></h3>
                <div className="mt-auto flex items-center justify-between text-xs font-medium">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{clip.cefrEstimate}</span>
                  <span className="text-blue-600">{clip.segments.length} đoạn</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
