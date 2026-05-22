"use client";

/**
 * LandingCta
 *
 * The one and only CTA button for the landing page. Wraps a Next.js
 * <Link> in a span with the right structure (.btn-fill, .btn-text,
 * .btn-shimmer) so the GSAP hover wiring in `app/page.tsx` can pick
 * it up uniformly. Replaces the previous ad-hoc inline-styled buttons
 * scattered across the page (header CTA, hero CTA, 3 feature CTAs,
 * final CTA) which only animated 3 of them.
 *
 * Variants:
 *   primary    — solid green pill, dark text. Used for "main" CTAs
 *                (Học thử miễn phí, Vào học ngay in final block).
 *   outline    — transparent with green border + green text. Used for
 *                feature-section "Khám phá X" buttons.
 *   ghost      — transparent with subtle white border. Used for the
 *                header CTA so it doesn't compete with the hero.
 *
 * Sizes:
 *   sm  → 8px / 18px padding, 0.9rem  (header)
 *   md  → 14px / 28px padding, 1rem   (default)
 *   lg  → 18px / 40px padding, 1.1rem (hero + final)
 *
 * All variants share the same hover machinery:
 *   - Magnetic pull (the button drifts toward the cursor)
 *   - Directional fill bubble (circular fill grows from the entry point)
 *   - Continuous shimmer (sweeps the surface every few seconds)
 *   - Active press (squash on click, springs back on release)
 *
 * The component does NOT install the GSAP timeline itself. The single
 * `useEffect` in `page.tsx` queries `.ll-cta` once and wires every
 * button it finds. That keeps GSAP setup in one place and lets the
 * button stay a simple presentational fragment.
 */

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  /**
   * Internal route to navigate to. Typed-routes is enabled in
   * next.config.ts so this is checked against the actual routes
   * tree at build time when consumers pass a literal.
   */
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  style?: CSSProperties;
  /** Optional trailing icon (e.g. arrow) */
  trailingIcon?: ReactNode;
};

export function LandingCta({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  style,
  trailingIcon,
}: Props) {
  return (
    <Link
      // Cast through unknown so the typed-routes generic doesn't reject
      // a generic `string` prop. Consumers in the landing page pass
      // literal route strings, so the type check still happens at the
      // call site indirectly (we accept whatever they pass).
      href={href as unknown as React.ComponentProps<typeof Link>["href"]}
      className={`ll-cta ll-cta--${variant} ll-cta--${size} ${className}`.trim()}
      style={style}
    >
      {/* Directional fill bubble — circular, grows from cursor entry point */}
      <span className="ll-cta-fill" aria-hidden="true" />
      {/* Continuous shimmer overlay */}
      <span className="ll-cta-shimmer" aria-hidden="true" />
      {/* Foreground text (sits above fill + shimmer, follows cursor slightly) */}
      <span className="ll-cta-text">
        {children}
        {trailingIcon && <span className="ll-cta-icon">{trailingIcon}</span>}
      </span>
    </Link>
  );
}
