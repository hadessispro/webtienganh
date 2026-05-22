"use client";

/**
 * GroupsView
 * The main `/learn → Nhóm` screen. Switches between:
 * - "list" : safety banner + my groups + suggestions
 * - "detail" : one group, all features (delegated to GroupDetailView)
 *
 * This component owns the active group selection state but does NOT
 * own the groups data itself — that comes in as a prop from the parent
 * dashboard so it can be wired to localStorage / future API later.
 */

import { useMemo, useState } from "react";
import {
  daysUntil,
  type StudyGroupV2,
} from "../lib/group-data";
import { GroupDetailView } from "./GroupDetailView";
import { GroupCard } from "./groups/GroupCard";
import { SafetyBanner } from "./groups/SafetyBanner";
import { SuggestedGroupCard } from "./groups/SuggestedGroupCard";

type Props = {
  groups: StudyGroupV2[];
  /** id of the current user — used to determine ownership / membership */
  currentUserId: string;
  /** Whether the current user has joined the group (by group id) */
  joinedGroupIds: string[];
  onJoinRequest: (groupId: string) => void;
  onCreateGroup: () => void;
};

export function GroupsView({
  groups,
  currentUserId,
  joinedGroupIds,
  onJoinRequest,
  onCreateGroup,
}: Props) {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const activeGroup = useMemo(
    () => groups.find((g) => g.id === activeGroupId) ?? null,
    [groups, activeGroupId],
  );

  // Groups the user is in
  const myGroups = useMemo(
    () => groups.filter((g) => g.members.some((m) => m.id === currentUserId)),
    [groups, currentUserId],
  );

  // Groups the user isn't in — used as suggestions
  const suggestedGroups = useMemo(
    () =>
      groups.filter((g) => !g.members.some((m) => m.id === currentUserId)),
    [groups, currentUserId],
  );

  if (activeGroup) {
    return (
      <GroupDetailView
        group={activeGroup}
        currentUserId={currentUserId}
        onBack={() => setActiveGroupId(null)}
      />
    );
  }

  return (
    <div className="ll-page ll-grp-list">
      {/* Topbar */}
      <header className="ll-topbar ll-glass">
        <div>
          <div className="ll-label">Nhóm học · {myGroups.length} nhóm của bạn</div>
          <h1>
            Cùng <span className="ll-accent">tiến bộ</span>
          </h1>
        </div>
        <div className="ll-topbar-actions">
          <button type="button" className="ll-btn ghost">
            🔍 Tìm nhóm
          </button>
          <button type="button" className="ll-btn primary" onClick={onCreateGroup}>
            + Tạo nhóm
          </button>
        </div>
      </header>

      <SafetyBanner />

      {/* My groups */}
      {myGroups.length > 0 && (
        <>
          <div className="ll-grp-section-label">Nhóm của bạn</div>
          <div className="ll-grp-list-grid">
            {myGroups.map((group) => {
              const isOwner =
                group.roles.find((r) => r.isOwner)?.id ===
                group.members.find((m) => m.id === currentUserId)?.roleId;

              // Compute the "active feature" highlight per group
              const urgentDeadline = group.deadlines
                .map((d) => ({ d, days: daysUntil(d.dueAt) }))
                .filter(({ days }) => days >= 0 && days <= 2)
                .sort((a, b) => a.days - b.days)[0];

              const activeFeature = urgentDeadline
                ? {
                    kind: "deadline_urgent" as const,
                    label: urgentDeadline.d.title,
                    dueInDays: urgentDeadline.days,
                  }
                : group.streak.current >= 10
                ? {
                    kind: "chat" as const,
                    unread: 3,
                  }
                : null;

              const weeklyTop = [...group.members].sort(
                (a, b) => b.weeklyScore - a.weeklyScore,
              )[0];

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  isOwner={isOwner}
                  isMember
                  activeFeature={activeFeature}
                  unreadCount={activeFeature?.kind === "chat" ? activeFeature.unread : 0}
                  weeklyTop={weeklyTop}
                  onOpen={() => setActiveGroupId(group.id)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Suggested groups */}
      {suggestedGroups.length > 0 && (
        <>
          <div className="ll-grp-section-label">
            Gợi ý cho bạn · Cùng level
          </div>
          <div className="ll-grp-suggested-grid">
            {suggestedGroups.map((group) => (
              <SuggestedGroupCard
                key={group.id}
                group={group}
                onRequestJoin={() => onJoinRequest(group.id)}
              />
            ))}
          </div>
        </>
      )}

      {/* Create CTA */}
      <div className="ll-grp-create-cta ll-glass">
        <div>
          <div className="ll-grp-create-cta-title">
            Không tìm thấy nhóm phù hợp?
          </div>
          <div className="ll-grp-create-cta-desc">
            Tạo nhóm riêng (tối đa 5 thành viên với gói Free), mời bạn bè qua
            mã 6 ký tự, hoặc để open cho cộng đồng tìm thấy.
          </div>
        </div>
        <button type="button" className="ll-btn primary" onClick={onCreateGroup}>
          + Tạo nhóm mới
        </button>
      </div>
    </div>
  );
}
