# Notes for Codex

> Last update: 2026-05-23, on branch `feat/groups-community-redesign`.
> Sequence on `main` after merge: PR1 placement → restore dashboard → PR3 courses learning-path → PR4 typography unified → PR5 landing GSAP + 3D pets → **THIS PR**.

---

## What's in this PR

Three intentional intents bundled because they touch overlapping surfaces (the landing page + the global app shell):

1. **Groups community-first redesign** (the bulk of the diff — see "Groups V2" section below).
2. **Replace the landing page** — promote `home_plan_2` to `/`, delete the old 978-line scrollytelling `page.tsx`.
3. **Unify landing CTA buttons** — 6 different button implementations scattered across the page, only 3 of which had GSAP hover effects. Now one `<LandingCta>` component, one GSAP wiring, every button animated.

---

## 1. Groups V2 — `/learn → Nhóm`

**Branch:** `feat/groups-community-redesign`

### Mental model

| Concept | Old | New |
|---|---|---|
| Layout | 3-card grid + leaderboard sidebar | List view (safety banner + my groups + suggestions) + detail view |
| Group identity | Banner gradient + tag pills | Avatar gradient with initials + role pills + stat row |
| Leaderboard | Global, side panel | **Per-group**, inside the leaderboard tab |
| Members | Avatars only | Members with online dot + role + activity |
| Features per group | Just chat | 4 tabs in v1 (chat + deadline + leaderboard + overview), 3 v2 placeholders |
| Safety | None | Always-visible banner + chat filter + report buttons |
| Roles | None | Discord-style custom roles (color + icon, owner-defined) |
| Streak | None | Group streak = consecutive days ≥5 members studied |
| Plan tiers | None | Free (≤5 members, 30min voice) vs Pro (≤20 members, replay, cohort schedule, custom branding) |

### Files added (groups subsystem)

```
apps/web/app/lib/group-data.ts                              (419 lines)
apps/web/app/components/GroupsView.tsx                      (178 lines)
apps/web/app/components/GroupDetailView.tsx                 (185 lines)
apps/web/app/components/groups/SafetyBanner.tsx             (24)
apps/web/app/components/groups/RolePill.tsx                 (30)
apps/web/app/components/groups/GroupCard.tsx                (158)
apps/web/app/components/groups/SuggestedGroupCard.tsx       (61)
apps/web/app/components/groups/GroupOverview.tsx            (170)
apps/web/app/components/groups/ChatPanel.tsx                (207)
apps/web/app/components/groups/DeadlinePanel.tsx            (119)
apps/web/app/components/groups/LeaderboardPanel.tsx         (128)
apps/web/app/components/groups/ComingSoonPanel.tsx          (90)
```

### Files modified

- `apps/web/app/components/LumaUserDashboard.tsx` — **only** the `activeView === "group"` branch (~line 2971) was replaced with a single `<GroupsView />` call. Two new import lines added. Everything else untouched.
- `apps/web/app/globals.css` — appended ~1,100 lines of `.ll-grp-*` rules between `.ll-course-path` block and `.ll-list-panel`. **No existing rule modified.**

### Why this approach (do not "fix")

- **Chat filter uses Unicode-aware lookarounds** `(?<![\p{L}\p{N}])...(?![\p{L}\p{N}])` instead of `\b`. This is intentional because `\b` only treats ASCII as word chars and would fire INSIDE Vietnamese words containing diacritics (e.g. "học" → boundary between "ọ" and "c"). Tested with 8 cases — "học phí" is correctly flagged as a tuition keyword while "Ai đang học tiếng Pháp" is not flagged. **Do not "simplify" back to `\b`.**
- **Auto-redact, not block.** When the filter fires, the message still sends with `***` in place of the offending substring. The sender sees the redacted version too. Chosen because benign mentions of "telegram" or "học" should not be silently dropped. Do not change to block-on-send.
- **`PLAN_LIMITS` table** is the source of truth for free vs pro caps. Don't hardcode "5" or "20" in components — read from `PLAN_LIMITS[group.ownerPlanTier].maxMembers`.
- **3 of 7 tabs are intentional `ComingSoonPanel` placeholders** (voice / peer / co-watch). Not unfinished — they validate demand before we build. The "Đăng ký nhận thông báo" button has no backend yet but is intentional.
- **Per-group leaderboard, not global.** The old global leaderboard right-sidebar was removed because it discouraged smaller groups. Competition stays inside the group.
- **Chat panel persists messages in `useState` only.** This is a deliberate v1 limitation — Prisma persistence will come in a later PR. Do not replace `setMessages` with localStorage or fetch without explicit ask.
- **`currentUserId` is hardcoded to "m-self"** in `LumaUserDashboard.tsx`'s `<GroupsView />` call. That id matches the seed data. When auth is wired up, this becomes `session.user.id`. Don't refactor to a prop drilling chain — wait for the real session.

### Review checklist for groups

- [ ] Regex patterns in `group-data.ts` — confirm `/u` flag is present on all 3 lookaround patterns (it is, but worth eyeballing).
- [ ] Member dots in `DeadlinePanel.tsx` — `outline: 2px solid` on `is-you` should be visible against any avatar color.
- [ ] Sort order in `LeaderboardPanel.tsx` — `[...group.members].sort(...)` is shallow-copied, doesn't mutate the source. ✓
- [ ] `ComingSoonPanel.tsx` — the "đăng ký quan tâm" button only sets local state. Confirm no console.error appears.
- [ ] Type check: `npx tsc --noEmit` should be clean.
- [ ] Build: `npm run build --workspace=@language-platform/web` should produce 12 pages.

---

## 2. Landing page — `home_plan_2` is now `/`

**Why:** PR5 (`92ef93d` on main) added `home_plan_2/page.tsx` (663 lines, GSAP + 3D pets) as a sibling to the old `/` (978 lines, the original scrollytelling marketing page). User decided the new one wins.

### Changes

- `apps/web/app/page.tsx` — replaced with the contents of `home_plan_2/page.tsx`, with import paths fixed (`../components/` → `./components/`, `../styles/` → `./styles/`) and brand link `href="/home_plan_2"` → `href="/"`.
- `apps/web/app/home_plan_2/` — directory deleted.

### Verify

```bash
ls apps/web/app/ | grep -E '^(home|page)'
# Expected: just `page.tsx`
```

If you see `home_plan_2/` still there, the move didn't complete. Do not re-create it.

---

## 3. Landing CTA buttons — unified

**The problem:** the landing page had 6 CTA buttons across 4 sections:

| Location | Old class | Hover effect? |
|---|---|---|
| Header "Vào học ngay" | `.ll-header-cta` | Only border color |
| Hero "Học thử miễn phí" | `.ll-btn--gsap` | Only background swap |
| 3 feature CTAs | `.ll-btn ll-btn--gsap-hover` | Full GSAP (magnetic + fill + shimmer) |
| Final "Vào học ngay" | `.ll-btn ll-btn--fill ll-btn--lg` | Only shadow offset |

Only the 3 feature CTAs in the middle had real GSAP effects. The other 3 were inconsistent — different shapes, different hover behaviors. User screenshot showed the hero "Học thử miễn phí" as inert.

### Fix

**New file:** `apps/web/app/components/LandingCta.tsx` (~50 lines)

Single component, 3 variants × 3 sizes:
- `variant="primary"` — solid green pill, dark text. For the "main" CTAs (hero with arrow, final "Vào học ngay").
- `variant="outline"` — transparent + green border + green text. For the hero "Học thử miễn phí" (matches the user's screenshot).
- `variant="ghost"` — transparent + subtle white border. For the header CTA and 3 feature CTAs.
- `size="sm"` (header) / `"md"` (features) / `"lg"` (hero + final).

DOM structure is constant: `<a class="ll-cta ll-cta--variant ll-cta--size"><span class="ll-cta-fill"/><span class="ll-cta-shimmer"/><span class="ll-cta-text">...</span></a>`.

**GSAP wiring** (in `app/page.tsx` useEffect) was rewritten to query `.ll-cta` (1 selector for all 6 buttons) and attach:
- Magnetic pull (button drifts toward cursor)
- Directional fill bubble (circular fill grows from cursor entry point)
- Continuous shimmer (sweeps every 3 seconds)
- Active press (squash on `pointerdown`, springs back on `pointerup`)
- All listener cleanup tracked in `ctaCleanups[]`, called from the `useEffect` return.

**Reduced motion + touch:**
- `@media (prefers-reduced-motion: reduce)` → shimmer + fill `display: none`, listeners early-return.
- `@media (hover: none)` → magnetic translate disabled (no awkward drift on touch).

### CSS housekeeping

Removed (replaced by `.ll-cta`):
- `.ll-header-cta` (block)
- `.ll-btn--gsap` (block)
- `.ll-btn` / `.ll-btn--fill` / `.ll-btn--stroke` / `.ll-btn--lg` (block)
- Mobile override `@media .ll-btn { ... }` → updated to target `.ll-cta`

The `.ll-btn--gsap-hover` class on feature rows is gone too — those CTAs now use `<LandingCta variant="ghost" size="md">`.

### Review checklist for CTA

- [ ] Hover the header "Vào học ngay" — should show magnetic pull + green border highlight.
- [ ] Hover the hero "Học thử miễn phí" — should show full magnetic + green fill from cursor entry.
- [ ] Hover each of the 3 feature CTAs — same effect, ghost variant.
- [ ] Hover final "Vào học ngay" — primary variant, fill goes light from cursor.
- [ ] Click any button — should squash to `scale(0.96)` and bounce back.
- [ ] Keyboard tab through CTAs — `:focus-visible` green outline should be visible.
- [ ] Throttle CPU 4x and test — no jank on mousemove (we use `gsap.to` with 0.35s duration; not running on every frame).

---

## Don't bundle (saved for later)

- Wire create-group modal (currently `onCreateGroup` just `console.log`s).
- Implement `onJoinRequest` properly (currently calls `toggleGroup`).
- Replace mock 68% progress + mocked weekly scores with real telemetry once `course_progress` exists.
- `LearnerDashboard.tsx` (922 lines, unused) still in tree.
- `apps - Copy/` stale folder still tracked.
- Connect Prisma schema to API.

---


## Previous PR notes (legacy — for context)

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
