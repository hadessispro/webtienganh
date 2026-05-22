"use client";

/**
 * ComingSoonPanel
 * Used for the 3 features deferred to v2:
 * - Live voice room
 * - Peer review
 * - Co-watch lesson
 *
 * Shows what the feature will do + a "Đăng ký quan tâm" button so we can
 * track demand before building.
 */

import { useState } from "react";

type Props = {
  feature: "voice" | "peer" | "co-watch";
};

const FEATURE_INFO: Record<
  Props["feature"],
  { icon: string; title: string; description: string; bullets: string[] }
> = {
  voice: {
    icon: "🎙",
    title: "Voice room — đang phát triển",
    description:
      "Phòng voice call ngắn 30 phút (free) để cả nhóm cùng shadowing, roleplay tình huống công việc, hoặc luyện speaking IELTS Part 2/3.",
    bullets: [
      "30 phút/phiên với gói Free, không giới hạn với Pro",
      "Pro được ghi âm replay để nghe lại sau",
      "Tự động sinh transcript có time-stamp",
    ],
  },
  peer: {
    icon: "✍",
    title: "Peer review — đang phát triển",
    description:
      "Hệ thống chấm chéo cho bài Writing và Speaking. Mỗi bài được 2 người chấm độc lập (gán ngẫu nhiên để tránh thiên vị).",
    bullets: [
      "Rubric chuẩn IELTS / TOEIC theo từng dạng",
      "Hệ thống gán random để tránh chấm thiên vị bạn thân",
      "Người chấm cũng được điểm — không miễn phí công sức",
    ],
  },
  "co-watch": {
    icon: "📺",
    title: "Co-watch — đang phát triển",
    description:
      "Cả nhóm xem chung 1 bài học, đồng bộ timeline, có thể react và comment ngay tại từng thời điểm.",
    bullets: [
      "Host điều khiển play/pause cho cả nhóm",
      "Pro: full HD + sync chính xác đến giây",
      "Comment được pin vào timeline để học lại sau",
    ],
  },
};

export function ComingSoonPanel({ feature }: Props) {
  const info = FEATURE_INFO[feature];
  const [interested, setInterested] = useState(false);

  return (
    <div className="ll-grp-coming-soon ll-glass">
      <div className="ll-grp-coming-soon-icon" aria-hidden="true">
        {info.icon}
      </div>
      <h2>{info.title}</h2>
      <p>{info.description}</p>
      <ul>
        {info.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {!interested ? (
        <button
          type="button"
          className="ll-btn primary"
          onClick={() => setInterested(true)}
        >
          🔔 Đăng ký nhận thông báo khi ra mắt
        </button>
      ) : (
        <div className="ll-grp-coming-soon-thanks">
          ✓ Cảm ơn bạn! Chúng tôi sẽ báo ngay khi tính năng này sẵn sàng.
        </div>
      )}
    </div>
  );
}
