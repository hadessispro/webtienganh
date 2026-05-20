# Codex Review Notes

## Scope

This change restores the learner dashboard at `/learn` while keeping the placement flow available as the entry assessment experience. It also keeps the placement UI regression fixes found after the latest GitHub update.

## What Changed

- Restored `/learn` to render the learner dashboard (`LumaUserDashboard`).
- Removed the mini-placement gate and the "Đánh giá trình độ" action from the learner dashboard so `/learn` opens directly into study mode.
- Updated site navigation, landing CTAs, auth redirect, admin rail link, and placement result CTA to send learners back to `/learn`.
- Replaced the placement splash inline placeholder mark with the existing project logo at `/images/lumalang-logo.png`.
- Fixed placement layout centering by converting placement component styles to scoped global selectors. This is needed because Framer Motion wrapper elements were not receiving the original `styled-jsx` scoped selectors reliably.
- Added compact placement picker breakpoints for short or narrow viewports, including the DevTools-sized viewport where the header and CTA previously clipped.
- Updated `package-lock.json` after installing dependencies required by the pulled placement code (`framer-motion`, `gsap`).

## Files To Review

- `apps/web/app/learn/page.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/auth/page.tsx`
- `apps/web/app/components/AppHeader.tsx`
- `apps/web/app/components/StaticSitePage.tsx`
- `apps/web/app/components/AuthStudio.tsx`
- `apps/web/app/components/LumaUserDashboard.tsx`
- `apps/web/app/components/AdminDashboard.tsx`
- `apps/web/app/components/CursorEffect.tsx`
- `apps/web/app/placement/_components/splash-screen.tsx`
- `apps/web/app/placement/_components/level-picker.tsx`
- `apps/web/app/placement/_components/quiz-slider.tsx`
- `apps/web/app/placement/_components/result-screen.tsx`
- `package-lock.json`

## Review Focus For Claude

- Check that the new global placement selectors remain safely limited to placement-specific class names.
- Confirm `/learn` remains the learner dashboard and `/placement` remains the assessment flow.
- Confirm the placement picker remains centered at wide desktop sizes and still fits at short DevTools-like viewport heights.
- Confirm the logo path is correct for the Next.js app public directory.
- Confirm the lockfile dependency changes match the existing workspace dependency intent.

## Verification

- `npm run build` passes.
- Admin dashboard smoke test passes at `/admin`: page renders, the rail exposes a single `User` link, that link points to `/learn`, and the browser console has no errors.
- Learner dashboard smoke test passes at `/learn`: page renders the dashboard directly, without the mini-placement/test trình độ screen.
- Layout measured at `570x553`: picker header, droplet grid, and CTA are centered and visible.
- Layout measured at `1919x820`: picker header, droplet grid, and CTA are centered on the page.
