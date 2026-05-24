# Codex — Quick PR Checklist

> Short-form companion to `antigravity.md`. Read that first if you're a fresh AI session.
> Last update: 2026-05-25 (after PR-A → PR-D merged).

---

## What you absolutely must know before touching this repo

1. **Read `antigravity.md` first.** It explains ASU, the data model, the upcoming PR-E → PR-J sprint, and the owner's working style. Do not skip it.
2. **Vietnamese-first.** All UI text in Vietnamese. Talk to the owner in Vietnamese (casual "bạn / tôi").
3. **`localStorage` is temporary.** Don't add new keys. PR-E migrates everything to Postgres.
4. **One PR per feature, merged to `main` with `--no-ff`.** Branch, push, merge, push, delete branch.
5. **ASU field names trap.** `phrase_en` not `text_en`, `pronunciation_ipa` not `ipa`, `question_vi` not `question`, `target_text_en` not `target_pattern`. See antigravity.md Section 1 for full list. `tsc --noEmit` catches mismatches.

---

## What's on main right now (most recent first)

| Commit | PR | Summary |
|---|---|---|
| `522488d` | PR-D | UI rebuild — 3-zone Courses tab + SkillCard + SessionPlayer |
| `e60a224` | PR-C | Recommendation engine — SM-2 + weighted scoring |
| `d857b1f` | PR-B | ASU data layer + Free Dictionary API + 80 foundation seed |
| `d72a51b` | PR-A.1 | CSS fix for placement v2 |
| `38eaa99` | PR-A | Placement v2 multi-stage flow |

The personalization arc is DONE. Everything works on localhost using localStorage.

---

## What to do next (in this exact order)

| PR | Branch | Goal | Hours est. |
|---|---|---|---|
| **PR-E** | `feat/db-prisma-neon` | Prisma + Postgres schema, seed script, no UI change | 4-5 |
| **PR-F** | `feat/auth-nextauth-v5` | NextAuth Google/FB/Email + localStorage→DB migration | 6-8 |
| **PR-G** | `feat/vocab-shadowing` | Server-side vocab API + Shadowing (YouTube) feature | 8-10 |
| **PR-H** | `feat/tts-audio-pipeline` | Free TTS + listening/pronunciation audio seeding | 4-6 |
| **PR-I** | `feat/content-expand-300` | Seed 220 more ASUs to reach 300 foundation total | 6-8 |
| **PR-J** | `feat/deploy-vercel-mvp` | Vercel deploy + Sentry + PostHog telemetry | 3-4 |

Full specs (file lists, env vars, API shapes, third-party services) in `antigravity.md` Section 4.

---

## Pre-flight checklist for every PR

Before you write any code:

- [ ] You've read `antigravity.md` sections 0 (TL;DR), 1 (ASU), and the section for your PR in 4.
- [ ] You know which branch you're on (`git branch`).
- [ ] You've pulled latest (`git pull origin main`).
- [ ] You know what files this PR touches and they don't conflict with anything else in flight.

Before you commit:

- [ ] `cd apps/web && rm -f tsconfig.tsbuildinfo && npx tsc --noEmit` → 0 errors.
- [ ] `npm run build --workspace=@language-platform/web` → builds successfully.
- [ ] If UI: ran `npm run dev`, clicked through the new feature manually.
- [ ] If DB: `npx prisma db push && npx prisma db seed` clean (PR-E onwards).
- [ ] `.env.example` updated if you added env vars.
- [ ] Commit message has body (Why / What / Didn't change / Verified).

Before you tell the owner you're done:

- [ ] Merged to main with `--no-ff`, pushed.
- [ ] Feature branch deleted local + remote.
- [ ] You messaged the owner in Vietnamese with: shipped what, pull commands, test checklist, what's deferred.

---

## Common mistakes future AI will make (don't be future AI)

1. **Refactoring `LumaUserDashboard.tsx` because it's 3,072 lines.** It's intentional. Edit the `activeView === "..."` block you need; leave the rest alone.
2. **Splitting `globals.css` into modules.** Don't. ~14k lines is fine for now. Append to it.
3. **Deleting `defaultCourses` or `CoursePathGrid.tsx`.** Don't. 8 dashboard views still import them. A separate refactor PR removes them all together.
4. **Calling `dictionaryapi.dev` directly from a Client Component.** After PR-G ships, the only client-side caller is `lib/vocab-api.ts`, and that calls our own `/api/vocab/{word}` proxy. Never call third-party APIs from client code in production.
5. **Adding new localStorage keys after PR-E.** State goes in Postgres via Prisma. localStorage is read-only cache at that point.
6. **Mismatching ASU payload field names.** Check `apps/web/app/lib/skill-units.ts` for the canonical schema. `npx tsc --noEmit` will catch but it's faster to copy the discriminated union from antigravity.md Section 1.
7. **`<em>` for emphasis.** Italic is disabled globally (Inter only). Use `<span className="ll-accent">` instead.
8. **Forgetting both type-check AND build.** They give different errors. Always run both before committing.
9. **Asking the owner small confirmations.** They've explicitly said: just do it end-to-end. Ask only for top-level scope decisions ("which auth providers do you want?").
10. **English in UI strings.** Vietnamese-first. Always.

---

## How to talk to the owner

- Casual Vietnamese ("bạn / tôi"), not formal ("anh / chị").
- Be direct. They appreciate brevity over politeness.
- When you ship, say: "Đã merge PR-X vào main. Bạn pull về test: ..." then bash commands.
- When you screw up, own it: "Tôi nhầm chỗ X, fix luôn rồi." Not: "I apologize for the confusion."
- If you need a decision, give 2-3 options with your recommendation, not 5 with no opinion.

---

## Last sanity check

If you've finished a PR and are about to message the owner, ask yourself:

> Could the owner pull `main`, run `npm install && npm run dev`, and the new feature works without them needing to read any code?

If no — your PR isn't done. Go back and finish it.
