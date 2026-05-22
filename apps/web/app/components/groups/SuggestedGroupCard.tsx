"use client";

/**
 * SuggestedGroupCard
 * Smaller card shown in the "Gợi ý cho bạn" section — for matchmaking
 * groups the user hasn't joined yet. Free-tier groups show their
 * remaining capacity (e.g. "4/5 chỗ") to subtly nudge users toward
 * either joining quickly or upgrading to make their own bigger group.
 */

import type { CSSProperties } from "react";
import { PLAN_LIMITS, type StudyGroupV2 } from "../../lib/group-data";

type Props = {
  group: StudyGroupV2;
  onRequestJoin: () => void;
};

export function SuggestedGroupCard({ group, onRequestJoin }: Props) {
  const cap = PLAN_LIMITS[group.ownerPlanTier].maxMembers;
  const taken = group.members.length;
  const isFull = taken >= cap;
  const cssVars: CSSProperties & Record<string, string> = {
    "--grp-accent": group.accentColor,
  };
  const initials = group.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  return (
    <article className="ll-grp-suggested-card ll-glass" style={cssVars}>
      <div className="ll-grp-suggested-head">
        <div className="ll-grp-suggested-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="ll-grp-suggested-titles">
          <div className="ll-grp-suggested-name">{group.name}</div>
          <div className="ll-grp-suggested-tagline">
            {group.level} · {group.description.split("·")[0]?.trim() || group.description}
          </div>
        </div>
      </div>
      <div className="ll-grp-suggested-footer">
        <span className="ll-grp-suggested-cap">
          <b>{taken}</b>/{cap} chỗ
          {group.ownerPlanTier === "pro" && <span className="ll-grp-pro-tag">Pro</span>}
        </span>
        <button
          type="button"
          className="ll-grp-suggested-join"
          onClick={onRequestJoin}
          disabled={isFull}
        >
          {isFull ? "Đã đầy" : group.visibility === "invite_only" ? "Cần mã mời" : "Xin tham gia"}
        </button>
      </div>
    </article>
  );
}
