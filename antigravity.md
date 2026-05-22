# Antigravity — Codebase Map

> A reference doc for AI assistants (Antigravity in particular) editing this repo.
> Read this **before** you grep around blindly. It tells you where things live,
> what the patterns are, and what's safe to change vs. what looks weird but is on purpose.
>
> Last update: 2026-05-20 (after PR3 courses learning-path + typography unify).
> Companion file: see `codex.md` for the most recent PR's review checklist.

---

## TL;DR for the impatient

- This is a **Next.js 16 App Router** monorepo. Only `apps/web` is real — `apps/api` is a placeholder (empty README), `apps/ - Copy/` is a leftover folder you should ignore.
- The product is **LumaLang**, a Vietnamese-language AI English-learning platform. Three goal tracks: `work`, `exam`, `foundation`.
- The dashboard at `/learn` is **one giant component** (`LumaUserDashboard.tsx`, 3,100+ lines) with 9 views switched by a single `activeView` state. Don't try to "fix" the monolith — it's the deliberate design until refactor pass 2.
- **All styling lives in `apps/web/app/globals.css`** (~230 KB, ~7,900 lines). Class prefix: `.ll-*`. Use existing tokens — don't import a CSS framework.
- **Inter font only. No serif. No italics.** Emphasis goes through `<span className="ll-accent">`, never `<em>` or `<i>`.
- **No persistence backend yet.** Everything is `localStorage` + in-memory seed data. Prisma schema exists but is not wired.

---

## Repo layout

```
webtienganh/
├── apps/
│   ├── web/                            ← THE app
│   │   ├── app/                        ← Next.js App Router root
│   │   │   ├── layout.tsx              ← html lang="vi", mounts CursorEffect + global CSS
│   │   │   ├── page.tsx                ← marketing landing page (978 lines, scrollytelling)
│   │   │   ├── globals.css             ← 230 KB, all .ll-* rules live here
│   │   │   ├── components/             ← 10 component files (see inventory below)
│   │   │   ├── lib/                    ← product-data, learning-core, site-pages
│   │   │   ├── styles/                 ← fonts.css + theme.css (small, mostly empty)
│   │   │   ├── about/page.tsx
│   │   │   ├── admin/page.tsx          ← /admin → <AdminDashboard />
│   │   │   ├── api/gifs/search/route.ts ← only API route in the app
│   │   │   ├── auth/page.tsx           ← /auth → <AppHeader> + <AuthStudio>
│   │   │   ├── blog/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   ├── learn/page.tsx          ← /learn → <LumaUserDashboard /> (THE main screen)
│   │   │   ├── placement/              ← /placement, self-contained module
│   │   │   │   ├── page.tsx            ← reducer-driven stage machine
│   │   │   │   ├── _components/        ← splash, level-picker, quiz-slider, result
│   │   │   │   └── _lib/               ← types.ts, question-bank.ts
│   │   │   └── pricing/page.tsx
│   │   ├── public/
│   │   │   ├── icons/fluent/           ← MS Fluent 3D emoji PNGs (MIT, see LICENSE.txt)
│   │   │   ├── images/                 ← logo + marketing assets
│   │   │   └── models/                 ← 3D models for KnowledgeTreeScene
│   │   ├── next.config.ts
│   │   ├── package.json                ← see "Dependencies" section
│   │   └── tsconfig.json
│   └── api/                            ← placeholder, just a README
├── apps - Copy/                        ← ⚠️ stale duplicate, see "Known weirdness"
├── docs/
│   └── shadowing-source-policy.md      ← content-policy doc for shadowing clips
├── prisma/
│   └── schema.prisma                   ← DB schema, NOT yet wired to the app
├── codex.md                            ← latest PR review notes (handover for Codex)
├── antigravity.md                      ← you are here
├── ke-hoach-trien-khai.md              ← Vietnamese roadmap / implementation plan
├── package.json                        ← workspace root, npm workspaces
└── package-lock.json
```

---

## Routes & what each one renders

| Path | File | Renders | Notes |
|---|---|---|---|
| `/` | `app/page.tsx` | inline JSX (long) | Marketing landing, scrollytelling, uses `<AppHeader>` |
| `/learn` | `app/learn/page.tsx` | `<LumaUserDashboard />` | **The product**. Sidebar + 9 views |
| `/placement` | `app/placement/page.tsx` | Stage machine (splash/picker/quiz/result) | Self-contained, deep green theme — different from rest of app |
| `/admin` | `app/admin/page.tsx` | `<AdminDashboard />` | CRUD-style content management UI |
| `/auth` | `app/auth/page.tsx` | `<AppHeader>` + `<AuthStudio>` | Login/signup flow |
| `/about`, `/blog`, `/contact`, `/pricing` | `app/*/page.tsx` | `<StaticSitePage content={sitePages.X} />` | Data-driven from `lib/site-pages.ts` |
| `/api/gifs/search` | `app/api/gifs/search/route.ts` | server route | Proxies Tenor GIF search for the avatar picker |

All pages wrap their content in `<main className="page-shell theme-light ...">`. Page shell classes are defined in `globals.css`.

---

## Component inventory (all live under `apps/web/app/components/`)

| File | Lines | Purpose | Used by |
|---|---|---|---|
| `LumaUserDashboard.tsx` | **3,115** | Learner dashboard — sidebar nav + 9 view branches in one component | `/learn` |
| `LearnerDashboard.tsx` | 922 | **Older version**, kept around but no longer routed. May contain useful UI fragments. Don't delete without checking. | (unused) |
| `AdminDashboard.tsx` | 707 | Admin CMS (courses, users, content, tokens, settings) | `/admin` |
| `KnowledgeTreeScene.tsx` | 332 | three.js 3D scene used inside learner dashboard "Today" view | `LumaUserDashboard` |
| `AuthStudio.tsx` | 221 | Auth/signup card | `/auth` |
| `CoursePathGrid.tsx` | 182 | Groups courses by goal track, computes lock states | `LumaUserDashboard` (courses view) |
| `CoursePathCard.tsx` | 126 | Compact card with lock/active/completed states + shimmer | via `CoursePathGrid` |
| `StaticSitePage.tsx` | 103 | Renders a static-marketing page from a config object | `/about`, `/blog`, `/contact`, `/pricing` |
| `CursorEffect.tsx` | 84 | Mounts a custom cursor follow effect on `<body>` | `layout.tsx` (every route) |
| `AppHeader.tsx` | 69 | Top nav bar with logo + links + action button | `/`, `/auth`, blog pages |

---

## `LumaUserDashboard.tsx` — internal map

This is the file you will edit most. It's intentionally a monolith for now.

### `LearningView` union (the sidebar tabs)

```ts
type LearningView =
  | "today"       // Hôm nay  — daily plan, AI tutor, knowledge tree
  | "lesson"      // Bài học  — current lesson player
  | "courses"     // Khóa học — learning-path grid (uses CoursePathGrid)
  | "practice"    // Đề luyện — quiz / drill
  | "flashcards"  // Flashcard
  | "shadowing"   // Shadowing
  | "schedule"    // Lịch học
  | "group"       // Nhóm
  | "profile";    // Profile editor (avatar/GIF/initial), not in main nav
```

### Where each view lives in the file

| View | Approx line |
|---|---|
| `today` | 2201 |
| `lesson` | 2303 |
| `courses` | **2340** ← **uses `<CoursePathGrid>`, this is the only "clean" view** |
| `practice` | 2358 |
| `flashcards` | 2407 |
| `shadowing` | 2700 |
| `schedule` | 2763 |
| `group` | 2971 |
| `profile` | 3029 |

To edit a specific view, jump to `activeView === "<name>"` rather than scrolling. Each branch is self-contained.

### Storage keys

```ts
SESSION_STORAGE_KEY     = "lumalang.session.v1"        // current LearnerProfile
COURSE_STORAGE_KEY      = "lumalang.admin-courses.v1"  // Course[] (admin edits)
FLASHCARD_STORAGE_KEY   = "lumalang.flashcards.v1"     // PersonalFlashcard[]
SCHEDULE_STORAGE_KEY    = "lumalang.schedule.v1"       // schedule state
```

All persistence is `localStorage`. There's a `readJson<T>(key, default)` helper inside the file — use it, don't call `localStorage.getItem` directly in new code.

---

## Data layer (`apps/web/app/lib/`)

### `learning-core.ts`
Pure domain types and templates. **No React, no localStorage.**
- `type Goal = "exam" | "work" | "foundation"` — the three tracks
- `pathTemplates: Record<Goal, ...>` — what a learning path looks like per goal
- `goalLabels` — Vietnamese display names
- Question / TodayTask / PathStep type defs

### `product-data.ts`
Seed data + a few storage-related constants. Imports `Goal` from `learning-core`.
- `LearnerProfile` — main user shape (id, name, language, level, goal, enrolledCourseIds, completedTaskIds, ai token budget, etc.)
- `Course` — what a course looks like (id, title, language, level: CEFR string, goal, objective, lessons, students, etc.)
- `defaultCourses: Course[]` — seed catalog (13 courses across the three goals)
- `createDemoProfile()` — fabricates a demo learner
- `getRecommendedCourseId(profile)` — recommends a course based on level + goal
- `goalLabels`, `providerLabels` — Vietnamese display strings
- `SESSION_STORAGE_KEY`, `COURSE_STORAGE_KEY` — re-exported by the dashboard

### `site-pages.ts`
A config object: `sitePages.about`, `.blog`, `.contact`, `.pricing` — each is shaped for `<StaticSitePage>` to render.

---

## Styling system

### Where styles live
**Everything is in `apps/web/app/globals.css`.** ~7,900 lines, ~230 KB. There is no Tailwind, no CSS-in-JS framework, no CSS modules (except one inline `<style jsx global>` block in `placement/page.tsx`).

`apps/web/app/styles/fonts.css` and `theme.css` exist but are nearly empty — most theme tokens are inlined in `globals.css :root`.

### Class naming convention: `.ll-*`

Prefix `ll-` (= LumaLang). Examples of families currently in use:
```
.ll-accent          .ll-glass          .ll-page          .ll-topbar
.ll-btn             .ll-card           .ll-card-grid     .ll-section
.ll-nav-item        .ll-label          .ll-grid          .ll-tag
.ll-course-tile     ← legacy course card (unused after PR3, slated for cleanup)
.ll-course-path-card ← current course card (PR3)
.ll-flashcard       .ll-shadowing      .ll-schedule      .ll-group
.ll-practice        .ll-profile        .ll-placement     .ll-tree
.ll-cat             .ll-wave           .ll-leaderboard   .ll-knowledge
```
Run `grep -oE '\.ll-[a-z-]+' apps/web/app/globals.css | sort -u` to see all 212 unique classes.

### Design tokens (`:root` in `globals.css`)

```css
--font-ui:    Inter, ui-sans-serif, system-ui, ...   /* ONLY font in use */
--font-serif: Inter, ...                              /* aliased to Inter, do NOT use a real serif */
--font-mono:  "DM Mono", "SFMono-Regular", ...

--page:         #f7faf7   /* primary background */
--paper:        rgba(255,255,255,0.48)
--paper-strong: rgba(255,255,255,0.82)
--ink:          #172033   /* primary text */
--muted:        #647084
--soft:         #8a95a7
--line:         rgba(130,148,176,0.18)

--blue:         #4285f4
--green:        #0f9d58   /* brand accent; used for "completed" states */
--yellow:       #fbbc05
--red:          #ea4335
--violet:       #7c3aed
```

A second variant (`--page-start`/`--page-end`/dark-ish ink) appears at line 172 — that's the `theme-dark` / placement variant.

### Typography rules (enforced by `fix/typography-inter-unified` PR)

1. **Inter only.** Don't introduce a serif/display font without an explicit go-ahead from the user.
2. **No `<em>` or `<i>` tags.** Use `<span className="ll-accent">` for emphasis. There's a global `em { font-style: normal }` reset to catch accidents.
3. OpenType features are enabled globally: `font-feature-settings: 'cv11', 'ss01', 'ss03'` plus `-webkit-font-smoothing: antialiased`.
4. SVGs that take a font-family inline should use the Inter stack, not "Manrope" or anything else.

---

## The three goal tracks (recurring concept)

Used in `Goal` type, `goalLabels`, `pathTemplates`, course filtering, CoursePathGrid, and the placement test.

| `Goal` | Vietnamese label | Icon (Fluent 3D) | Accent color |
|---|---|---|---|
| `work` | Giao tiếp công việc | `light-bulb.png` | `#e2a73a` |
| `exam` | Luyện thi | `bullseye.png` | `#e23a6e` |
| `foundation` | Nền tảng & Phản xạ | `books.png` | `#4187d6` |

CEFR levels supported: `A1`, `A2`, `B1`, `B2`, `C1`, `C2`. JLPT (`N5`–`N1`) is stubbed in for future Japanese support but has no seed courses yet.

---

## Placement test module (`apps/web/app/placement/`)

This is the cleanest sub-feature in the codebase — **use it as the template for any new feature**.

```
placement/
├── page.tsx              ← reducer-driven stage machine, owns the gradient background
├── _components/
│   ├── splash-screen.tsx
│   ├── level-picker.tsx
│   ├── quiz-slider.tsx
│   └── result-screen.tsx
└── _lib/
    ├── types.ts          ← CEFRLevel, PlacementState, PlacementAction, etc.
    └── question-bank.ts  ← seed questions per CEFR level
```

Patterns to copy:
- Underscore-prefixed `_components` / `_lib` folders to mark them private to the route.
- All shared types in `_lib/types.ts`.
- Reducer + action union in `page.tsx`; child components are pure presentational.
- One `<style jsx global>` block at the bottom of `page.tsx` for layout-specific styles (the rest still goes in `globals.css`).

---

## Dependencies (and the reasoning)

### Top-level `package.json`
```
"@gsap/react": "^2.1.2"        ← GSAP React hook
"gsap": "^3.15.0"              ← scrollytelling on landing page
"three": "^0.184.0"            ← KnowledgeTreeScene 3D
"@types/three": "^0.184.0"
```

### `apps/web/package.json`
```
"next": "16.2.4"               ← App Router
"react": "19.0.0"
"react-dom": "19.0.0"
"framer-motion": "^11.11.17"   ← placement screen slide transitions
"gsap": "^3.12.5"              ← (duplicated, intentional — different version pin)
```

**Don't add a CSS framework** (Tailwind, Chakra, MUI, etc.). The whole design system is hand-rolled in `globals.css`.
**Don't add a state library** (Redux, Zustand, etc.). Local state + localStorage is the current rule.
**Don't add an ORM client to the frontend.** Prisma schema is there for future API work; it's not consumed by the web app.

---

## Known weirdness — read before "fixing"

1. **`apps - Copy/` folder.** A stale duplicate of `apps/` containing only 4 outer files (no `app/` inside). It IS tracked by git but isn't actually used. Don't touch in normal PRs — earmarked for a one-shot cleanup PR.

2. **`apps/api/` is a placeholder.** Just a README. Real API work is deferred until Prisma is wired.

3. **`LumaUserDashboard.tsx` is 3,115 lines.** This is deliberate. The refactor plan is to wait until the feature surface stabilizes, then extract each `activeView === "..."` branch into its own file. **Don't proactively split it** unless asked.

4. **`LearnerDashboard.tsx` (922 lines) is no longer routed.** It was the previous version of the learner dashboard. Kept in tree because some UI fragments (e.g. the SVG illustrations) may still get ported over. **Don't delete without asking.**

5. **Two GSAP versions are pinned** (root `^3.15.0`, web app `^3.12.5`). Not a bug — root uses it via `@gsap/react`, web uses the raw lib. Leave alone.

6. **Placement screen uses a different visual theme.** Deep-green radial gradient background, light text — contrast with the rest of the app, which is light glass on `#f7faf7`. This is intentional (placement = "ceremony" moment). Don't unify the themes.

7. **Mocked progress = 68%.** `CoursePathGrid.progressFor()` returns 68 for any enrolled course. This is on purpose until a real `course_progress` table exists. **Don't replace with `0`.**

8. **`prisma/schema.prisma` exists but isn't wired.** No Prisma client is generated; the schema is the design doc for the future backend. Treat it as documentation, not code.

9. **`<em>` tags get auto-defeated.** `globals.css` has `em { font-style: normal }`. Adding new `<em>` won't do what you expect — use `<span className="ll-accent">` instead.

---

## When you want to edit X, look here first

| Goal | Where to look |
|---|---|
| Add a new course | `lib/product-data.ts` → `defaultCourses` array. Don't touch the component. |
| Change course display | `components/CoursePathCard.tsx` for the card, `CoursePathGrid.tsx` for the grouping/sorting/lock logic |
| Change a learner dashboard view | `LumaUserDashboard.tsx`, jump to `activeView === "<name>"` |
| Add a new sidebar tab | `LumaUserDashboard.tsx` → `LearningView` union + `navItems` array + new view branch + matching CSS in `globals.css` |
| Change the placement test | `app/placement/` — page.tsx for flow, `_lib/question-bank.ts` for questions, `_lib/types.ts` for state shape |
| Change static marketing pages | `lib/site-pages.ts` for content; `components/StaticSitePage.tsx` for layout |
| Change global styles / tokens | `app/globals.css` `:root` block at the top |
| Change fonts | `app/styles/fonts.css` + `globals.css` `--font-ui` (but read the typography rules first) |
| Add a new route | New folder under `app/`, with `page.tsx`. Use `placement/` as the template if it's stateful. |

---

## Branch + PR etiquette (matches `codex.md`)

- One PR = one intent. Don't bundle "feature X + cleanup Y + rename Z".
- Branch names: `feat/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`.
- Squash-merge to main. The squash commit message should explain *why*, not just *what*.
- After merge, delete the remote branch.
- Always run `npx tsc --noEmit` and `npm run build --workspace=@language-platform/web` before pushing.
- Vietnamese first for UI strings. Code comments can be either Vietnamese or English; commit messages and PR descriptions: English preferred for searchability.

---

## What's "good code" in this repo

Look at the **placement module** and **CoursePathCard/CoursePathGrid** for the current bar:
- Pure presentational components, no `useEffect` doing data fetching.
- Types defined in a co-located `_lib/types.ts` or at the top of the file.
- CSS class hooks in `globals.css`, never inline style objects for anything reusable.
- One reducer or one `useState` cluster, not scattered state.
- File-level doc comment at the top explaining intent (see `CoursePathCard.tsx` for the format).

Avoid the pattern of `LumaUserDashboard.tsx` going forward (one giant component, multiple concerns), even though the file itself is allowed to stay that size until the refactor pass.

---

If this doc gets stale, update the **Last update** line at the top and bump anything that's drifted. The repo's truth is the code; this is the map to the code.
