# Antigravity — Project Brief & Sprint Plan (Hand-off for next AI)

> **Reading order:** This document, top to bottom. Do not jump.
> **Audience:** Antigravity, Codex, Claude, or any AI assistant continuing this codebase.
> **Voice:** Vietnamese-first product. Write all user-facing strings in Vietnamese. Talk to the human owner in Vietnamese.
> **Last update:** 2026-05-25 (after PR-A → PR-D personalization arc merged to `main`).

---

## Section 0 — TL;DR for the next AI

You are continuing work on **LumaLang** (repo: `webtienganh`), a Vietnamese-first AI English-learning platform.

1. **Stack:** Next.js 16 App Router monorepo (pnpm). Only `apps/web` is real. TypeScript + Tailwind + framer-motion + GSAP.
2. **Frontend MVP done, backend NOT BUILT.** Everything persists to `localStorage`. The next sprint (PR-E onwards) is to build the real backend.
3. **The user's owner request is explicit:** Do the work end-to-end. Do not ping-pong small steps. Commit, merge to `main`, push. The human will pull once.
4. **9 views in one 3,072-line dashboard.** `apps/web/app/components/LumaUserDashboard.tsx`. Don't refactor — edit the relevant `activeView === "..."` block. Pattern intentional until a future refactor PR.
5. **All styling in `apps/web/app/globals.css`** (~14,341 lines, ~440 KB). Class prefix `.ll-*`. Inter font only, no serif, no italic, `<span className="ll-accent">` not `<em>`.
6. **The personalization arc (PR-A → PR-D) is DONE and merged.** This doc explains what to do next: PR-E (database) → PR-F (auth) → PR-G (vocab APIs + shadowing) → PR-H (TTS + audio) → PR-I (content expansion) → PR-J (deploy).
7. **Anything you see in `localStorage` keys `lumalang.*` is temporary** — it will be migrated to Postgres in PR-E. Don't add new localStorage keys; add them to the upcoming Prisma schema instead.

---

## Section 1 — What is "ASU"? (every model MUST read this)

**ASU = Atomic Skill Unit.** The fundamental building block of our lesson system. Replaces the legacy `Lesson` model entirely.

### Why ASU instead of Course → Lesson

Traditional language apps use a fixed hierarchy: Course → Lesson → Exercise. Each lesson is hardcoded content tied to one course. To support N user contexts (work, exam, foundation, travel) × M industries × L levels, you would need ~N×M×L lessons — multiplicative growth. Personalization becomes "pick a course from catalog."

ASU flips this. Skills are atomic and tag-driven. The same skill `"How do you do?"` can appear in business-greeting, hotel-checkin, and A1-foundation playlists. The recommender filters by tags + user profile + spaced-repetition state to pick N skills per session.

Database scale comparison:
- Fixed lessons: ~18,000 rows (3 tracks × 6 levels × 1000 lessons)
- ASU: ~5,000 rows total, shared across all contexts

### ASU schema (canonical)

Location: `apps/web/app/lib/skill-units.ts`

```typescript
type SkillType =
  | "vocab" | "phrase" | "grammar"
  | "listening" | "pronunciation"
  | "reading" | "writing";

type SkillTag =
  | `level:${CEFRLevel}`        // level:A1, level:B2
  | `goal:${PrimaryGoal}`       // goal:foundation, goal:work
  | `weakness:${string}`        // weakness:pronunciation, weakness:vocab
  | `industry:${string}`        // industry:it_software
  | `exam:${string}`            // exam:ielts, exam:toeic
  | `travel:${string}`          // travel:food, travel:hotel
  | `targets:${string}`;        // targets:articles, targets:verb_tense

type SkillPayload =
  | { type: "vocab"; word, pos, pronunciation_ipa?, audio_url?,
      definition_en, definition_vi, example_en, example_vi }
  | { type: "phrase"; phrase_en, phrase_vi, audio_url?, context,
      example_en, example_vi }
  | { type: "grammar"; rule_title_vi, pattern, explain_vi,
      examples: Array<{en, vi}>, common_mistakes_vi? }
  | { type: "listening"; audio_url, transcript_en, transcript_vi?,
      question_vi, options, answer_index }
  | { type: "pronunciation"; target_text_en, target_audio_url?, ipa?, tip_vi }
  | { type: "reading"; passage_en, passage_vi?, question_vi, options, answer_index }
  | { type: "writing"; prompt_vi, target_word_count, example_answer_en };

interface SkillUnit {
  id: string;                          // e.g. "vocab.foundation.hello.v1"
  level: CEFRLevel;                    // A1..C2
  tags: SkillTag[];
  prerequisites: string[];             // other skill IDs
  estimated_seconds: number;
  payload: SkillPayload;
  author_note?: string;
}

interface TrackTemplate {
  id: string;
  name_vi: string;
  description_vi: string;
  cefr_range: [CEFRLevel, CEFRLevel];
  required_tags: SkillTag[];
  preferred_tags?: SkillTag[];
  goal: PrimaryGoal;
  estimated_hours: number;
}
```

**Important field name quirks (caused real bugs in PR-D):**
- vocab uses `pronunciation_ipa` (not `ipa`), `definition_vi` is **singular** (not `definitions[]`).
- phrase uses `phrase_en` / `phrase_vi` (not `text_en` / `text_vi`).
- listening uses `question_vi` (not `question`).
- pronunciation uses `target_text_en` (not `target_pattern`); has **no** `examples[]` array.
- reading and writing have **no** `title_vi` field — front-load with passage / prompt directly.
- TrackTemplate has **no** `name_en` field.

When generating new ASUs, match this schema EXACTLY. `npx tsc --noEmit` will catch mismatches.

---

## Section 2 — Sprint history (what is on `main`)

Read in order — each PR depends on the previous.

### PR-A: Placement v2 (commit `38eaa99`) + CSS fix (`d72a51b`)

5-stage assessment flow at `/placement` to collect a rich LearnerProfile.

**Stages:**
1. `splash` — welcome
2. `why` — primary goal: work / exam / foundation / travel / other
3. `goal-context` — branches by goal (industry, exam target, weak skills, travel focuses)
4. `time` — daily minutes: 10 / 20 / 30 / 60
5. `picker` (legacy skip) OR `quiz` — adaptive 5-question CEFR placement
6. `calibration` — 3 questions detecting error patterns (skippable)
7. `result` — reveal level + path + profile pills

**Persists to two localStorage keys** so old code keeps working:
- `lumalang:placement` (legacy v1: cefr, skillScores, completedAt, via)
- `lumalang.placement.v2` (new: version 2 + cefr + primaryGoal + goalContext + dailyMinutes + errorPatterns + skillScores + completedAt + via)

**Files:**
- `apps/web/app/placement/page.tsx` — reducer + AnimatePresence stage machine
- `apps/web/app/placement/_lib/types.ts` (299 lines) — all enums, GoalContext discriminated union
- `apps/web/app/placement/_lib/calibration-bank.ts` — 8 detection questions
- `apps/web/app/placement/_components/*.tsx` — 7 stage components
- `apps/web/app/placement/_components/placement-v2.css` (496 lines, plain global CSS, `.pv2-*` prefix)

### PR-B: ASU data layer (commit `d857b1f`)

Three files in `apps/web/app/lib/`:

- **`skill-units.ts`** (260 lines) — types, helpers (`filterSkillsByTags`, `getSkillById`, `arePrerequisitesSatisfied`, `tagOverlapCount`)
- **`vocab-api.ts`** (210 lines) — wraps `https://api.dictionaryapi.dev/api/v2/entries/en` (Free Dictionary API, no key). Exports `lookupWord(word)`, `batchLookup(words)`, `speakWord(word, lang)` with LRU cache (200 cap).
- **`skill-seed-foundation.ts`** (1,402 lines) — 80 production-quality ASUs for foundation A1-A2:
  - 30 vocab (greetings, daily life, numbers, colors, time, common verbs, feelings, places, transport, body parts, weather, shopping)
  - 20 phrase (greeting, intro, polite request, asking for help, shopping, food, time, opinion, work, farewell)
  - 15 grammar (present simple, articles, to be, past simple, word order, plurals, questions, prepositions, pronouns, possessive, can/must, present continuous, there is/are, negative, frequency adverbs) — each with `common_mistakes_vi` targeting Vietnamese speakers
  - 10 listening (audio_url EMPTY PLACEHOLDER — see PR-H)
  - 5 pronunciation (Vietnamese-speaker pain points: /θ/ /ð/, -s endings, -ed endings, /l/ /r/, word stress)

### PR-C: Recommendation engine (commit `e60a224`)

Two files:

- **`apps/web/app/lib/user-skill-state.ts`** (217 lines) — sparse per-user per-skill state for SM-2.
  - `SkillState`: skillId, strength (0..1), nextReviewISO, easeFactor, intervalDays, timesCorrect, timesWrong
  - `applySm2(state, quality, now)` — SuperMemo-2 update step
  - `decayedStrength(state, now)` — 5% per day exponential decay for ranking (doesn't persist)
  - `gradeAttempt(correct, elapsedMs)` — binary → SM-2 quality (1-5)
  - localStorage key `lumalang.skill-state.v1`

- **`apps/web/app/lib/recommend-engine.ts`** (310 lines) — three-phase recommender:
  - Phase 1 `buildCandidatePool`: filter ASUs to CEFR ± 1 level
  - Phase 2 `scoreSkill`: weighted sum
    ```
    W.levelMatch         = 1.0
    W.goalTagOverlap     = 1.2
    W.errorPatternMatch  = 1.5
    W.urgency            = 1.8
    W.novelty            = 0.9
    ```
  - Phase 3 `diversePick`: top-N with MAX_PER_TYPE = 3
  - Public: `recommendDaily(allSkills, profile, opts)`, `recommendFromStorage(allSkills, opts)`, `scoreBreakdown(skill, profile)`
  - `buildProfile(snapshot)` translates Placement v2 → RecommenderProfile (maps `goal_context.work.industry` to tag `industry:it_software`, etc).
  - Session size from `dailyMinutes`: 10 → 3 skills, 20 → 5, 30 → 7, 60 → 12.

### PR-D: UI rebuild — courses + lesson player (commit `522488d`)

The user-facing surfaces that wire PR-A/B/C together. **The 13 old courses (defaultCourses) are no longer shown in the Khóa học tab — but the import + array remain in `product-data.ts` because 8 other dashboard views still depend on it. Removing it is a future refactor PR.**

**5 new files:**
- `apps/web/app/lib/track-templates.ts` — 4 TrackTemplate seeds. Only `track.foundation.core` has seeded ASUs; the others (`track.work.it`, `track.exam.ielts`, `track.travel.daily`) show "Sắp ra mắt".
- `apps/web/app/components/LearnPathHero.tsx` — Zone 1, personalized hero (track name, progress bar, 5 chip preview of today's queue, CTA "Bắt đầu phiên học hôm nay"). Falls back to `<PlacementCta />` if no v2 profile exists.
- `apps/web/app/components/CoursesViewV2.tsx` — 3-zone container (hero / topic packs / adjust). Swaps to `<SessionPlayer>` when active queue.
- `apps/web/app/components/SkillCard.tsx` — type-specific lesson UI, branches on `payload.type`. Calls `onComplete(correct, elapsedMs)`.
- `apps/web/app/components/SessionPlayer.tsx` — queue runner + SM-2 update after each skill + completion screen with stats.

**Modified files:**
- `apps/web/app/components/LumaUserDashboard.tsx` — added `import { CoursesViewV2 }`, replaced `activeView === "courses"` block to render `<CoursesViewV2 />` instead of `<CoursePathGrid />`. Removed dead "Đăng ký mới" button.
- `apps/web/app/globals.css` — appended ~700 lines of `.ll-courses-v2`, `.ll-path-hero*`, `.ll-topic-pack*`, `.ll-path-adjust*`, `.ll-session-*`, `.ll-skill-card`, `.ll-card-*`. Total now 14,341 lines.

---

## Section 3 — Current pain points the human asked to fix next

Quoted from the owner (Vietnamese, my translation in italics):

> *"Hiện tại có placement hoàn chỉnh nhưng chưa có đồng bộ"*
> The placement flow works but profile state lives in localStorage. Switch devices → data lost. Need real DB sync.

> *"Làm database hoàn chỉnh, backend kết nối các api liên quan đến từ vựng"*
> Complete database, then backend wraps the vocab APIs server-side (not browser-side calls).

> *"Phần shadowing api youtube kiểu vậy"*
> Add shadowing feature using YouTube Data API + transcripts. (Shadowing = repeat-after-the-speaker pronunciation practice — pick a YouTube clip, segment by captions, user records each segment.)

> *"Login/auth/kết nối google đăng nhập facebook"*
> Auth with Google OAuth + Facebook OAuth.

> *"Api cho free tts/phần nghe phát âm"*
> Free TTS API for listening clip generation + pronunciation playback.

> *"80-90% người học bắt đầu học được thì mới hiệu ứng chứ"*
> Must be 80-90% production-complete before deployment. No half-built features.

**The agreed scope is "MVP Foundation":**
- ONE track (foundation A1-A2) but deeply seeded
- Real auth + database + sync between devices
- Streak + reminders
- Shadowing YouTube feature working
- Real TTS audio for listening + pronunciation
- Deferred until later: IELTS / Work / Travel tracks, voice AI grading, payment, groups, premium tier

---

## Section 4 — Upcoming sprint plan (PR-E → PR-J)

**Execute in this order — each depends on the previous.** Each PR is one branch, end-to-end, merged to main directly by the AI (no human review step). The owner pulls once at the end.

### PR-E: Database schema + Prisma + Neon Postgres

**Goal:** Real database. Schema covers users, skills, skill-state, placement profiles, sessions, tracks, streaks.

**Stack choice:**
- **Postgres on Neon** (free tier 1GB, serverless, sleep-on-idle). If owner prefers Supabase, switch — Supabase also gives auth + storage + realtime, useful for later. Default to Neon for cleaner separation; auth via NextAuth in PR-F.
- **Prisma 6** as ORM.
- **`DATABASE_URL` and `DIRECT_URL`** env vars (Neon needs both: pooled for query, direct for migrations).

**Schema** (write to `apps/web/prisma/schema.prisma`):

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  accounts      Account[]
  sessions      Session[]
  placement     PlacementProfile?
  skillStates   SkillState[]
  studySessions StudySession[]
  streak        Streak?
}

// NextAuth.js standard tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// Our own tables
model PlacementProfile {
  userId         String   @id
  version        Int      @default(2)
  cefr           String   // "A1" | "A2" | ... | "C2"
  primaryGoal    String   // "work" | "exam" | "foundation" | "travel" | "other"
  goalContext    Json     // discriminated union
  dailyMinutes   Int      // 10 | 20 | 30 | 60
  errorPatterns  String[] // ["articles", "verb_tense", ...]
  skillScores    Json     // { grammar: number, vocab: number, ... }
  via            String   // "quiz" | "pick"
  completedAt    DateTime @default(now())
  updatedAt      DateTime @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Skill {
  id                  String   @id  // "vocab.foundation.hello.v1"
  level               String   // CEFR
  tags                String[]
  prerequisites       String[]
  estimatedSeconds    Int
  payload             Json     // SkillPayload shape
  authorNote          String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  skillStates SkillState[]
  @@index([level])
  @@index([tags])
}

model SkillState {
  userId        String
  skillId       String
  strength      Float    @default(0)
  lastSeenISO   DateTime?
  nextReviewISO DateTime @default(now())
  timesCorrect  Int      @default(0)
  timesWrong    Int      @default(0)
  easeFactor    Float    @default(2.5)
  intervalDays  Float    @default(0)
  updatedAt     DateTime @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  @@id([userId, skillId])
  @@index([userId, nextReviewISO])
}

model Track {
  id              String  @id   // "track.foundation.core"
  nameVi          String
  descriptionVi   String
  cefrRangeLow    String
  cefrRangeHigh   String
  goal            String
  requiredTags    String[]
  preferredTags   String[]
  estimatedHours  Int
  isPublished     Boolean @default(false)
  createdAt       DateTime @default(now())
}

model StudySession {
  id            String   @id @default(cuid())
  userId        String
  startedAt     DateTime @default(now())
  finishedAt    DateTime?
  durationMs    Int?
  totalSkills   Int
  correctCount  Int      @default(0)
  wrongCount    Int      @default(0)
  attempts      Json     // [{ skillId, correct, elapsedMs, qualityScore }]
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, startedAt])
}

model Streak {
  userId         String   @id
  current        Int      @default(0)
  longest        Int      @default(0)
  lastActiveDate DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// Future: shadowing clips (PR-G)
model ShadowingClip {
  id            String   @id @default(cuid())
  youtubeId     String   @unique
  title         String
  durationSec   Int
  cefrEstimate  String
  topics        String[]
  segments      Json     // [{ start, end, text_en, text_vi }]
  createdAt     DateTime @default(now())
  @@index([cefrEstimate])
}

model ShadowingAttempt {
  id        String   @id @default(cuid())
  userId    String
  clipId    String
  segmentIdx Int
  scoreJson Json     // accent / fluency / similarity scores
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}
```

**Files for PR-E:**
- `apps/web/prisma/schema.prisma`
- `apps/web/prisma/seed.ts` — reads `FOUNDATION_SEED` from `skill-seed-foundation.ts` + `TRACK_TEMPLATES` from `track-templates.ts`, upserts into DB
- `apps/web/lib/prisma.ts` — singleton client (`globalThis.prisma`)
- `apps/web/package.json` — add prisma deps, add scripts `db:push`, `db:seed`, `db:studio`
- `.env.example` — `DATABASE_URL=...`, `DIRECT_URL=...`
- Migration created and committed

**No UI changes in PR-E.** Just `npx prisma db push && npx prisma db seed` works.

### PR-F: Auth — NextAuth.js with Google + Facebook + Email

**Goal:** real user accounts. After login, if user has existing localStorage (`lumalang.placement.v2`, `lumalang.skill-state.v1`), automatically migrate up to DB.

**Stack:**
- **NextAuth.js v5 (Auth.js)** — has the cleanest Next 16 App Router story
- Three providers: Google OAuth, Facebook OAuth, Email (magic link via Resend)
- Prisma adapter

**Env vars needed (`.env.example`):**
```
AUTH_SECRET=<random>
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
AUTH_RESEND_KEY=
EMAIL_FROM=noreply@lumalang.app
```

**Files for PR-F:**
- `apps/web/auth.ts` — NextAuth config, exports `auth`, `handlers`, `signIn`, `signOut`
- `apps/web/app/api/auth/[...nextauth]/route.ts` — `export { GET, POST } from "@/auth/handlers"`
- `apps/web/app/auth/page.tsx` — sign-in screen with 3 buttons (Google + Facebook + email)
- `apps/web/middleware.ts` — protect `/learn` and `/placement` routes
- `apps/web/app/api/profile/route.ts` — GET / POST current user's PlacementProfile
- `apps/web/app/api/skill-state/route.ts` — GET / POST SkillState batches
- `apps/web/app/components/AuthAwareDashboard.tsx` — wrapper that:
  1. On mount, checks if user is signed in
  2. If signed in + has localStorage v2 data, calls `/api/profile` POST to upload, then clears localStorage
  3. From then on, reads from DB via SWR / React Query
- Update `LumaUserDashboard.tsx` to consume profile from server-state, not localStorage

**Migration UX:**
- First time after login, show toast "Đang đồng bộ tiến độ của bạn..." then "Hoàn tất! Lộ trình của bạn đã được lưu vào cloud."

**OAuth app setup is human's job** — document with the exact redirect URIs:
- Google: `https://lumalang.app/api/auth/callback/google`
- Facebook: `https://lumalang.app/api/auth/callback/facebook`
- Localhost: `http://localhost:3000/api/auth/callback/...`

### PR-G: Vocab APIs + Shadowing (YouTube)

**Goal A — server-side vocab:** Stop hitting `dictionaryapi.dev` from the browser; route through our backend so we can cache, add fallbacks, and serve our own vocab seeding script.

**Files:**
- `apps/web/app/api/vocab/[word]/route.ts` — accepts word, looks up cache in Redis (Upstash free), falls back to Free Dictionary API, then to Datamuse, returns structured JSON
- `apps/web/lib/vocab/sources.ts` — adapter pattern, each source returns a normalized shape
  - `freeDictionary.lookup(word)` → existing logic
  - `datamuse.lookup(word)` → fallback for definitions / synonyms
  - `wiktionary.lookup(word)` → deep fallback
- Update `apps/web/app/lib/vocab-api.ts` to call `/api/vocab/{word}` instead of public API

**Goal B — shadowing feature:**

What shadowing is: user picks a short YouTube clip (5-30s segments), listens to one segment, the segment's transcript is shown after, user records themselves, system compares similarity, ranks attempt, repeats.

**Stack for shadowing:**
- **YouTube Data API v3** — search public clips, get metadata. Free quota 10k units/day.
- **YouTube Transcript API** — third-party npm package `youtube-transcript`. Free, no key.
- **Browser MediaRecorder API** for recording user voice (no backend needed for capture).
- **Comparison** — for MVP, use Web Speech API `SpeechRecognition` to transcribe the user's recording, then Levenshtein distance against the original transcript. Real audio-similarity (DTW + MFCC) is for a later premium PR.

**Files for shadowing:**
- `apps/web/app/api/youtube/search/route.ts` — search by query + CEFR level filter. Use `topicId=/m/01k8wb` (Knowledge / Learning) + duration filter (`videoDuration=short`, < 4 min).
- `apps/web/app/api/youtube/transcript/route.ts` — given videoId, returns segmented transcript.
- `apps/web/app/api/shadowing/clips/route.ts` — GET curated shadowing-ready clips from DB
- `apps/web/app/api/shadowing/attempt/route.ts` — POST a single attempt
- `apps/web/app/components/ShadowingView.tsx` — new dashboard tab. Wired into `LumaUserDashboard.tsx` as `activeView === "shadowing"`.
- `apps/web/app/components/ShadowingPlayer.tsx` — segment-by-segment loop with record / play-back / score panel
- `apps/web/app/lib/shadow-score.ts` — Levenshtein-based scoring, returns 0-100 + character-level diff for UI
- Add nav entry for "Luyện shadowing" in the dashboard sidebar

**Curated clips strategy:**
- Pre-curate ~50 clips (English Stories Channel, BBC Learning English, Voice of America Learning) and store in `ShadowingClip` model
- User can also paste their own YouTube URL (but warn: "Có thể không có phụ đề")
- Profanity/inappropriate content filter using `bad-words` npm pkg before persisting transcripts

**Caveats — document clearly for the human:**
- YouTube API quotas are tight. Cache aggressively in Redis.
- Some videos block transcript fetching. Show a friendly "Đoạn này chưa hỗ trợ, thử video khác" message.

### PR-H: Free TTS + audio for listening / pronunciation

**Goal:** every listening + pronunciation ASU has real audio, not browser TTS fallback.

**Three-tier TTS pipeline:**
1. **Browser SpeechSynthesis API** — instant, no cost, lowest quality. Current fallback. Keep as last resort.
2. **Free TTS API** — pick one of:
   - **TTSMaker** (ttsmaker.com) — free 20k chars/day, multiple voices, MP3 download
   - **Voice RSS** — 350 daily requests free
   - **StreamElements TTS** — undocumented but reliable, used by Twitch bots
   - **eSpeak NG** self-hosted — open source, install on server, lower quality but unlimited
3. **ElevenLabs free tier** — 10k chars/month, very high quality. Use for "hero" ASUs (top 100 phrases, top 30 grammar examples).

**Files for PR-H:**
- `apps/web/lib/tts/index.ts` — TTSAdapter interface, three implementations
- `apps/web/app/api/tts/route.ts` — POST `{ text, voice, quality }` → returns MP3 stream or signed URL
- `apps/web/scripts/seed-audio.ts` — script to walk every Skill in DB without `audio_url`, generate via TTS, upload to Supabase Storage / R2 / S3, save URL back to skill payload
- `apps/web/lib/audio-storage.ts` — adapter for Supabase Storage (cheapest); fallback to Cloudflare R2 if Supabase quota hit

**For listening ASUs:** must be conversational, 2-3 turns. Generate with 2 different voices (use voice param) and stitch. Use ffmpeg via wasm or server-side `fluent-ffmpeg`.

**For pronunciation ASUs:** single phrase, slow voice, ideally with phonetic markers spoken.

**Storage decision:** if owner uses Supabase Postgres in PR-E, also use Supabase Storage (1GB free, 1M requests). Else Cloudflare R2 (10GB free, no egress fee).

### PR-I: Content expansion to 300 ASUs

**Goal:** Foundation track has enough content for 2-3 months of daily practice.

Target distribution at the end of this PR:
- 100 vocab (Oxford 3000 A1-A2 subset, filtered for Vietnamese-learner relevance)
- 60 phrase (extend the 20 from PR-B, cover greetings/work/social/transactional)
- 40 grammar (all A1-A2 patterns from Cambridge English Profile)
- 60 listening (real dialogues, dialog-pair structure)
- 20 pronunciation (extended minimal-pairs for Vietnamese speakers)
- 10 reading (short A1-A2 passages from Project Gutenberg + simplified)
- 10 writing (real prompts from foundation contexts)

**Two seed sources are acceptable:**
1. **AI-generated and reviewed by AI** — Claude/GPT-4 prompts to generate ASUs in the exact schema, then validate via `zod` schema check + linguistic plausibility heuristics (target word in example, IPA matches pronunciation, etc).
2. **Curated from public domain** — Cambridge English Profile word lists (free), Oxford 3000 (free), VOA Learning English transcripts (public domain).

**File:**
- `apps/web/scripts/generate-asus.ts` — runs against an LLM, produces JSON, validates, writes to `apps/web/prisma/seed-data/foundation-extended.json`
- Update `apps/web/prisma/seed.ts` to consume both `FOUNDATION_SEED` (the hand-coded 80) + `foundation-extended.json` (the generated 220)

**Quality bar — every ASU must:**
- Pass `zod` validation against `SkillPayload`
- Have `definition_vi` written in natural Vietnamese (no Google-Translate stiffness)
- For grammar, include `common_mistakes_vi` specific to Vietnamese speakers
- Have IPA correct (use `npm i ipa-translate` for validation)
- Audio generated and uploaded (done in PR-H or rerun)

### PR-J: Deployment + monitoring

**Goal:** production deployment with telemetry.

**Stack:**
- **Vercel** for Next.js (free tier OK for MVP, ~100k requests/month)
- **Neon Postgres** (or Supabase) — already set up in PR-E
- **Upstash Redis** for vocab cache (free 10k requests/day)
- **Sentry** for error tracking (free 5k events/month)
- **Vercel Analytics** for traffic (free tier)
- **PostHog** for product analytics — free 1M events/month, very generous

**Files for PR-J:**
- `vercel.json` — build config, env list, redirects (e.g. `/` → `/learn` if signed in)
- `apps/web/instrumentation.ts` — Sentry init for Next 16
- `apps/web/app/api/telemetry/route.ts` — receive attempt events → PostHog
- `apps/web/app/layout.tsx` — add `<Analytics />` (Vercel) + PostHog script
- `apps/web/lib/telemetry.ts` — wraps `posthog.capture()` so we have one event taxonomy:
  - `placement_started`, `placement_completed`, `placement_stage_X_picked`
  - `session_started`, `session_completed`, `session_abandoned`
  - `skill_attempted` (skillId, type, correct, elapsedMs, fromQueue)
  - `auth_signed_in` (provider)
  - `shadowing_attempt`
  - etc.
- `ops/runbook.md` — what to do when DB is full / Vercel hits limit / Sentry alerts fire
- Update `README.md` with the live URL + status badges

**Domain:** the human owns or should buy `lumalang.app` (or whatever short brand). Vercel handles the SSL.

**Migration of existing localStorage users:**
- On first login after deployment, the AuthAwareDashboard from PR-F handles the migration. No manual steps needed.

---

## Section 5 — Coding conventions (every AI MUST follow)

These are NON-NEGOTIABLE because they caused real bugs when ignored.

1. **Vietnamese-first.** All user-facing text in Vietnamese. Comments in code can be English. The owner speaks Vietnamese (casual "bạn / tôi"). Reply to them in Vietnamese.
2. **Inter font only.** No serif, no italic. Use `<span className="ll-accent">` for highlight, not `<em>` (italic disabled globally).
3. **Class names prefixed.** `.ll-*` for app, `.pv2-*` for placement v2. Never invent new prefixes.
4. **No `style jsx` in NEW components.** Use `globals.css` for global styles or CSS modules. Existing components have `<style jsx>`; don't refactor unless you're already in that file for a real reason.
5. **`activeView` pattern in dashboard.** When adding a new tab, edit `LumaUserDashboard.tsx` to add a block `{activeView === "newview" ? <NewView /> : null}` and a sidebar entry. Don't try to split the file.
6. **Run BOTH after changes:**
   ```bash
   cd apps/web && rm -f tsconfig.tsbuildinfo
   npx tsc --noEmit                              # type check
   cd /home/claude/webtienganh
   npm run build --workspace=@language-platform/web   # production build
   ```
   Production build can fail when tsc passes (Next compilation differs). Always run both.
7. **One PR = one branch = one squash commit on main.** Branch name `feat/...` or `fix/...`. Push branch, then `git checkout main && git merge --no-ff <branch>`, push main, delete branch.
8. **No commented-out code.** Delete or leave a `// TODO(<short>): ...` with what's missing.
9. **Commit messages are long-form.** Title `feat(area): one-liner`. Body explains WHY, WHAT changed, WHAT didn't change, HOW verified. The owner reads commits as the changelog.
10. **No emojis in code.** Emojis are fine in user-facing text and commit message titles (`📐 Ngữ pháp`). Not inside `name`, `id`, etc.
11. **Don't add new localStorage keys after PR-E ships.** State lives in DB.
12. **Always check ASU payload field names** (see Section 1 — `phrase_en` not `text_en`, etc). Bugs from this caused a full PR-D rewrite of `SkillCard.tsx`.

---

## Section 6 — File map (the 30-second tour)

```
apps/web/
├── app/
│   ├── layout.tsx                  # root, font, providers
│   ├── globals.css                 # 14,341 lines — ALL styles
│   ├── page.tsx                    # marketing landing (GSAP-heavy)
│   ├── auth/                       # PR-F adds sign-in UI here
│   ├── placement/
│   │   ├── page.tsx                # stage machine
│   │   ├── _components/            # 7 stage screens + plain CSS file
│   │   └── _lib/types.ts           # all placement enums
│   ├── learn/
│   │   └── page.tsx                # → <LumaUserDashboard />
│   ├── components/
│   │   ├── LumaUserDashboard.tsx   # 3,072 lines — 9 views, the big one
│   │   ├── CoursesViewV2.tsx       # NEW from PR-D
│   │   ├── LearnPathHero.tsx       # NEW from PR-D
│   │   ├── SessionPlayer.tsx       # NEW from PR-D
│   │   ├── SkillCard.tsx           # NEW from PR-D, branches on payload.type
│   │   ├── CoursePathGrid.tsx      # OLD — still used by 8 other views, do not delete
│   │   ├── GroupsView.tsx          # mock UI for groups
│   │   └── ... (other view components)
│   ├── api/                        # PR-F onwards adds routes here
│   └── lib/
│       ├── skill-units.ts          # ASU types + helpers (PR-B)
│       ├── skill-seed-foundation.ts # 80 hand-coded ASUs (PR-B)
│       ├── vocab-api.ts            # Free Dictionary client (PR-B)
│       ├── recommend-engine.ts     # recommender (PR-C)
│       ├── user-skill-state.ts     # SM-2 + localStorage (PR-C)
│       ├── track-templates.ts      # 4 TrackTemplate seeds (PR-D)
│       ├── learning-core.ts        # legacy (Goal, generators) — still in use
│       ├── product-data.ts         # legacy 13 defaultCourses — still imported by 8 views
│       └── group-data.ts           # legacy mock groups
├── prisma/                          # PR-E onwards
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed-data/                   # PR-I extended seed JSON
├── lib/                             # PR-E onwards, ts files outside app/ dir
│   ├── prisma.ts                    # singleton
│   ├── audio-storage.ts             # PR-H
│   └── tts/                         # PR-H
├── public/                          # static assets
└── package.json
```

---

## Section 7 — How the owner works with AI (read carefully)

The owner is the product person, not a developer who wants to read every diff. They:

- Communicate in Vietnamese, casual register ("bạn / tôi")
- Prefer: "do all the work end-to-end and merge, I'll pull and test"
- Hate: ping-pong of small confirmations ("should I do X?" → "yes" → "OK done, now should I do Y?")
- Will send screenshots when something looks wrong. Fix on the same branch before merging.
- Have asked explicitly: "Tôi nghĩ bạn nên làm hết tất cả cho tôi luôn vì antigravity không được thông minh như bạn tôi cần bạn làm hoàn chỉnh rồi bổ sung merge vào để antigavity làm hoàn chỉnh." (Quote, 2026-05-25.)
- Owner email for git: `thaibaoleo123@gmail.com`. User name `hadessispro`. The repo's `git remote -v` already has a PAT embedded; just `git push`.

**When in doubt, choose the "stable / safe" path.** The owner has said multiple times: "bạn lựa chọn ổn định nhất cho tôi" (you choose the most stable path for me).

**When you finish a PR:**
1. Verify `tsc --noEmit` clean
2. Verify `npm run build` clean
3. Commit with a long, structured message (look at commits `d857b1f`, `e60a224` for examples)
4. Push the feature branch
5. Merge to main with `--no-ff`
6. Push main
7. Delete the feature branch locally and remote
8. In the chat, summarize: what shipped, how to pull, what to test, what's deferred. **Always in Vietnamese.**

---

## Section 8 — Things that look weird but are intentional

When you grep around, you'll find these. Do not "fix" them unless explicitly asked:

1. **`defaultCourses` is still imported in `LumaUserDashboard.tsx`** but not rendered in the Khóa học tab anymore. The other 8 views (home/practice/groups/profile/...) still depend on it. Removing requires refactoring all 8 — a separate sprint.
2. **Two placement localStorage keys** (`lumalang:placement` v1 and `lumalang.placement.v2`). Both written on completion. Removing v1 will break the old views that haven't migrated.
3. **`CoursePathGrid.tsx`** is dead code as of PR-D but kept (other views might import it). Delete when its last reference is gone.
4. **`globals.css` is 14,341 lines.** Splitting into per-component CSS modules is a multi-week refactor; not in scope right now.
5. **`<style jsx>` blocks in the 4 legacy placement screens** (`splash`, `level-picker`, `quiz-slider`, `result-screen`) — works fine, don't migrate to plain CSS unless touching the file for a real reason.
6. **`apps/web/app/placement/_components/placement-v2.css` is plain global CSS, not a module.** Intentional (Turbopack module quirks during the PR-A rebuild). Don't convert.
7. **The `Account`/`Session`/`VerificationToken` Prisma models are exactly the NextAuth.js schema.** Don't customize them.
8. **`pnpm` workspace structure has only `apps/web`.** No `packages/` directory. Don't add one unless you're sure you need shared code.

---

## Section 9 — Verification checklist for the next AI

Before claiming a PR is "done", verify:

- [ ] `cd apps/web && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` → 0 errors
- [ ] `npm run build --workspace=@language-platform/web` → builds successfully
- [ ] If PR added a UI: run `npm run dev`, manually click through the new feature, screenshot
- [ ] If PR added an API route: `curl` the route, check shape
- [ ] If PR touched DB: `npx prisma db push` clean, `npx prisma db seed` clean
- [ ] If PR added env vars: `.env.example` updated
- [ ] Commit message contains: Why, What changed, What didn't, How verified
- [ ] Merged to main, branch deleted (local + remote)
- [ ] Owner messaged with: "Đã merge. Pull về test: ..." plus exact bash commands

---

## Section 10 — Quick reference: useful bash snippets

```bash
# Fresh start
cd /home/claude/webtienganh
git checkout main && git pull

# Type check + build
cd apps/web && rm -f tsconfig.tsbuildinfo
npx tsc --noEmit
cd /home/claude/webtienganh
npm run build --workspace=@language-platform/web

# Dev server
npm run dev --workspace=@language-platform/web
# → http://localhost:3000

# Standard PR flow
git checkout -b feat/whatever
# ... do work ...
git add -A
git commit -m "feat(area): one-liner

Body...
"
git push origin feat/whatever
git checkout main
git merge feat/whatever --no-ff -m "feat(area): one-liner"
git push origin main
git branch -D feat/whatever
git push origin --delete feat/whatever

# Prisma after PR-E
cd apps/web
npx prisma generate
npx prisma db push        # for dev
npx prisma migrate dev    # for prod-track migrations
npx prisma db seed
npx prisma studio         # GUI

# Check what's on main vs your branch
git log main..HEAD --oneline
git diff main --stat
```

---

## Closing word for the next AI

The personalization arc (PR-A → PR-D) is done. The owner has trust in completing big chunks of work end-to-end. They want a deployed MVP, not a sandbox. Be ambitious in scope, conservative in technique. When you ship PR-J, this is a real product.

If you find anything in this document that is wrong, **update it in the same PR that proves it wrong**. This doc is the source of truth for next-AI context.

Good luck.
