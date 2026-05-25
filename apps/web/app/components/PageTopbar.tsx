"use client";

/**
 * Path: apps/web/app/components/PageTopbar.tsx
 *
 * Shared topbar used by every dashboard view (Hôm nay / Bài học /
 * Khóa học / Đề luyện / Shadowing / Lịch học / Nhóm / Profile).
 *
 * Before this existed, each view inlined its own
 *   <header className="ll-topbar ll-glass">
 *     <div>
 *       <div className="ll-label">EYEBROW</div>
 *       <h1>Title <span className="ll-accent">accent</span></h1>
 *     </div>
 *     <div className="ll-topbar-actions">...buttons...</div>
 *   </header>
 *
 * which lead to subtle inconsistencies (padding, font weight, accent
 * placement) and one view — Shadowing — skipped the topbar entirely
 * and rendered its own hero inside the body, so the title position
 * jumped when switching tabs.
 *
 * This component is the ONE place to change topbar visuals.
 */

import type { ReactNode } from "react";

interface PageTopbarProps {
  /** Small uppercase eyebrow line, e.g. "KHÓA HỌC · 3 MẠCH" */
  eyebrow: string;
  /** Main title, e.g. "Hành trình của " */
  title: string;
  /** Accent fragment appended to title in green, e.g. "bạn" */
  titleAccent?: string;
  /** Optional buttons aligned right (e.g. "Đăng ký mới") */
  actions?: ReactNode;
}

export function PageTopbar({
  eyebrow,
  title,
  titleAccent,
  actions,
}: PageTopbarProps) {
  return (
    <header className="ll-topbar ll-glass">
      <div className="ll-topbar-text">
        <div className="ll-label">{eyebrow}</div>
        <h1>
          {title}
          {titleAccent ? (
            <span className="ll-accent">{titleAccent}</span>
          ) : null}
        </h1>
      </div>
      {actions ? (
        <div className="ll-topbar-actions">{actions}</div>
      ) : null}
    </header>
  );
}
