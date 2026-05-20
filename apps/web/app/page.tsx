"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calculateCompletionPercent,
  generateLearningPath,
  generatePracticeTest,
  generateTodayTasks,
  type Question
} from "./lib/learning-core";
import { KnowledgeTreeScene } from "./components/KnowledgeTreeScene";

type GoalKey = "exam" | "work" | "foundation";
type TimeKey = "5" | "10" | "15" | "25";
type SelectId = "language" | "level" | null;
type PlannerTab = "path" | "sound" | "space";
type TrackKey = "lofi" | "rain" | "deep" | "piano" | "cafe" | "brown" | "spotifyPop" | "spotifyAcoustic";
type ShadowLanguage = "en" | "ja" | "ko";
type ThemeMode = "light" | "dark";

const goals: Record<
  GoalKey,
  {
    label: string;
    short: string;
    description: string;
    accent: string;
    path: string[];
    today: string[];
    shadowing: string;
    testMode: string;
  }
> = {
  exam: {
    label: "Học để thi",
    short: "Thi",
    description: "Lộ trình theo mục tiêu điểm, deadline, mock test và câu hỏi đã kiểm duyệt.",
    accent: "blue",
    path: ["Placement test", "Lấp lỗ hổng ngữ pháp", "Reading drills", "Listening sets", "Mock test theo blueprint"],
    today: ["12 câu vocabulary", "1 passage reading", "5 phút chữa lỗi"],
    shadowing: "Clip nghe ngắn theo tốc độ đề thi",
    testMode: "Random đề từ question bank, không dùng AI sinh câu hỏi trực tiếp"
  },
  work: {
    label: "Giao tiếp công việc",
    short: "Công việc",
    description: "Kịch bản meeting, phỏng vấn, email, thuyết trình và AI roleplay có quota.",
    accent: "green",
    path: ["Đánh giá phản xạ", "Cụm câu công việc", "Roleplay có kịch bản", "Shadowing meeting", "Báo cáo tiến bộ tuần"],
    today: ["Warm-up 3 phút", "Roleplay meeting", "Shadowing 1 đoạn hội thoại"],
    shadowing: "Meeting: giving a short update",
    testMode: "Tạo bài luyện tình huống từ template và rubric"
  },
  foundation: {
    label: "Bổ túc kiến thức",
    short: "Nền tảng",
    description: "Vá lỗ hổng từ vựng, phát âm, ngữ pháp và nghe đọc cơ bản bằng micro-lesson.",
    accent: "violet",
    path: ["Skill map đầu vào", "Micro grammar", "SRS flashcards", "Listening basics", "Review thích nghi"],
    today: ["8 flashcards", "1 mini grammar", "Typing correction"],
    shadowing: "Phát âm câu ngắn và nhịp điệu cơ bản",
    testMode: "Quiz nhỏ từ bài đã học, tự động lặp lại điểm yếu"
  }
};

const timeOptions: TimeKey[] = ["5", "10", "15", "25"];
const languages = ["Tiếng Anh", "Tiếng Nhật", "Tiếng Hàn", "Tiếng Trung"];
const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const shadowLanguages: Record<ShadowLanguage, string> = {
  en: "English",
  ja: "日本語",
  ko: "한국어"
};
const shadowCatalog: Record<
  ShadowLanguage,
  Array<{ title: string; level: string; duration: string; source: string; focus: string; line: string }>
> = {
  en: [
    {
      title: "Meeting update",
      level: "A2-B1",
      duration: "2:10",
      source: "Own clip",
      focus: "Work speaking",
      line: "Could you walk me through the update?"
    },
    {
      title: "Cafe small talk",
      level: "A1-A2",
      duration: "1:35",
      source: "Licensed/CC",
      focus: "Daily rhythm",
      line: "Can I get a table by the window?"
    }
  ],
  ja: [
    {
      title: "コンビニで買い物",
      level: "N5-N4",
      duration: "1:45",
      source: "Own clip",
      focus: "Polite phrases",
      line: "温めますか。"
    },
    {
      title: "自己紹介",
      level: "N5",
      duration: "1:20",
      source: "Common Voice audio",
      focus: "Pitch accent",
      line: "はじめまして、よろしくお願いします。"
    }
  ],
  ko: [
    {
      title: "카페 주문하기",
      level: "TOPIK 1",
      duration: "1:40",
      source: "Own clip",
      focus: "Ordering",
      line: "아이스 아메리카노 하나 주세요."
    },
    {
      title: "회사 인사",
      level: "A2",
      duration: "1:25",
      source: "Licensed/CC",
      focus: "Work greeting",
      line: "오늘 회의는 몇 시에 시작해요?"
    }
  ]
};
const musicTracks: Record<
  TrackKey,
  { label: string; description: string; bestFor: string; source: "generated" | "spotify" }
> = {
  lofi: {
    label: "Lo-fi nhẹ",
    description: "Pad ấm, nhịp chậm, hợp học từ vựng và viết câu.",
    bestFor: "Bổ túc kiến thức",
    source: "generated"
  },
  rain: {
    label: "Mưa tập trung",
    description: "Nền noise mềm, giảm phân tâm khi đọc hoặc làm đề.",
    bestFor: "Học để thi",
    source: "generated"
  },
  deep: {
    label: "Deep focus",
    description: "Âm drone rất nhỏ, hợp shadowing và luyện nói chậm.",
    bestFor: "Giao tiếp",
    source: "generated"
  },
  piano: {
    label: "Piano tối giản",
    description: "Nền hợp âm rất thưa, phù hợp đọc và ghi nhớ mẫu câu.",
    bestFor: "Đọc hiểu",
    source: "generated"
  },
  cafe: {
    label: "Quán cà phê",
    description: "Không gian sáng nhẹ, hợp học buổi sáng hoặc ôn flashcard.",
    bestFor: "Ôn tập",
    source: "generated"
  },
  brown: {
    label: "Brown noise",
    description: "Dải thấp êm, giúp giảm tiếng ồn xung quanh khi làm bài.",
    bestFor: "Làm đề",
    source: "generated"
  },
  spotifyPop: {
    label: "Pop có lời",
    description: "Kết nối Spotify để nghe playlist phổ biến theo ngôn ngữ đang học.",
    bestFor: "Thư giãn",
    source: "spotify"
  },
  spotifyAcoustic: {
    label: "Acoustic có lời",
    description: "Dùng playlist licensed, không hiển thị lời bài hát nếu chưa có quyền.",
    bestFor: "Shadowing nhẹ",
    source: "spotify"
  }
};

export default function Home() {
  const [goal, setGoal] = useState<GoalKey>("work");
  const [time, setTime] = useState<TimeKey>("10");
  const [language, setLanguage] = useState("Tiếng Anh");
  const [level, setLevel] = useState("A2");
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [openSelect, setOpenSelect] = useState<SelectId>(null);
  const [plannerTab, setPlannerTab] = useState<PlannerTab>("path");
  const [activeTrack, setActiveTrack] = useState<TrackKey>("lofi");
  const [shadowLanguage, setShadowLanguage] = useState<ShadowLanguage>("en");
  const [selectedClipIndex, setSelectedClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(28);
  const [selectedDays, setSelectedDays] = useState([0, 1, 2, 3, 4]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [practiceTest, setPracticeTest] = useState<Question[]>([]);
  const [planStatus, setPlanStatus] = useState("Chưa lưu");
  const [aiTurnsLeft, setAiTurnsLeft] = useState(4);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRefs = useRef<Array<OscillatorNode | AudioBufferSourceNode>>([]);

  const selectedGoal = goals[goal];
  const dailyMinutes = Number(time);
  const pathSteps = useMemo(
    () => generateLearningPath({ goal, language, level, dailyMinutes }),
    [dailyMinutes, goal, language, level]
  );
  const todayTasks = useMemo(
    () => generateTodayTasks({ goal, language, dailyMinutes }),
    [dailyMinutes, goal, language]
  );
  const weeklyLoad = useMemo(() => dailyMinutes * selectedDays.length, [dailyMinutes, selectedDays.length]);
  const completedToday = completedTaskIds.filter((taskId) => todayTasks.some((task) => task.id === taskId)).length;
  const completionPercent = calculateCompletionPercent(todayTasks.length, completedToday);
  const selectedClip = shadowCatalog[shadowLanguage][selectedClipIndex] ?? shadowCatalog[shadowLanguage][0];
  const treeLeaves = Math.max(6, selectedDays.length + completedToday * 4);

  useEffect(() => {
    const raw = window.localStorage.getItem("lumalang.mvp-state");
    if (!raw) {
      return;
    }

    try {
      const saved = JSON.parse(raw) as {
        goal?: GoalKey;
        time?: TimeKey;
        language?: string;
        level?: string;
        activeTrack?: TrackKey;
        selectedDays?: number[];
        completedTaskIds?: string[];
        aiTurnsLeft?: number;
        themeMode?: ThemeMode;
      };
      if (saved.goal) setGoal(saved.goal);
      if (saved.time) setTime(saved.time);
      if (saved.language) setLanguage(saved.language);
      if (saved.level) setLevel(saved.level);
      if (saved.activeTrack) setActiveTrack(saved.activeTrack);
      if (saved.selectedDays) setSelectedDays(saved.selectedDays);
      if (saved.completedTaskIds) setCompletedTaskIds(saved.completedTaskIds);
      if (typeof saved.aiTurnsLeft === "number") setAiTurnsLeft(saved.aiTurnsLeft);
      if (saved.themeMode) setThemeMode(saved.themeMode);
      setPlanStatus("Đã khôi phục");
    } catch {
      window.localStorage.removeItem("lumalang.mvp-state");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "lumalang.mvp-state",
      JSON.stringify({
        goal,
        time,
        language,
        level,
        activeTrack,
        selectedDays,
        completedTaskIds,
        aiTurnsLeft,
        themeMode
      })
    );
  }, [activeTrack, aiTurnsLeft, completedTaskIds, goal, language, level, selectedDays, themeMode, time]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume / 1000;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      stopFocusAudio();
    };
  }, []);

  function stopFocusAudio() {
    sourceRefs.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Already stopped.
      }
    });
    sourceRefs.current = [];
    setIsPlaying(false);
  }

  function startFocusAudio(track: TrackKey = activeTrack) {
    stopFocusAudio();
    if (musicTracks[track].source === "spotify") {
      return;
    }

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return;
    }
    const context = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = context;

    const gain = context.createGain();
    gain.gain.value = volume / 1000;
    gain.connect(context.destination);
    gainRef.current = gain;

    if (track === "rain" || track === "cafe" || track === "brown") {
      const bufferSize = context.sampleRate * 2;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < bufferSize; index += 1) {
        data[index] = (Math.random() * 2 - 1) * (track === "cafe" ? 0.16 : 0.35);
      }
      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      filter.type = track === "brown" ? "lowpass" : "bandpass";
      filter.frequency.value = track === "brown" ? 420 : track === "cafe" ? 1300 : 950;
      noise.buffer = buffer;
      noise.loop = true;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      sourceRefs.current = [noise];
    } else {
      const base = track === "deep" ? 164.81 : track === "piano" ? 261.63 : 220;
      const frequencies =
        track === "deep" ? [base, base * 1.5] : track === "piano" ? [base, base * 1.26] : [base, base * 1.25, base * 1.5];
      sourceRefs.current = frequencies.map((frequency, index) => {
        const oscillator = context.createOscillator();
        const filter = context.createBiquadFilter();
        oscillator.type = track === "piano" ? "sine" : index === 0 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        filter.type = "lowpass";
        filter.frequency.value = track === "deep" ? 520 : track === "piano" ? 640 : 780;
        oscillator.connect(filter);
        filter.connect(gain);
        oscillator.start();
        return oscillator;
      });
    }

    setIsPlaying(true);
  }

  function selectTrack(track: TrackKey) {
    setActiveTrack(track);
    if (isPlaying) {
      startFocusAudio(track);
    }
  }

  function saveLearningPlan() {
    setPlanStatus("Đã lưu lộ trình");
    setCompletedTaskIds([]);
    setPracticeTest([]);
  }

  function toggleDay(index: number) {
    setSelectedDays((current) =>
      current.includes(index) ? current.filter((day) => day !== index) : [...current, index].sort()
    );
  }

  function toggleTask(taskId: string) {
    setCompletedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    );
  }

  function createPracticeTest() {
    setPracticeTest(generatePracticeTest({ goal, level, count: 3 }));
  }

  function runAiTutorTurn() {
    setAiTurnsLeft((current) => Math.max(0, current - 1));
  }

  return (
    <main className={`page-shell theme-${themeMode}`}>
      <header className="topbar macos-header">
        <div className="window-controls" aria-hidden="true">
          <span className="control-red" />
          <span className="control-yellow" />
          <span className="control-green" />
        </div>
        <a className="brand lumalang-wordmark" href="#home" aria-label="LumaLang home">
          <span className="brand-logo-frame">
            <img alt="" src="/images/lumalang-logo.png" />
          </span>
          <span>Luma<em>Lang</em><sup>*</sup></span>
        </a>
        <nav className="nav-pills" aria-label="Điều hướng chính">
          <a href="#home">Trang chủ</a>
          <a href="#path">Phòng học</a>
          <a href="/pricing">Gói học</a>
          <a href="/blog">Journal</a>
          <a href="/contact">Liên hệ</a>
        </nav>
        <div className="header-actions">
          <button
            className="mobile-menu-button"
            aria-label="Mở menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span />
            <span />
          </button>
          <button className="theme-switch" onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}>
            <span className={themeMode === "light" ? "active" : ""}>☀</span>
            <span className={themeMode === "dark" ? "active" : ""}>☾</span>
          </button>
          <a className="ghost-button journey-button" href="/placement">Đánh giá đầu vào</a>
        </div>
        <nav className={`mobile-nav ${mobileMenuOpen ? "open" : ""}`} aria-label="Điều hướng mobile">
          <a href="#home" onClick={() => setMobileMenuOpen(false)}>Trang chủ</a>
          <a href="#path" onClick={() => setMobileMenuOpen(false)}>Phòng học</a>
          <a href="/pricing" onClick={() => setMobileMenuOpen(false)}>Gói học</a>
          <a href="/blog" onClick={() => setMobileMenuOpen(false)}>Journal</a>
          <a href="/contact" onClick={() => setMobileMenuOpen(false)}>Liên hệ</a>
        </nav>
      </header>

      <section className="hero-grid ios-hero" id="home">
        <div className="hero-copy ios-copy">
          <div className="mini-window-badge animate-fade-rise" aria-hidden="true">
            <span className="window-controls">
              <i className="control-red" />
              <i className="control-yellow" />
              <i className="control-green" />
            </span>
            <span>study-room.lumalang</span>
          </div>
          <p className="eyebrow animate-fade-rise">Học chill, học sâu, không bị dí deadline vô tri</p>
          <h1 className="animate-fade-rise">
            Một không gian học ngôn ngữ nhẹ như mở cửa sổ iOS.
          </h1>
          <p className="hero-text animate-fade-rise-delay">
            Lộ trình cá nhân, shadowing, nhóm học và AI tutor được đặt trong một giao diện trong suốt,
            ít ồn, đủ vui, đủ nghiêm túc để bạn quay lại mỗi ngày.
          </p>
          <div className="hero-mood-row animate-fade-rise-delay-2" aria-label="Tinh thần sản phẩm">
            <span>Focus mode</span>
            <span>Tree streak</span>
            <span>Lo-fi học bài</span>
          </div>

          <div className="search-card" role="search">
            <label htmlFor="learning-search">Bạn muốn học gì hôm nay?</label>
            <div className="search-row">
              <span className="search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img">
                  <path d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
                </svg>
              </span>
              <input
                id="learning-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ví dụ: luyện meeting 10 phút, tạo đề TOEIC, shadowing phim..."
              />
              <button
                onClick={() => {
                  setQuery(query || "Tạo lộ trình học hôm nay");
                  setPlannerTab("path");
                }}
              >
                Gợi ý
              </button>
            </div>
            <div className="quick-chips" aria-label="Gợi ý nhanh">
              {["Meeting", "IELTS speaking", "Từ vựng", "Shadowing"].map((chip) => (
                <button key={chip} onClick={() => setQuery(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="studio-section" id="path">
        <div className="studio-intro">
          <p className="eyebrow">Learning studio</p>
          <h2>Thiết kế buổi học như set mood cho một căn phòng.</h2>
          <p>
            Chọn mục tiêu, thời lượng, âm thanh và không gian. Phần học thuật ở phía sau sẽ bám vào nhịp này,
            không ném bài tập vào mặt bạn như deadline thứ hai đầu tuần.
          </p>
        </div>
        <aside className="glass-panel planner-panel" aria-label="Thiết kế lộ trình nhanh">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Thiết kế lộ trình</p>
              <h2>60 giây để bắt đầu</h2>
            </div>
            <span className={`status-dot ${selectedGoal.accent}`} />
          </div>

          <div className="inner-tabs" role="tablist" aria-label="Cá nhân hóa học tập">
            {[
              ["path", "Lộ trình"],
              ["sound", "Âm thanh"],
              ["space", "Không gian"]
            ].map(([key, label]) => (
              <button
                key={key}
                className={plannerTab === key ? "active" : ""}
                onClick={() => setPlannerTab(key as PlannerTab)}
                role="tab"
                aria-selected={plannerTab === key}
              >
                {label}
              </button>
            ))}
          </div>

          {plannerTab === "path" ? (
            <>
              <div className="field-grid">
                <CustomSelect
                  id="language"
                  label="Ngôn ngữ học"
                  value={language}
                  options={languages}
                  isOpen={openSelect === "language"}
                  onToggle={() => setOpenSelect(openSelect === "language" ? null : "language")}
                  onChange={(value) => {
                    setLanguage(value);
                    setOpenSelect(null);
                  }}
                />
                <CustomSelect
                  id="level"
                  label="Trình độ"
                  value={level}
                  options={["Mới bắt đầu", "A1", "A2", "B1", "B2", "C1"]}
                  isOpen={openSelect === "level"}
                  onToggle={() => setOpenSelect(openSelect === "level" ? null : "level")}
                  onChange={(value) => {
                    setLevel(value);
                    setOpenSelect(null);
                  }}
                />
              </div>

              <div className="goal-tabs" role="tablist" aria-label="Mục tiêu học">
                {(Object.keys(goals) as GoalKey[]).map((key) => (
                  <button
                    key={key}
                    className={goal === key ? "active" : ""}
                    onClick={() => setGoal(key)}
                    role="tab"
                    aria-selected={goal === key}
                  >
                    {goals[key].short}
                  </button>
                ))}
              </div>

              <p className="goal-description">{selectedGoal.description}</p>

              <div className="time-picker" aria-label="Thời gian học mỗi ngày">
                {timeOptions.map((item) => (
                  <button key={item} className={time === item ? "active" : ""} onClick={() => setTime(item)}>
                    {item} phút
                  </button>
                ))}
              </div>

              <button className="primary-button" onClick={saveLearningPlan}>
                Tạo lộ trình {language}
              </button>
              <p className="planner-status">
                {planStatus} · {pathSteps.length} bước · {selectedDays.length} buổi/tuần
              </p>
            </>
          ) : null}

          {plannerTab === "sound" ? (
            <div className="sound-studio">
              <div className="sound-now">
                <div>
                  <span>{musicTracks[activeTrack].source === "spotify" ? "Provider mode" : "Đang chọn"}</span>
                  <strong>{musicTracks[activeTrack].label}</strong>
                  <p>{musicTracks[activeTrack].description}</p>
                </div>
                {musicTracks[activeTrack].source === "spotify" ? (
                  <button className="connect-button">Kết nối Spotify</button>
                ) : (
                  <button
                    className={isPlaying ? "pause-button" : "play-control"}
                    onClick={() => (isPlaying ? stopFocusAudio() : startFocusAudio())}
                  >
                    {isPlaying ? "Dừng" : "Nghe thử"}
                  </button>
                )}
              </div>
              <div className="track-list">
                {(Object.keys(musicTracks) as TrackKey[]).map((track) => (
                  <button
                    key={track}
                    className={activeTrack === track ? "active" : ""}
                    onClick={() => selectTrack(track)}
                  >
                    <strong>{musicTracks[track].label}</strong>
                    <span>{musicTracks[track].source === "spotify" ? "Spotify - " : "Trong app - "}{musicTracks[track].bestFor}</span>
                  </button>
                ))}
              </div>
              {musicTracks[activeTrack].source === "generated" ? (
                <label className="volume-control">
                  Âm lượng thư giãn
                  <input
                    type="range"
                    min="0"
                    max="70"
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                  />
                </label>
              ) : (
                <p className="license-note">
                  Nhạc có lời cần OAuth/provider có bản quyền. Lời bài hát chỉ nên hiển thị qua nguồn licensed, không crawl tự do.
                </p>
              )}
            </div>
          ) : null}

          {plannerTab === "space" ? (
            <div className="comfort-grid">
              <button className="comfort-card active">
                <strong>Focus mode</strong>
                <span>Ẩn bảng xếp hạng khi làm bài.</span>
              </button>
              <button className="comfort-card">
                <strong>Gentle review</strong>
                <span>Nhắc lỗi bằng gợi ý mềm.</span>
              </button>
              <button className="comfort-card">
                <strong>Quiet streak</strong>
                <span>Giữ streak nhưng không gây áp lực.</span>
              </button>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="design-language-section" aria-label="Ngôn ngữ thiết kế LumaLang">
        <div className="design-language-copy">
          <p className="eyebrow">Design language</p>
          <h2>Glass rõ, khoảng thở rộng, học thuật nhưng không căng.</h2>
        </div>
        <div className="design-language-grid">
          {[
            ["01", "Full-width mood", "Trang chủ mở rộng như một khung cảnh, không đóng hộp hero vào card."],
            ["02", "iOS glass", "Khối chức năng trong suốt, blur vừa đủ, viền nhẹ và shadow mềm."],
            ["03", "Green calm", "Bảng màu xanh học thuật, sáng sạch; dark mode là dark green đúng nghĩa."],
            ["04", "Useful whimsy", "Gen Z một chút ở câu chữ, nhưng chức năng vẫn rõ và dùng được mỗi ngày."]
          ].map(([index, title, body]) => (
            <article className="glass-panel design-card" key={title}>
              <span>{index}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid" id="learning-flow">
        <article className="glass-panel path-panel">
          <div className="section-title">
            <p>Lộ trình cá nhân</p>
            <h2>{selectedGoal.label}</h2>
          </div>
          <div className="progress-strip">
            <span style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="path-list">
            {pathSteps.map((step, index) => (
              <div className="path-step" key={step.id}>
                <span>{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.detail} · {step.minutes} phút</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="glass-panel today-panel">
          <div className="section-title">
            <p>Hôm nay</p>
            <h2>{time} phút học tập</h2>
          </div>
          <ul className="today-list">
            {todayTasks.map((task) => (
              <li key={task.id} className={completedTaskIds.includes(task.id) ? "done" : ""}>
                <button aria-label={`Đánh dấu ${task.title}`} onClick={() => toggleTask(task.id)}>
                  <span />
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <em>{task.detail} · {task.minutes} phút</em>
                </div>
              </li>
            ))}
          </ul>
          <div className="schedule-strip">
            {days.map((day, index) => (
              <button className={selectedDays.includes(index) ? "selected" : ""} key={day} onClick={() => toggleDay(index)}>
                {day}
              </button>
            ))}
          </div>
          <p className="muted">
            Hoàn thành hôm nay: {completionPercent}%. Tải học mỗi tuần: khoảng {weeklyLoad} phút.
          </p>
        </article>

        <article className="glass-panel ai-cost-panel">
          <div className="section-title">
            <p>AI tutor</p>
            <h2>Không đốt token vô thức</h2>
          </div>
          <div className="meter">
            <span style={{ width: `${(aiTurnsLeft / 4) * 100}%` }} />
          </div>
          <p>
            Free plan còn {aiTurnsLeft}/4 lượt AI hôm nay. Roleplay dài, voice AI nâng cao và tạo lesson riêng
            thuộc gói trả phí.
          </p>
          <button className="secondary-button" disabled={aiTurnsLeft === 0} onClick={runAiTutorTurn}>
            Dùng 1 lượt AI tutor
          </button>
        </article>

        <article className="glass-panel tree-panel" id="knowledge-tree">
          <div className="tree-copy">
            <div className="section-title">
              <p>Thay cho streak</p>
              <h2>Cây tri thức của bạn</h2>
            </div>
            <p>
              Không ép người học giữ streak khô cứng. Mỗi task hoàn thành, lịch học đều đặn và shadowing sẽ làm cây lớn hơn,
              mở khóa nhánh theo kỹ năng.
            </p>
            <div className="tree-stats">
              <span>{completedToday}/{todayTasks.length} task hôm nay</span>
              <span>{selectedDays.length} buổi/tuần</span>
              <span>Level {Math.max(1, completedToday + 1)}</span>
            </div>
          </div>
          <div className="knowledge-tree" aria-label="Cây tri thức mô phỏng">
            <KnowledgeTreeAsset growth={treeLeaves} />
          </div>
        </article>
      </section>

      <section className="feature-grid">
        <article className="glass-panel group-panel" id="group">
          <div className="section-title">
            <p>Học cùng người khác</p>
            <h2>Kết nối bạn học phù hợp</h2>
          </div>
          <div className="buddy-card">
            <div className="avatar-stack" aria-hidden="true">
              <span>A</span>
              <span>M</span>
              <span>K</span>
            </div>
            <div>
              <strong>Nhóm {selectedGoal.short} buổi tối</strong>
              <p>Cùng level {level}, học {time} phút, timezone Việt Nam.</p>
            </div>
          </div>
          <button className={connected ? "success-button" : "secondary-button"} onClick={() => setConnected(!connected)}>
            {connected ? "Đã gửi lời mời" : "Kết nối nhóm học"}
          </button>
        </article>

        <article className="glass-panel rank-panel">
          <div className="section-title">
            <p>Thứ hạng</p>
            <h2>Bảng tuần này</h2>
          </div>
          {["Bạn", "Minh Anh", "Khoa", "Linh"].map((name, index) => (
            <div className="rank-row" key={name}>
              <span>{index + 1}</span>
              <strong>{name}</strong>
              <em>{1240 - index * 95} điểm đều đặn</em>
            </div>
          ))}
        </article>

        <article className="glass-panel shadowing-panel" id="shadowing">
          <div className="section-title">
            <p>Kho phim shadowing</p>
            <h2>{selectedClip.title}</h2>
          </div>
          <div className="language-switch" role="tablist" aria-label="Ngôn ngữ shadowing">
            {(Object.keys(shadowLanguages) as ShadowLanguage[]).map((item) => (
              <button
                key={item}
                className={shadowLanguage === item ? "active" : ""}
                onClick={() => {
                  setShadowLanguage(item);
                  setSelectedClipIndex(0);
                }}
                role="tab"
                aria-selected={shadowLanguage === item}
              >
                {shadowLanguages[item]}
              </button>
            ))}
          </div>
          <div className="media-frame">
            <div className="play-button" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7L8 5Z" />
              </svg>
            </div>
            <p>{selectedGoal.shadowing}. Loop từng câu, subtitle song ngữ, lưu từ mới, so sánh transcript bằng Web Speech API.</p>
          </div>
          <div className="caption-line">
            <span>{selectedClip.duration}</span>
            <strong>"{selectedClip.line}"</strong>
          </div>
          <div className="shadow-list">
            {shadowCatalog[shadowLanguage].map((clip, index) => (
              <button
                key={clip.title}
                className={selectedClipIndex === index ? "active" : ""}
                onClick={() => setSelectedClipIndex(index)}
              >
                <span>{clip.level}</span>
                <strong>{clip.title}</strong>
                <em>{clip.source} · {clip.focus}</em>
              </button>
            ))}
          </div>
        </article>

        <article className="glass-panel test-panel" id="tests">
          <div className="test-copy">
            <div className="section-title">
              <p>Tạo đề ngẫu nhiên</p>
              <h2>An toàn bằng question bank</h2>
            </div>
            <p>{selectedGoal.testMode}</p>
            <div className="blueprint">
              <span>Blueprint</span>
              <strong>Level {level}</strong>
              <strong>{language}</strong>
              <strong>{selectedGoal.short}</strong>
            </div>
            <button className="secondary-button" onClick={createPracticeTest}>Tạo đề mẫu</button>
          </div>
          <div className="test-preview">
            {practiceTest.length > 0 ? (
              <div className="question-preview">
                {practiceTest.map((question) => (
                  <details key={question.id}>
                    <summary>{question.skill}: {question.prompt}</summary>
                    <p><strong>Đáp án:</strong> {question.answer}</p>
                    <p>{question.explanation}</p>
                  </details>
                ))}
              </div>
            ) : (
              <div className="empty-test-state">
                <strong>Chưa có đề mẫu</strong>
                <span>Bấm tạo đề để lấy 3 câu hỏi đã kiểm duyệt theo mục tiêu hiện tại.</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <footer className="site-footer">
        <div>
          <a className="brand footer-brand" href="#home" aria-label="LumaLang home">
            <span className="brand-logo-frame compact">
              <img alt="" src="/images/lumalang-logo.png" />
            </span>
            <span>LumaLang</span>
          </a>
          <p>Nền tảng học ngôn ngữ cá nhân hóa: lộ trình, lịch học, shadowing, nhóm học và AI tutor có kiểm soát chi phí.</p>
        </div>
        <nav aria-label="Footer">
          <a href="#path">Lộ trình</a>
          <a href="#group">Cộng đồng</a>
          <a href="#shadowing">Shadowing</a>
          <a href="#tests">Đề luyện</a>
        </nav>
        <div className="footer-note">
          <strong>MVP focus</strong>
          <span>Test nhanh với user, chưa dùng AI sinh đề trực tiếp.</span>
        </div>
      </footer>
    </main>
  );
}

function KnowledgeTreeAsset({ growth }: { growth: number }) {
  return <KnowledgeTreeScene growth={growth} />;
}

function CustomSelect({
  id,
  label,
  value,
  options,
  isOpen,
  onToggle,
  onChange
}: {
  id: Exclude<SelectId, null>;
  label: string;
  value: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="custom-field">
      <span>{label}</span>
      <div className="custom-select">
        <button
          type="button"
          id={`${id}-select`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          {value}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        {isOpen ? (
          <div className="select-menu" role="listbox" aria-labelledby={`${id}-select`}>
            {options.map((option) => (
              <button
                type="button"
                key={option}
                className={option === value ? "selected" : ""}
                role="option"
                aria-selected={option === value}
                onClick={() => onChange(option)}
              >
                {option}
                {option === value ? <span aria-hidden="true">✓</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
