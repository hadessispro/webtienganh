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

// Ensure TypeScript knows about window.SpeechRecognition
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
    // Send message to YouTube iframe to seek and play
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

      // Stop after segment duration
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

    // Save attempt to backend
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
    <div className="fixed inset-0 bg-white/95 z-50 flex flex-col pt-16">
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Luyện Shadowing</h2>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg font-medium hover:bg-gray-200">
            Đóng
          </button>
        </div>

        <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-lg">
          <iframe
            ref={videoRef}
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media"
          ></iframe>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 shadow-inner text-center min-h-[120px] flex items-center justify-center">
          <p className="text-xl md:text-2xl font-medium leading-relaxed">
            {currentSegment.text_en}
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <button 
            onClick={prevSegment}
            disabled={currentIdx === 0}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 disabled:opacity-50"
          >
            ←
          </button>
          
          <button 
            onClick={playSegment}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-md hover:bg-blue-600 transition"
          >
            ▶
          </button>

          <button 
            onClick={toggleRecording}
            className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md transition ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}
          >
            🎤
          </button>
          
          <button 
            onClick={nextSegment}
            disabled={currentIdx === segments.length - 1}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 disabled:opacity-50"
          >
            →
          </button>
        </div>

        {transcript && (
          <div className="mt-4 p-4 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Bạn vừa đọc:</h3>
            <p className="text-lg mb-4">{transcript}</p>
            
            {score && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                  <span className="font-medium text-green-800">Điểm tổng:</span>
                  <span className="text-2xl font-bold text-green-600">{score.overall}%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Độ chính xác</div>
                    <div className="font-semibold text-lg">{score.accuracy}%</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Trôi chảy</div>
                    <div className="font-semibold text-lg">{score.fluency}%</div>
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <h4 className="font-medium text-gray-600 mb-1">Chi tiết:</h4>
                  <div className="flex flex-wrap gap-1">
                    {score.diff.map((d, i) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded ${
                        d.type === 'match' ? 'bg-green-100 text-green-800' :
                        d.type === 'missing' ? 'bg-red-100 text-red-800 line-through' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {d.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="text-center text-sm text-gray-400">
          Đoạn {currentIdx + 1} / {segments.length}
        </div>
      </div>
    </div>
  );
}
