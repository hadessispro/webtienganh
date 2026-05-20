"use client";

/**
 * Path: apps/web/app/placement/_components/level-picker.tsx
 *
 * 6 giot nuoc CEFR (A1..C2) + 1 CTA "Lam test nhanh".
 * - GSAP cho idle float + entrance stagger
 * - SVG blob organic, KHONG circle cung
 * - Hover: scale + shimmer
 * - Click: drop falls + particles + handoff
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CEFR_ORDER, CEFR_LABELS } from "../_lib/types";
import type { CEFRLevel } from "../_lib/types";

interface Props {
  onPickLevel: (level: CEFRLevel) => void;
  onStartTest: () => void;
}

const DROP_GRADIENTS: Record<CEFRLevel, [string, string]> = {
  A1: ["#a8ffcc", "#5cffa3"],
  A2: ["#8effd0", "#48e8a8"],
  B1: ["#6cf2c8", "#3acfae"],
  B2: ["#54d4b4", "#2bb59b"],
  C1: ["#3fb89b", "#1f9785"],
  C2: ["#2a9c87", "#0d7c6c"],
};

export default function LevelPicker({ onPickLevel, onStartTest }: Props) {
  const dropsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);
  const [gsapReady, setGsapReady] = useState(false);

  // Dynamic import GSAP (it's already in package.json deps)
  useEffect(() => {
    let cancelled = false;
    let tweens: any[] = [];

    (async () => {
      try {
        const gsap = (await import("gsap")).default;
        if (cancelled) return;
        setGsapReady(true);

        // Entrance: bubble up + scale in, staggered
        gsap.fromTo(
          dropsRef.current.filter(Boolean),
          { y: 60, scale: 0.4, opacity: 0 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 1.0,
            ease: "elastic.out(1, 0.6)",
            stagger: 0.08,
            delay: 0.1,
          }
        );

        // Idle float: each drop bobs up/down with own phase
        dropsRef.current.forEach((el, i) => {
          if (!el) return;
          const t = gsap.to(el, {
            y: "-=10",
            duration: 1.8 + (i % 3) * 0.3,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: 1.0 + i * 0.15,
          });
          tweens.push(t);
        });
      } catch (e) {
        // GSAP not available - fallback to CSS-only (still visible)
        console.warn("[placement] GSAP not loaded, using CSS fallback", e);
      }
    })();

    return () => {
      cancelled = true;
      tweens.forEach((t) => t?.kill?.());
    };
  }, []);

  const handleDropClick = async (level: CEFRLevel, idx: number) => {
    if (pickedIdx !== null) return;
    setPickedIdx(idx);

    const el = dropsRef.current[idx];
    if (el && gsapReady) {
      try {
        const gsap = (await import("gsap")).default;
        gsap.killTweensOf(el);
        gsap.to(el, {
          scale: 1.15,
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(el, {
              scale: 0.6,
              y: 200,
              opacity: 0,
              rotate: 8,
              duration: 0.55,
              ease: "power3.in",
              onComplete: () => onPickLevel(level),
            });
          },
        });
        return;
      } catch (e) {
        // fall through to non-GSAP
      }
    }
    // Fallback: just commit
    setTimeout(() => onPickLevel(level), 400);
  };

  return (
    <motion.div
      className="picker-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="picker-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.05 }}
      >
        <p className="picker-eyebrow">Bước 1 · Trình độ</p>
        <h2 className="picker-title">Bạn đang ở đâu trong tiếng Anh?</h2>
        <p className="picker-sub">
          Chọn nhanh giọt nước đúng trình độ. Không chắc? Làm test 5 câu adaptive bên dưới.
        </p>
      </motion.div>

      <div className="drops-grid">
        {CEFR_ORDER.map((level, idx) => {
          const [c1, c2] = DROP_GRADIENTS[level];
          return (
            <button
              key={level}
              ref={(el) => {
                dropsRef.current[idx] = el;
              }}
              className="drop"
              onClick={() => handleDropClick(level, idx)}
              aria-label={`Chọn trình độ ${level} - ${CEFR_LABELS[level].vi}`}
              disabled={pickedIdx !== null}
              style={{ opacity: gsapReady ? undefined : 1 }}
            >
              <svg
                className="drop-svg"
                viewBox="0 0 120 140"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id={`g-${level}`} x1="20%" y1="0%" x2="80%" y2="100%">
                    <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={c2} stopOpacity="0.95" />
                  </linearGradient>
                  <radialGradient id={`shine-${level}`} cx="35%" cy="30%" r="40%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>
                  <filter id={`glow-${level}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" />
                  </filter>
                </defs>
                {/* outer glow */}
                <path
                  d="M60 10 C 88 38, 108 70, 108 96 C 108 122, 86 134, 60 134 C 34 134, 12 122, 12 96 C 12 70, 32 38, 60 10 Z"
                  fill={c1}
                  filter={`url(#glow-${level})`}
                  opacity="0.45"
                />
                {/* drop body */}
                <path
                  d="M60 10 C 88 38, 108 70, 108 96 C 108 122, 86 134, 60 134 C 34 134, 12 122, 12 96 C 12 70, 32 38, 60 10 Z"
                  fill={`url(#g-${level})`}
                />
                {/* shine highlight */}
                <ellipse cx="44" cy="62" rx="22" ry="32" fill={`url(#shine-${level})`} />
                {/* tiny sparkle */}
                <circle cx="38" cy="50" r="2.5" fill="#ffffff" opacity="0.9" />
                <circle cx="32" cy="78" r="1.5" fill="#ffffff" opacity="0.7" />
              </svg>
              <div className="drop-label">
                <span className="drop-level">{level}</span>
                <span className="drop-desc">{CEFR_LABELS[level].vi}</span>
              </div>
            </button>
          );
        })}
      </div>

      <motion.div
        className="picker-cta-wrap"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <p className="picker-cta-hint">Không chắc trình độ?</p>
        <button
          className="picker-cta"
          onClick={onStartTest}
          disabled={pickedIdx !== null}
        >
          <span>Làm test 5 câu</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </motion.div>

      <style jsx global>{`
        .picker-wrap {
          position: absolute;
          inset: 0;
          width: 100%;
          min-height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          gap: 38px;
          text-align: center;
        }

        .picker-header {
          text-align: center;
          max-width: 560px;
        }

        .picker-eyebrow {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: #5cffa3;
          margin: 0 0 14px 0;
        }

        .picker-title {
          font-size: 36px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: #f0fff5;
          margin: 0 0 12px 0;
        }

        .picker-sub {
          font-size: 14px;
          line-height: 1.55;
          color: rgba(240, 255, 245, 0.65);
          margin: 0;
        }

        .drops-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(96px, 1fr));
          gap: 18px;
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
          justify-items: center;
        }

        .drop {
          appearance: none;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-self: center;
          gap: 8px;
          transition: filter 200ms ease;
          will-change: transform;
        }

        .drop:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .drop:disabled {
          cursor: default;
        }

        .drop-svg {
          width: 96px;
          height: 112px;
          transition: transform 240ms ease;
        }

        .drop:hover:not(:disabled) .drop-svg {
          transform: scale(1.06);
        }

        .drop-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 100%;
          text-align: center;
        }

        .drop-level {
          font-size: 17px;
          font-weight: 600;
          color: #f0fff5;
          letter-spacing: -0.01em;
        }

        .drop-desc {
          font-size: 11px;
          font-weight: 400;
          color: rgba(240, 255, 245, 0.55);
          letter-spacing: 0.04em;
        }

        .picker-cta-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .picker-cta-hint {
          font-size: 12px;
          letter-spacing: 0.1em;
          color: rgba(240, 255, 245, 0.5);
          margin: 0;
          text-transform: uppercase;
        }

        .picker-cta {
          appearance: none;
          background: rgba(92, 255, 163, 0.12);
          border: 1px solid rgba(92, 255, 163, 0.35);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          color: #f0fff5;
          padding: 14px 28px;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.01em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: all 220ms ease;
          box-shadow: 0 8px 24px rgba(92, 255, 163, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .picker-cta:hover:not(:disabled) {
          background: rgba(92, 255, 163, 0.2);
          border-color: rgba(92, 255, 163, 0.55);
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(92, 255, 163, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        .picker-cta:disabled {
          opacity: 0.4;
          cursor: default;
        }

        @media (max-width: 720px), (max-height: 640px) {
          .picker-wrap {
            padding: 24px 18px;
            gap: 22px;
          }

          .picker-header {
            max-width: 520px;
          }

          .picker-eyebrow {
            font-size: 10px;
            margin-bottom: 10px;
          }

          .picker-title {
            font-size: 28px;
            margin-bottom: 8px;
          }

          .picker-sub {
            font-size: 13px;
          }

          .drops-grid {
            grid-template-columns: repeat(3, minmax(76px, 1fr));
            max-width: 330px;
            gap: 12px 16px;
          }

          .drop {
            gap: 6px;
          }

          .drop-svg {
            width: 72px;
            height: 84px;
          }

          .drop-level {
            font-size: 15px;
          }

          .drop-desc {
            font-size: 10px;
          }

          .picker-cta-wrap {
            gap: 8px;
          }

          .picker-cta-hint {
            font-size: 10px;
          }

          .picker-cta {
            padding: 12px 22px;
            font-size: 14px;
          }
        }

        @media (max-height: 560px) {
          .picker-wrap {
            padding: 18px 16px;
            gap: 16px;
          }

          .picker-title {
            font-size: 24px;
          }

          .picker-sub,
          .picker-cta-hint {
            display: none;
          }

          .drop-svg {
            width: 64px;
            height: 74px;
          }

          .drops-grid {
            max-width: 310px;
            gap: 10px 14px;
          }
        }
      `}</style>
    </motion.div>
  );
}
