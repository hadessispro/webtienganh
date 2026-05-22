"use client";

/**
 * LandingCta
 *
 * The one and only CTA button for the landing page.
 *
 * Design (after debugging round 2 — 2026-05-23):
 *  - Hover, fill, and color invert are PURE CSS using a ::before
 *    pseudo-element on .ll-cta. This is the bulletproof base layer
 *    that works regardless of JS state.
 *  - GSAP (via the useEffect in page.tsx) only writes two CSS vars
 *    (--cta-fx, --cta-fy) so the fill origin tracks the cursor.
 *    With JS off, the fill defaults to center — still looks fine.
 *  - The previous attempt at a "magnetic" drift effect on the <a>
 *    link itself made the button feel laggy and (in some browsers)
 *    swallowed clicks. That's gone.
 *  - The fill is a CSS pseudo-element, not a <span>. That means one
 *    fewer DOM node and zero chance of an overlapping child stealing
 *    clicks.
 *
 * Variants:
 *   primary  — solid green gradient pill, dark text. Used for the
 *              hero "Học thử miễn phí" (with arrow) and the final
 *              "Vào học ngay".
 *   outline  — transparent + green border + green text. (Currently
 *              kept available though primary is more common.)
 *   ghost    — transparent + subtle white border. Used for the
 *              header CTA and the 3 feature-row CTAs.
 *
 * Sizes:
 *   sm — header
 *   md — feature rows
 *   lg — hero + final
 */

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = {
  /**
   * Internal route. Next.js typed-routes is enabled so passing a
   * literal will be checked against the routes tree at build time.
   */
  href: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  style?: CSSProperties;
  /** Optional trailing icon, e.g. an arrow */
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
      // Cast through unknown so the typed-routes generic doesn't
      // reject a generic `string` prop coming through this component.
      href={href as unknown as React.ComponentProps<typeof Link>["href"]}
      className={`ll-cta ll-cta--${variant} ll-cta--${size} ${className}`.trim()}
      style={style}
    >
      {/* Shimmer sits above the fill (which is a CSS ::before) but
          below the text. It's a wrapper for the actual sweep gradient
          rendered by ::after; needed because we can't easily animate
          a single ::before AND ::after on the same root. */}
      <span className="ll-cta-shimmer" aria-hidden="true" />
      <span className="ll-cta-text">
        {children}
        {trailingIcon && <span className="ll-cta-icon">{trailingIcon}</span>}
      </span>
    </Link>
  );
}
