"use client";

/**
 * Path: apps/web/app/placement/_components/splash-screen.tsx
 *
 * Full-screen splash:
 * - Gradient xanh la deep
 * - Logo LumaLang fade-in + scale + glow pulse
 * - Radial light pulse tu giua
 * - Auto-advance sau 2.2s, cho phep tap de skip
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timer.current = setTimeout(onDone, 2200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onDone]);

  const handleSkip = () => {
    if (timer.current) clearTimeout(timer.current);
    onDone();
  };

  return (
    <motion.div
      className="splash-wrap"
      onClick={handleSkip}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Radial pulse */}
      <motion.div
        className="splash-pulse"
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.3, 1], opacity: [0, 0.6, 0.3] }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />

      {/* Logo */}
      <motion.div
        className="splash-logo"
        initial={{ y: 20, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <img alt="LumaLang" src="/images/lumalang-logo.png" />
        <h1 className="splash-name">LumaLang</h1>
      </motion.div>

      <motion.p
        className="splash-tagline"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        Đo đúng trình độ <span className="dot">·</span> Mở đúng lộ trình
      </motion.p>

      <motion.div
        className="splash-skip"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.3 }}
      >
        chạm để tiếp tục
      </motion.div>

      <style jsx global>{`
        .splash-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          cursor: pointer;
          overflow: hidden;
        }

        .splash-pulse {
          position: absolute;
          width: 90vmin;
          height: 90vmin;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(92, 255, 163, 0.35) 0%,
            rgba(92, 255, 163, 0.1) 40%,
            transparent 70%
          );
          filter: blur(40px);
          pointer-events: none;
        }

        .splash-logo {
          display: flex;
          align-items: center;
          gap: 16px;
          z-index: 2;
          filter: drop-shadow(0 0 30px rgba(92, 255, 163, 0.4));
        }

        .splash-logo img {
          width: 82px;
          height: 82px;
          border-radius: 24px;
          object-fit: contain;
        }

        .splash-name {
          font-size: 44px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #f0fff5;
          margin: 0;
        }

        .splash-tagline {
          font-size: 14px;
          font-weight: 400;
          color: rgba(240, 255, 245, 0.7);
          letter-spacing: 0.04em;
          margin: 0;
          z-index: 2;
        }

        .splash-tagline .dot {
          color: #5cffa3;
          margin: 0 6px;
        }

        .splash-skip {
          position: absolute;
          bottom: 36px;
          font-size: 12px;
          letter-spacing: 0.2em;
          color: rgba(240, 255, 245, 0.6);
          text-transform: uppercase;
        }
      `}</style>
    </motion.div>
  );
}
