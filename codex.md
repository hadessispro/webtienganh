# Notes for Codex

> Last update: 2026-05-20, after merging both `feat/courses-learning-path` and `fix/typography-inter-unified` to `main`.
> Sequence on `main` for this iteration: PR1 (placement) → restore dashboard entry → courses learning path (`3cabc83`) → **typography unified (`048edf9`)** ← latest.

---

## What just changed

**Goal:** Rebuild the `/learn → Khóa học` tab into a learning-path layout.
**Branch (now merged):** `feat/courses-learning-path`
**Squash commit on main:** `3cabc83`

### Mental model

| Concept | Old | New |
|---|---|---|
| Layout | 2-column card grid | 3 rows (= goal tracks), grid of up to 5 cards per row |
| Card size | Large tile with banner gradient (~280px tall) | Compact card (~140px tall) |
| Progress signal | Static `ProgressBar` | Progress bar **+ shimmer when state == active** |
| Lock mechanism | None — all courses unlocked | Must complete previous in same track (100%) to unlock next |
| Track grouping | No grouping (all goals mixed) | Grouped by `course.goal` (`work` / `exam` / `foundation`) |
| Track ordering | Alphabetical by id | Sorted by CEFR (A1 → A2 → B1 → B2 → C1 → C2) |
| Icons | Single `LineIcon` SVG repeated | Microsoft Fluent 3D emoji PNGs |

### Files added

```
apps/web/app/components/CoursePathCard.tsx        (126 lines)
apps/web/app/components/CoursePathGrid.tsx        (182 lines)
apps/web/public/icons/fluent/light-bulb.png       (22 KB — track: work)
apps/web/public/icons/fluent/bullseye.png         (42 KB — track: exam)
apps/web/public/icons/fluent/books.png            (26 KB — track: foundation)
apps/web/public/icons/fluent/locked.png           (30 KB — state: locked)
apps/web/public/icons/fluent/check.png            (34 KB — state: completed)
apps/web/public/icons/fluent/star.png             (28 KB — reserved, not yet used)
apps/web/public/icons/fluent/LICENSE.txt          (MS MIT)
apps/web/public/icons/fluent/README.md
```

### Files modified

- `apps/web/app/components/LumaUserDashboard.tsx` — **only** the `activeView === "courses"` branch (~lines 2339–2369) and one new import line. Everything else is untouched.
- `apps/web/app/globals.css` — appended ~300 lines for the new `.ll-course-path-*` rules between `.ll-course-tile-footer span` and `.ll-list-panel`. **No existing rule was modified.**

### Why this approach (so you don't "fix" it)

- Lock logic uses **`progress >= 100`** as the unlock threshold per the user's explicit choice. Do not change to "any progress" or "completed task count" without asking the user.
- Progress is **mocked at 68%** for enrolled courses inside `CoursePathGrid.progressFor()`. This mirrors the legacy `ProgressBar value={profile.enrolledCourseIds.includes(course.id) ? 68 : 0}` line that was in the old JSX. **This is intentional** until the `course_progress` table is wired (Phase 2). Don't replace with `0` or remove the constant.
- The connector line between cards was **explicitly removed** by user request and replaced with the shimmer animation on the active card's progress bar. Do not add the connector back.
- Card uses **`.ll-glass` (light)** to match the rest of the dashboard. Do not switch to a darker variant — the dashboard background is light.
- The `<button disabled>` on locked cards is **correct** for a11y. Don't change to a `<div>` or remove the `disabled` attribute.
- The "Đăng ký mới" button in the header was kept (still no handler) because it predates this PR. Hooking it up is out of scope.

---

## Review checklist for this PR

Please run through these and fix anything that fails. Do not touch items already addressed unless you find a real bug.

### Must check

- [ ] `npm run build` from repo root (or `npm run build --workspace=@language-platform/web`) — should pass with 12 static pages, 0 warnings.
- [ ] `npx tsc --noEmit` in `apps/web/` — should be clean.
- [ ] `npm run dev` in `apps/web/`, open `http://localhost:3000/learn`, click "Khóa học" tab. Verify:
  - [ ] 3 track rows render (work / exam / foundation).
  - [ ] Each card shows the level pill, title (clamped to 2 lines), lesson count, progress bar.
  - [ ] Locked cards are desaturated (~50% opacity) and not clickable.
  - [ ] Active card has the "Đang học" pill on the right and a shimmer running across the progress bar.
  - [ ] Completed card has the green check icon on the right.
  - [ ] Fluent emoji icons load (track headers + lock + check). They're served from `/icons/fluent/*.png` via `next/image`.
  - [ ] No horizontal scrollbar on the page.
  - [ ] At narrow widths (resize browser), grid drops from 5 → 4 → 3 → 2 → 1 cols cleanly at 1280 / 1024 / 720 / 480 px.

### Nice to verify

- [ ] Existing dashboard views (`overview`, `study`, `library`, `community`, `progress`) are **unchanged** — only the `courses` branch was touched.
- [ ] No console warnings about `<img>` vs `next/image` (the components use `next/image`).
- [ ] `prefers-reduced-motion: reduce` disables the shimmer (test in DevTools rendering panel).

### Likely follow-up (don't do yet unless asked)

- The legacy `.ll-course-tile*` CSS rules in `globals.css` are now **unused** by any view. They can be removed in a cleanup PR but I left them in to keep this diff focused on adding, not removing.
- The mocked 68% progress should be replaced with a real lookup from `course_progress` when that table exists. The shape needed:
  ```ts
  function progressFor(profile: LearnerProfile, courseId: string): number
  ```
  Currently in `CoursePathGrid.tsx` — replace its body. Don't change the call site.
- The `star.png` icon was downloaded but is not yet used. Reserved for a future "mastered" state (e.g., revisit a completed course and ace a quiz). Leave it for now.
- JLPT levels (`N5`–`N1`) are supported in `CEFR_ORDER` for forward compatibility but no JLPT courses exist in seed data yet. Don't remove those entries.

---

## Open branches (state of the repo right now)

| Branch | Status | Notes |
|---|---|---|
| `main` | `048edf9` | typography unified, courses learning-path landed |
| `feat/placement-screen` | merged earlier | placement flow at `/placement` — feature branch still exists on remote, can be deleted any time |

All other recent branches have been cleaned up:
- `feat/courses-learning-path` → squashed into `3cabc83`, branch deleted
- `fix/typography-inter-unified` → squashed into `048edf9`, branch deleted
- `feat/course-cards-tilt-spotlight` → rejected by user (path layout preferred), branch deleted without merging (work preserved in git reflog if needed)

---

## Working agreement between us

- Claude designs and pushes branches. Codex reviews and pushes fixes.
- If something below contradicts what you'd normally do, **ask the user before changing it**. The user wants the design preserved across handoffs, not re-skinned each round-trip.
- Vietnamese first. UI copy stays in Vietnamese; if you add new strings, no italics (per `fix/typography-inter-unified`).
- Inter font only. No serif, no italic accents — use `<span className="ll-accent">` for emphasis instead of `<em>`.
- No new packages without a clear reason in the commit message.
- Keep diffs focused. One PR = one intent.

---

## Quick reference: design tokens used in this PR

```
Track accents
  work:       #e2a73a   (warm amber, light bulb)
  exam:       #e23a6e   (magenta, bullseye)
  foundation: #4187d6   (steel blue, books)

Level pill tints (background of the small uppercase level badge)
  A1 #c9f7da   A2 #b3f0c8   B1 #8fe4b4
  B2 #6dd49c   C1 #4cbf85   C2 #2da66d

Card states
  locked:    opacity 0.5, saturate(0.6), border rgba(130,148,176,0.18)
  active:    border (accent at 55% opacity), shadow tinted with accent
  completed: linear-gradient(rgba(15,157,88,0.05), transparent), green check
```

Animation: `@keyframes ll-course-path-shimmer` — 1.8s linear infinite, runs only on cards with `[data-state="active"]`.

---

## Earlier note from Codex (kept for reference — already addressed and merged)

> ### Scope
> This change restored the learner dashboard at `/learn` while keeping the placement flow available as the entry assessment experience. It also kept the placement UI regression fixes found after the latest GitHub update.
>
> ### What Changed
> - Restored `/learn` to render the learner dashboard (`LumaUserDashboard`).
> - Removed the mini-placement gate and the "Đánh giá trình độ" action from the learner dashboard so `/learn` opens directly into study mode.
> - Updated site navigation, landing CTAs, auth redirect, admin rail link, and placement result CTA to send learners back to `/learn`.
> - Replaced the placement splash inline placeholder mark with the existing project logo at `/images/lumalang-logo.png`.
> - Fixed placement layout centering by converting placement component styles to scoped global selectors (Framer Motion wrapper + styled-jsx issue).
> - Added compact placement picker breakpoints for short / narrow viewports.
> - Updated `package-lock.json` after installing `framer-motion`, `gsap`.
