# Path-Style Redesign — Handoff for Antigravity (2026-05-25)

> **Branch:** `feat/path-style-redesign`
> **Status:** Partial — Hành trình foundation done, Shadowing + Practice room pending
> **Token state:** Claude session getting low, handing off so Antigravity finishes

---

## Owner's request (verbatim)

> "Cái phần hành trình bài học này của bạn lúc trước làm rất là đẹp, có cách
> nào áp dụng vào phần khóa học, bài học không. Cái shadowing thì phần vào
> học rất oke nhưng bên ngoài rất là lạc quẻ so UI tổng tôi cần bạn làm nó
> hiện đại view như youtube cũng được hoặc là cái hình mẫu toi gửi bạn hình
> số 3 được không. Đề luyện hiện tại bạn làm cho tôi layout hiện đại đẹp,
> như 1 phòng thi luyện đề rồi chức năng tôi kêu antigavity làm."
>
> Plus: "Tại sao các header title của các chức năng bị lệch UI hết vậy bạn
> không thống nhất à. Làm luôn cả 3 phần cho tôi."

**Three things requested:**
1. Path-style "Hành trình" for **Khóa học/Bài học** — Foundation DONE
2. Shadowing browse view — Netflix-style hero + carousels (TO DO)
3. Practice "phòng thi" — exam-room fullscreen layout (TO DO)

**Plus:** Header inconsistency — PageTopbar component CREATED (TO DO: wire it everywhere)

---

## What's DONE in this branch

### New file: `apps/web/app/components/PageTopbar.tsx`
Unified topbar. Replaces duplicate `<header className="ll-topbar ll-glass">` in every view.

```tsx
<PageTopbar
  eyebrow="KHÓA HỌC · 3 MẠCH · 13 KHÓA"
  title="Hành trình của "
  titleAccent="bạn"
  actions={<button>Đăng ký mới</button>}
/>
```

**NOT YET applied** to LumaUserDashboard.tsx. Next agent must:
- Import: `import { PageTopbar } from "./PageTopbar";`
- Replace every `<header className="ll-topbar ll-glass">...</header>` in
  `activeView === "..."` blocks (lesson/courses/practice/today/schedule/
  flashcards/group/profile) with `<PageTopbar ...>`.
- **Most important:** ShadowingView currently renders its own `.ll-shadow-hero`
  inside the body. Move that out — in `activeView === "shadowing"` block:
  ```tsx
  {activeView === "shadowing" ? (
    <div className="ll-page">
      <PageTopbar
        eyebrow="LUYỆN PHÁT ÂM · SHADOWING"
        title="Nghe và "
        titleAccent="nhại theo giọng người bản xứ"
      />
      <ShadowingView />
    </div>
  ) : null}
  ```
  Then delete the `<motion.header className="ll-shadow-hero">` block from
  `ShadowingView.tsx`. This fixes the "tab Shadowing header lệch" complaint.

### New file: `apps/web/app/lib/learning-paths.ts`
Defines 3 paths (mạch):
- `path.work` — Giao tiếp công việc (5 courses A1→C1)
- `path.exam` — Luyện thi IELTS (4 courses A2→C1)
- `path.foundation` — Nền tảng & Phản xạ (4 courses A1→B2)

Each course has `requiredTags` to filter FOUNDATION_SEED. Helper
`orderedPathsFor(goal)` returns paths sorted by user primaryGoal relevance.

### New file: `apps/web/app/components/LearningPathsView.tsx`
3-mạch view for Khóa học tab. Each path is a horizontal scrollable row.
Course tile statuses:
- `done` — green checkmark, full progress
- `active`/`in-progress` — orange "Đang học" pill, highlighted border
- `locked` — grayed, lock icon, click shows toast

Click action: launches `SessionPlayer` with `recommendDaily(asus, profile, {n: 8})`.

### TO DO #0 — Wire LearningPathsView into dashboard

```tsx
import { LearningPathsView } from "./LearningPathsView";
import { PageTopbar } from "./PageTopbar";

// Replace activeView === "courses" block
{activeView === "courses" ? (
  <div className="ll-page">
    <PageTopbar
      eyebrow="KHÓA HỌC · 3 MẠCH · 13 KHÓA"
      title="Hành trình của "
      titleAccent="bạn"
      actions={
        <Link href="/placement" className="ll-btn primary">Đăng ký mới</Link>
      }
    />
    <LearningPathsView />
  </div>
) : null}
```

### TO DO #1 — CSS for path-style view

Append to globals.css:

```css
.ll-paths-view { display: flex; flex-direction: column; gap: 28px; width: 100%; }
.ll-paths-skeleton { min-height: 400px; }
.ll-paths-meta-row { font-size: 0.86rem; color: var(--muted); padding: 4px 6px; }
.ll-paths-meta-row strong { color: var(--ink); }
.ll-paths-empty { padding: 32px 28px; text-align: center; color: var(--muted); }
.ll-paths-toast {
  position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
  background: rgba(23, 32, 51, 0.94); color: white;
  padding: 14px 22px; border-radius: 999px;
  font-size: 0.9rem; font-weight: 600; z-index: 1000;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
}

.ll-path-row { display: flex; flex-direction: column; gap: 14px; }
.ll-path-row-head { display: flex; align-items: center; gap: 12px; padding: 0 4px; }
.ll-path-row-emoji {
  width: 44px; height: 44px; display: inline-grid; place-items: center;
  border-radius: 14px;
  background: rgba(91, 174, 111, 0.15);
  border: 1px solid rgba(91, 174, 111, 0.25);
  font-size: 1.4rem;
}
.ll-path-row-info h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--ink); }
.ll-path-row-info p { margin: 2px 0 0; font-size: 0.82rem; color: var(--soft); }

.ll-path-row-track {
  display: flex; align-items: center; gap: 0;
  overflow-x: auto; padding: 6px 4px 14px;
  scroll-snap-type: x mandatory;
}

.ll-course-tile {
  flex-shrink: 0; width: 200px; min-height: 158px;
  scroll-snap-align: start; appearance: none;
  background: rgba(255,255,255,0.82);
  border: 1.5px solid var(--line);
  border-radius: 20px; padding: 16px 18px 14px;
  text-align: left; font-family: inherit; cursor: pointer;
  display: flex; flex-direction: column; gap: 8px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  backdrop-filter: blur(20px);
}
.ll-course-tile:hover:not(.ll-course-tile--locked) {
  border-color: rgba(91, 174, 111, 0.6);
  box-shadow: 0 14px 32px rgba(20, 60, 40, 0.12);
}
.ll-course-tile--done { border-color: rgba(91, 174, 111, 0.55); background: rgba(218, 241, 222, 0.45); }
.ll-course-tile--active, .ll-course-tile--in-progress {
  border-color: rgba(255, 145, 60, 0.55); border-width: 2px;
  background: rgba(255, 245, 230, 0.65);
}
.ll-course-tile--locked { opacity: 0.55; cursor: not-allowed; background: rgba(245, 247, 248, 0.7); }

.ll-course-tile-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.ll-course-tile-level {
  font-size: 0.78rem; font-weight: 800; padding: 4px 11px;
  border-radius: 999px; background: rgba(91, 174, 111, 0.18); color: #2d6a3d;
}
.ll-course-tile--locked .ll-course-tile-level { background: rgba(130, 148, 176, 0.18); color: var(--soft); }

.ll-course-tile-pill { font-size: 0.7rem; font-weight: 700; padding: 3px 9px; border-radius: 999px; letter-spacing: 0.06em; }
.ll-course-tile-pill.is-done { background: rgba(91, 174, 111, 0.22); color: #2d6a3d; }
.ll-course-tile-pill.is-active { background: rgba(255, 145, 60, 0.22); color: #c2611f; text-transform: uppercase; }
.ll-course-tile-pill.is-locked { background: transparent; color: var(--soft); font-size: 0.95rem; padding: 0; }

.ll-course-tile-name { margin: 6px 0 0; font-size: 1.02rem; font-weight: 700; color: var(--ink); line-height: 1.3; }
.ll-course-tile-meta { margin: 0; font-size: 0.78rem; color: var(--soft); }

.ll-course-tile-progress {
  margin-top: auto; height: 6px;
  background: rgba(91, 174, 111, 0.14);
  border-radius: 999px; overflow: hidden;
}
.ll-course-tile-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(91, 174, 111, 1), rgba(45, 106, 61, 1));
  border-radius: 999px; transition: width 0.4s ease;
}

.ll-course-tile-connector {
  flex-shrink: 0; width: 18px; height: 2px;
  background: var(--line); margin: 0 -1px;
}

.ll-paths-explainer {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 16px 20px; font-size: 0.88rem; color: var(--muted);
}
.ll-paths-explainer-icon { font-size: 1.2rem; flex-shrink: 0; }
.ll-paths-explainer strong { color: var(--ink); }
```

---

## TO DO #2: Shadowing browse — Netflix-style hero + carousels

**Why this design over alternatives:**
- Dark theme (Image 3 user sent) → lạc UI tổng (site is mint/cream)
- YouTube grid → too many choices, content not at scale yet
- Netflix-style hero + curated carousels → matches familiarity

**Layout:**

```
[PageTopbar: LUYỆN PHÁT ÂM · SHADOWING]

HERO "Tiếp tục luyện" (if user has in-progress clip):
┌─────────────────────────────────────────────┐
│ ┌──thumb──┐  TIẾP TỤC LUYỆN                 │
│ │  ▶ hover│  English Stories · A2           │
│ │   plays │  3/10 đoạn · 67% trung bình     │
│ │         │  [🎯 Tiếp tục đoạn 4 →]         │
│ └─────────┘                                 │
└─────────────────────────────────────────────┘

GỢI Ý CHO HÔM NAY
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ → scroll
└────┘ └────┘ └────┘ └────┘ └────┘

THEO CHỦ ĐỀ
[Chào hỏi👋][Đồ ăn🍜][Du lịch✈️][Số đếm🔢]
┌────┐ ┌────┐ ┌────┐ ┌────┐

[🔍 Dán link YouTube hoặc gõ chủ đề...] [Bắt đầu]

CLIP BẠN ĐÃ LUYỆN
┌────┐ ┌────┐ ┌────┐
```

**Files to modify:**

1. **`apps/web/app/components/ShadowingView.tsx`** — major rewrite:
   - Delete the `<motion.header className="ll-shadow-hero">` block (lines ~80-130)
   - Wrap content in `<div className="ll-shadow-browse">` 
   - Sections in order: ContinueWatching → SuggestedToday → ByTopic → SavedClips
   - Search box becomes a stand-alone row between sections

2. **CSS** (append to globals.css):

```css
.ll-shadow-browse { display: flex; flex-direction: column; gap: 28px; }

.ll-shadow-continue {
  display: grid; grid-template-columns: 360px 1fr; gap: 28px;
  padding: 22px; align-items: center;
}
@media (max-width: 720px) { .ll-shadow-continue { grid-template-columns: 1fr; } }
.ll-shadow-continue-thumb {
  position: relative; aspect-ratio: 16/9;
  border-radius: 16px; overflow: hidden; background: #000;
}
.ll-shadow-continue-thumb img { width: 100%; height: 100%; object-fit: cover; }
.ll-shadow-continue-meta-eyebrow {
  font-size: 0.74rem; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--soft);
}
.ll-shadow-continue-meta h2 { margin: 8px 0 6px; font-size: 1.4rem; font-weight: 700; color: var(--ink); }
.ll-shadow-continue-cta {
  margin-top: 16px; appearance: none;
  background: var(--ink); color: white; border: 0;
  border-radius: 999px; padding: 13px 22px;
  font-weight: 600; font-size: 0.95rem; cursor: pointer;
}

.ll-shadow-carousel-section { display: flex; flex-direction: column; gap: 14px; }
.ll-shadow-carousel-head {
  display: flex; align-items: baseline; justify-content: space-between; padding: 0 4px;
}
.ll-shadow-carousel-head h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--ink); }
.ll-shadow-carousel-eyebrow {
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.14em;
  text-transform: uppercase; color: var(--soft);
}

.ll-shadow-carousel {
  display: grid; grid-auto-flow: column;
  grid-auto-columns: 260px;
  gap: 14px; overflow-x: auto;
  padding: 4px 4px 14px;
  scroll-snap-type: x mandatory;
}
.ll-shadow-carousel > * { scroll-snap-align: start; }

.ll-shadow-topic-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ll-shadow-topic-chip {
  appearance: none; background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 999px; padding: 8px 16px;
  font-family: inherit; font-size: 0.86rem;
  font-weight: 600; color: var(--muted); cursor: pointer;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
}
.ll-shadow-topic-chip:hover { color: var(--ink); border-color: var(--ink); }
.ll-shadow-topic-chip.is-active {
  background: var(--ink); color: white; border-color: var(--ink);
}

.ll-shadow-search-row { display: flex; gap: 10px; padding: 8px 8px 8px 18px; }
```

---

## TO DO #3: Practice "Phòng thi" — fullscreen exam room

**Layout:**

```
┌──────────────────────────────────────────────────────────────┐
│ ← Thoát │ Đề luyện B1 · 10 câu  ⏱ 14:23  [📤 Nộp bài]       │
│ ━━━━━━━━━━░░░░░░░░░░░░░░░░░░ câu 3/10                         │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────┐  ┌────────────────┐
│ Câu 3 · 🎧 NGHE                       │  │ Danh sách câu  │
│                                       │  │ [1] ✓          │
│ [▶ Phát audio]                       │  │ [2] ✓          │
│ Bạn nghe được câu nào?               │  │ [3] ← đang làm │
│                                       │  │ [4] · chưa làm │
│ ○ A. ...                             │  │ ...            │
│ ○ B. ...                             │  │ Đã xong: 2/10  │
│                                       │  │ [⏸ Tạm dừng]  │
│ [← Câu trước][Lưu & câu sau →]       │  │ [📤 Nộp ngay] │
└──────────────────────────────────────┘  └────────────────┘
```

**New component `apps/web/app/components/ExamRoom.tsx`.** PracticeViewV2's
`setActiveQueue(...)` should launch `<ExamRoom>` instead of `<SessionPlayer>`.

**Props:**
- `queue: SkillUnit[]` (the 10 ASUs)
- `examName: string` (e.g. "Đề hỗn hợp B1")
- `onExit: () => void`
- `onSubmit: (answers: Answer[]) => void` — POST to /api/study-sessions

**Differs from SessionPlayer:**
- Fullscreen modal (`position: fixed; inset: 0`)
- Sidebar shows ALL questions at once (not just current)
- Free navigation (not forced linear)
- 15-min countdown for 10 questions; auto-submit on expiry
- "Save & next" saves answer, lets user review later
- On submit: results screen with all answers, total score, time taken

**State:**
```ts
interface Answer {
  skillId: string;
  userAnswer: string | number;
  isCorrect: boolean | null;
  timeSpentMs: number;
}
const [answers, setAnswers] = useState<Map<string, Answer>>(new Map());
const [currentIdx, setCurrentIdx] = useState(0);
const [timeLeftSec, setTimeLeftSec] = useState(15 * 60);
const [submitted, setSubmitted] = useState(false);
```

**Question rendering:** reuse `<SkillCard>` but capture answer instead of advancing.

**CSS:**

```css
.ll-exam-room {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(245, 248, 247, 0.96);
  backdrop-filter: blur(20px);
  display: grid; grid-template-rows: auto 1fr; overflow-y: auto;
}
.ll-exam-room-header {
  display: flex; align-items: center; gap: 24px;
  padding: 18px 28px;
  border-bottom: 1px solid var(--line);
  background: white;
}
.ll-exam-room-timer {
  font-size: 1.2rem; font-weight: 700; color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.ll-exam-room-timer.is-low { color: #c2611f; }
.ll-exam-room-progress { flex: 1; height: 6px; background: var(--line); border-radius: 999px; overflow: hidden; }
.ll-exam-room-progress-fill {
  height: 100%; background: linear-gradient(90deg, #5bae6f, #2d6a3d);
}
.ll-exam-room-body {
  display: grid; grid-template-columns: 1fr 280px;
  gap: 24px; padding: 28px; max-width: 1280px; margin: 0 auto;
}
.ll-exam-room-question { padding: 32px 36px; /* uses .ll-glass */ }
.ll-exam-room-sidebar { display: flex; flex-direction: column; gap: 14px; }
.ll-exam-room-qlist { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
.ll-exam-room-qdot {
  appearance: none; aspect-ratio: 1;
  border: 1.5px solid var(--line); background: white;
  border-radius: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.18s ease;
}
.ll-exam-room-qdot.is-done { background: rgba(91,174,111,0.2); color: #2d6a3d; border-color: rgba(91,174,111,0.5); }
.ll-exam-room-qdot.is-current { border-color: var(--ink); border-width: 2px; }
```

---

## Critical conventions

1. **Header sync** — use `<PageTopbar>` everywhere. No more inlined `<header className="ll-topbar ll-glass">`.
2. **Vietnamese-first** UI strings.
3. **`.ll-*` class prefix**. No inline styles for layout.
4. **Design tokens**: `var(--ink)`, `var(--paper)`, `var(--line)`, `var(--muted)`, `var(--soft)`.
5. **`.ll-glass`** for card containers (radius 28, blur, gradient overlay).
6. Run `npx tsc --noEmit` before committing.
7. Long commit messages with Why/What/Verified body.
8. Don't delete CoursesViewV2/LessonsViewV2/PracticeViewV2 — other views may import.

---

## Acceptance criteria

- [ ] Khóa học → 3-path layout, scrollable, locked tiles show toast
- [ ] Bài học → keep LessonsViewV2 as-is (already redesigned with .ll-glass)
- [ ] Shadowing → PageTopbar + Continue Watching hero + 3 carousels + search row
- [ ] Practice → "Tạo đề mới" launches ExamRoom fullscreen, not SessionPlayer
- [ ] All 8 tabs share consistent header (PageTopbar)
- [ ] `npx tsc --noEmit` clean
- [ ] Branch pushed; owner can pull `feat/path-style-redesign` to test
- [ ] Owner approves → merge to main

---

## Files in this branch (ready to commit)

```
M apps/web/app/components/LessonsViewV2.tsx    — .ll-glass + CEFR ±1 filter
M apps/web/app/components/PracticeViewV2.tsx   — .ll-glass + "—" for no data
M apps/web/app/globals.css                     — V2 redesign CSS + courses-v2 width fix
+ apps/web/app/components/PageTopbar.tsx       — NEW
+ apps/web/app/components/LearningPathsView.tsx — NEW
+ apps/web/app/lib/learning-paths.ts           — NEW
+ claude.md                                     — THIS DOC
```

All TypeScript checks pass. Next agent should follow the TO DO #0-3
in order, verify tsc + build, commit, push branch, wait for owner review.

---

## Owner communication style

- Vietnamese, casual ("bạn / tôi"), not formal
- Wants end-to-end work, no ping-pong
- Will send screenshots when something looks wrong
- Has explicitly asked: "Tôi cần bạn làm hoàn chỉnh"
- For this PR specifically: said "bạn làm xong cho tôi review hả push" —
  so do NOT merge to main yet, just push the branch and let owner pull/test.
