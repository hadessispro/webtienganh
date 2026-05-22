"use client";

/**
 * GroupCard
 * Compact card shown on the Groups list view. Shows:
 * - Group avatar (gradient with initials)
 * - Name + description
 * - Stats row: members / online / streak / level
 * - "Active feature" badge — surface the most relevant thing right now
 *   (e.g. live voice room, urgent deadline)
 * - Weekly leader inline
 *
 * Click anywhere on the card to open the detail view.
 */

import type { CSSProperties } from "react";
import { getOnlineCount, type StudyGroupV2, type GroupMember } from "../../lib/group-data";

type ActiveFeature =
  | { kind: "voice"; label: string; participantCount: number }
  | { kind: "deadline_urgent"; label: string; dueInDays: number }
  | { kind: "chat"; unread: number }
  | null;

type Props = {
  group: StudyGroupV2;
  isOwner: boolean;
  isMember: boolean;
  activeFeature: ActiveFeature;
  unreadCount: number;
  weeklyTop: GroupMember | null;
  onOpen: () => void;
};

export function GroupCard({
  group,
  isOwner,
  isMember,
  activeFeature,
  unreadCount,
  weeklyTop,
  onOpen,
}: Props) {
  const onlineCount = getOnlineCount(group);
  const cssVars: CSSProperties & Record<string, string> = {
    "--grp-accent": group.accentColor,
  };
  const initials = group.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <article
      className="ll-grp-card ll-glass"
      style={cssVars}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <header className="ll-grp-card-head">
        <div className="ll-grp-card-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="ll-grp-card-titles">
          <div className="ll-grp-card-title-row">
            <h3>{group.name}</h3>
            {isOwner && <span className="ll-grp-card-owner-badge">👑 Owner</span>}
            {!isOwner && isMember && <span className="ll-grp-card-member-badge">Đã tham gia</span>}
          </div>
          <p className="ll-grp-card-desc">{group.description}</p>
        </div>
        {unreadCount > 0 && (
          <span className="ll-grp-card-unread" aria-label={`${unreadCount} tin chưa đọc`}>
            {unreadCount}
          </span>
        )}
      </header>

      <div className="ll-grp-card-stats">
        <div className="ll-grp-card-stat">
          <strong>{group.members.length}</strong>
          <span>Thành viên</span>
        </div>
        <div className="ll-grp-card-stat-divider" />
        <div className="ll-grp-card-stat">
          <strong className={onlineCount > 0 ? "is-online" : ""}>
            {onlineCount > 0 ? onlineCount : "—"}
          </strong>
          <span>Online</span>
        </div>
        <div className="ll-grp-card-stat-divider" />
        <div className="ll-grp-card-stat">
          <strong>🔥 {group.streak.current}</strong>
          <span>Streak</span>
        </div>
        <div className="ll-grp-card-stat-divider" />
        <div className="ll-grp-card-stat">
          <strong>{group.level}</strong>
          <span>Level</span>
        </div>
      </div>

      {activeFeature && (
        <div
          className={`ll-grp-card-active ll-grp-card-active-${activeFeature.kind}`}
          aria-live="polite"
        >
          {activeFeature.kind === "voice" && (
            <>
              <span className="ll-grp-card-pulse" aria-hidden="true" />
              <span className="ll-grp-card-active-label">{activeFeature.label}</span>
              <span className="ll-grp-card-active-meta">{activeFeature.participantCount} người</span>
            </>
          )}
          {activeFeature.kind === "deadline_urgent" && (
            <>
              <span aria-hidden="true">⚠️</span>
              <span className="ll-grp-card-active-label">{activeFeature.label}</span>
              <span className="ll-grp-card-active-meta">còn {activeFeature.dueInDays}d</span>
            </>
          )}
          {activeFeature.kind === "chat" && (
            <>
              <span aria-hidden="true">💬</span>
              <span className="ll-grp-card-active-label">{activeFeature.unread} tin nhắn mới</span>
            </>
          )}
        </div>
      )}

      <div className="ll-grp-card-footer">
        {weeklyTop && (
          <div className="ll-grp-card-leader">
            🏆 Dẫn đầu: <b>{weeklyTop.name}</b> ({weeklyTop.weeklyScore.toFixed(1)})
          </div>
        )}
        <button
          type="button"
          className="ll-grp-card-open"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          Mở →
        </button>
      </div>
    </article>
  );
}
