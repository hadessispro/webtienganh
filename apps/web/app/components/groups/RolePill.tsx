"use client";

/**
 * RolePill
 * Discord-style label that shows a member's role in the group.
 * Renders as a colored chip with optional emoji icon.
 */

import type { CSSProperties } from "react";
import type { GroupRole } from "../../lib/group-data";

type Props = {
  role: GroupRole;
  size?: "sm" | "md";
};

export function RolePill({ role, size = "md" }: Props) {
  const style: CSSProperties & Record<string, string> = {
    "--rp-color": role.color,
  };
  return (
    <span
      className={`ll-grp-role-pill ${size === "sm" ? "ll-grp-role-pill-sm" : ""}`}
      style={style}
    >
      {role.icon && <span aria-hidden="true">{role.icon}</span>}
      <span>{role.label}</span>
    </span>
  );
}
