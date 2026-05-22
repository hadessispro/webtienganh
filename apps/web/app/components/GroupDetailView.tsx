"use client";

/**
 * GroupDetailView
 * One group, full features. Tabs:
 * - Tổng quan   (GroupOverview)
 * - Chat        (ChatPanel) ← v1
 * - Deadline    (DeadlinePanel) ← v1
 * - BXH tuần    (LeaderboardPanel) ← v1
 * - Voice room  (ComingSoonPanel) ← v2
 * - Peer review (ComingSoonPanel) ← v2
 * - Co-watch    (ComingSoonPanel) ← v2
 *
 * Why coming-soon panels instead of hiding the tabs?
 * - Validates demand: track who clicks which v2 tab.
 * - Sets expectations: members see what's planned without thinking
 *   the group has nothing to offer.
 */

import { useMemo, useState } from "react";
import {
  defaultChatMessages,
  formatRelativeVi,
  getOnlineCount,
  type StudyGroupV2,
} from "../lib/group-data";
import { ChatPanel } from "./groups/ChatPanel";
import { ComingSoonPanel } from "./groups/ComingSoonPanel";
import { DeadlinePanel } from "./groups/DeadlinePanel";
import { GroupOverview } from "./groups/GroupOverview";
import { LeaderboardPanel } from "./groups/LeaderboardPanel";
import { RolePill } from "./groups/RolePill";

type GroupDetailTab =
  | "overview"
  | "chat"
  | "deadline"
  | "leaderboard"
  | "voice"
  | "peer"
  | "cowatch";

type TabConfig = {
  id: GroupDetailTab;
  label: string;
  badge?: number;
  isLive?: boolean;
  isV2?: boolean;
};

type Props = {
  group: StudyGroupV2;
  currentUserId: string;
  onBack: () => void;
};

export function GroupDetailView({ group, currentUserId, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<GroupDetailTab>("overview");

  const initialChat = useMemo(
    () => defaultChatMessages.filter((m) => m.groupId === group.id),
    [group.id],
  );

  const currentMember = group.members.find((m) => m.id === currentUserId);
  const currentRole = currentMember
    ? group.roles.find((r) => r.id === currentMember.roleId)
    : undefined;
  const isOwner = currentRole?.isOwner ?? false;
  const onlineCount = getOnlineCount(group);

  const tabs: TabConfig[] = [
    { id: "overview", label: "Tổng quan" },
    { id: "chat", label: "💬 Chat", badge: 0 },
    { id: "deadline", label: "📌 Deadline", badge: group.deadlines.length },
    { id: "leaderboard", label: "🏆 BXH tuần" },
    { id: "voice", label: "🎙 Voice room", isV2: true },
    { id: "peer", label: "✍ Peer review", isV2: true },
    { id: "cowatch", label: "📺 Co-watch", isV2: true },
  ];

  return (
    <div className="ll-page ll-grp-detail">
      {/* Breadcrumb */}
      <div className="ll-grp-detail-crumbs">
        <button type="button" className="ll-grp-detail-back" onClick={onBack}>
          ← Nhóm học
        </button>
        <span className="ll-grp-detail-crumb-divider" aria-hidden="true" />
        <span className="ll-grp-detail-crumb-current">{group.name}</span>
      </div>

      {/* Hero */}
      <header className="ll-grp-detail-hero ll-glass">
        <div className="ll-grp-detail-hero-left">
          <div className="ll-grp-detail-hero-meta">
            {currentRole && <RolePill role={currentRole} />}
            <span className="ll-grp-detail-hero-code">
              Mã mời: <code>{group.inviteCode}</code>
            </span>
            {group.ownerPlanTier === "pro" && (
              <span className="ll-grp-pro-tag">Pro</span>
            )}
          </div>
          <h1 className="ll-grp-detail-hero-name">{group.name}</h1>
          <div className="ll-grp-detail-hero-sub">
            {group.members.length} thành viên · {group.level} · Tạo{" "}
            {formatRelativeVi(group.createdAt)}
          </div>
        </div>
        <div className="ll-grp-detail-hero-right">
          <div className="ll-grp-detail-streak">
            <div className="ll-grp-detail-streak-value">
              🔥 {group.streak.current}
            </div>
            <div className="ll-grp-detail-streak-label">Streak nhóm</div>
          </div>
          <div className="ll-grp-detail-divider" />
          <div className="ll-grp-detail-online">
            <div className="ll-grp-detail-online-value">{onlineCount}</div>
            <div className="ll-grp-detail-online-label">Đang online</div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="ll-grp-detail-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`ll-grp-detail-tab ${
              activeTab === t.id ? "is-active" : ""
            } ${t.isV2 ? "is-v2" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.badge ? (
              <span className="ll-grp-detail-tab-badge">{t.badge}</span>
            ) : null}
            {t.isLive && (
              <span className="ll-grp-detail-tab-live" aria-hidden="true" />
            )}
            {t.isV2 && (
              <span className="ll-grp-detail-tab-v2-tag">Sắp ra</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="ll-grp-detail-content">
        {activeTab === "overview" && (
          <GroupOverview group={group} currentUserId={currentUserId} />
        )}
        {activeTab === "chat" && (
          <ChatPanel
            group={group}
            currentUserId={currentUserId}
            initialMessages={initialChat}
          />
        )}
        {activeTab === "deadline" && (
          <DeadlinePanel group={group} currentUserId={currentUserId} />
        )}
        {activeTab === "leaderboard" && (
          <LeaderboardPanel group={group} currentUserId={currentUserId} />
        )}
        {activeTab === "voice" && <ComingSoonPanel feature="voice" />}
        {activeTab === "peer" && <ComingSoonPanel feature="peer" />}
        {activeTab === "cowatch" && <ComingSoonPanel feature="co-watch" />}
      </div>

      {/* Footer disclaimer for owners */}
      {isOwner && (
        <footer className="ll-grp-detail-owner-foot">
          Bạn là Owner. Nâng cấp <b>LumaLang Pro</b> để mở rộng nhóm lên 20
          thành viên + voice replay + cohort schedule.
        </footer>
      )}
    </div>
  );
}
