"use client";

/**
 * /learn page entry.
 *
 * We use `useEffect` + `mounted` state to delay rendering the actual
 * dashboard until AFTER hydration. This is a defensive workaround
 * for two issues we've seen on this route:
 *
 * 1. Browser translator extensions (Microsoft Translator, Google
 *    Translate) inject classes like `translate-tooltip-mtz` into the
 *    DOM between server render and client hydration → React throws
 *    "Hydration failed because server HTML didn't match client".
 *
 * 2. Some users have Grammarly / Honey / other extensions that
 *    inject inline scripts and modify attributes mid-hydration.
 *
 * `suppressHydrationWarning` on <html>/<body> handles attribute-level
 * mismatches, but only at those two nodes. Anywhere DEEPER in the
 * tree the mismatch still triggers the dev overlay. By skipping
 * server render entirely for the dashboard, there's nothing to
 * mismatch against — the dashboard mounts client-only.
 *
 * Trade-off: a tiny flash of empty page on first load before the
 * dashboard mounts. Acceptable for an authenticated dashboard route.
 */

import { useEffect, useState } from "react";
import { AuthAwareDashboard } from "../components/AuthAwareDashboard";

export default function LearnPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="page-shell theme-light workspace-page">
      {mounted ? <AuthAwareDashboard /> : null}
    </main>
  );
}
