# Codex Review Notes

## Scope

This change makes the placement flow the primary entry point and fixes the placement UI regression found after the latest GitHub update.

## What Changed

- Redirected `/learn` to `/placement` so the old learn dashboard is no longer the main entry.
- Updated site navigation, landing CTAs, auth redirect, and dashboard rail links to point to `/placement`.
- Replaced the placement splash inline placeholder mark with the existing project logo at `/images/lumalang-logo.png`.
- Fixed placement layout centering by converting placement component styles to scoped global selectors. This is needed because Framer Motion wrapper elements were not receiving the original `styled-jsx` scoped selectors reliably.
- Added compact placement picker breakpoints for short or narrow viewports, including the DevTools-sized viewport where the header and CTA previously clipped.
- Updated the placement result CTA to return to `/placement`.
- Updated `package-lock.json` after installing dependencies required by the pulled placement code (`framer-motion`, `gsap`).

## Files To Review

- `apps/web/app/learn/page.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/auth/page.tsx`
- `apps/web/app/components/AppHeader.tsx`
- `apps/web/app/components/StaticSitePage.tsx`
- `apps/web/app/components/AuthStudio.tsx`
- `apps/web/app/components/AdminDashboard.tsx`
- `apps/web/app/components/CursorEffect.tsx`
- `apps/web/app/placement/_components/splash-screen.tsx`
- `apps/web/app/placement/_components/level-picker.tsx`
- `apps/web/app/placement/_components/quiz-slider.tsx`
- `apps/web/app/placement/_components/result-screen.tsx`
- `package-lock.json`

## Review Focus For Claude

- Check that the new global placement selectors remain safely limited to placement-specific class names.
- Confirm the `/learn` redirect is the desired behavior now that `/placement` is the main flow.
- Confirm the placement picker remains centered at wide desktop sizes and still fits at short DevTools-like viewport heights.
- Confirm the logo path is correct for the Next.js app public directory.
- Confirm the lockfile dependency changes match the existing workspace dependency intent.

## Verification

- `npm run build` passes.
- Admin dashboard smoke test passes at `/admin`: page renders, the rail exposes a single `Placement` link, that link points to `/placement`, and the browser console has no errors.
- Layout measured at `570x553`: picker header, droplet grid, and CTA are centered and visible.
- Layout measured at `1919x820`: picker header, droplet grid, and CTA are centered on the page.
