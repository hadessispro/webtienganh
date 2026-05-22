"use client";

/**
 * GroupOverview
 * "Tổng quan" tab on the group detail view. Bundles the most useful
 * widgets so a member can land here and immediately know:
 * - Is something live right now? (voice room / chat activity)
 * - What's the closest deadline?
 * - Who's leading the leaderboard?
 * - What are the recent events?
 */

import { daysUntil, formatRelativeVi, type StudyGroupV2 } from "../../lib/group-data";
import { RolePill } from "./RolePill";

type Props = {
  group: StudyGroupV2;
  currentUserId: string;
};

export function GroupOverview({ group, currentUserId }: Props) {
  const upcomingDeadlines = [...group.deadlines].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
  );
  const closest = upcomingDeadlines[0];

  const sorted = [...group.members].sort((a, b) => b.weeklyScore - a.weeklyScore);
  const medals = ["🥇", "🥈", "🥉"];

  // Fake recent activity feed — replace with real telemetry once available
  const activityFeed = [
    {
      memberId: group.members[1]?.id ?? "",
      verb: "hoàn thành",
      target: "Meeting Roleplay #4",
      score: 87,
      time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    {
      memberId: group.members[0]?.id ?? "",
      verb: "vừa peer-review",
      target: "bài Writing của Nam",
      time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      memberId: group.members[2]?.id ?? "",
      verb: "thêm deadline",
      target: "Mock test cuối tuần",
      time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
  ].filter((a) => a.memberId);

  return (
    <div className="ll-grp-overview">
      <div className="ll-grp-overview-main">
        {/* Activity feed */}
        <section className="ll-grp-feed ll-glass">
          <header className="ll-grp-feed-head">
            <h3>Hoạt động gần đây</h3>
            <span>Hôm nay</span>
          </header>
          <ul className="ll-grp-feed-list">
            {activityFeed.map((a, i) => {
              const member = group.members.find((m) => m.id === a.memberId);
              if (!member) return null;
              return (
                <li key={i} className="ll-grp-feed-item">
                  <div
                    className="ll-grp-feed-avatar"
                    style={{ background: member.avatarColor }}
                    aria-hidden="true"
                  >
                    {member.initials}
                  </div>
                  <div className="ll-grp-feed-body">
                    <div>
                      <b>{member.name}</b> {a.verb}{" "}
                      <span className="ll-grp-feed-target">{a.target}</span>
                      {a.score && (
                        <span className="ll-grp-feed-score"> · {a.score}/100</span>
                      )}
                    </div>
                    <div className="ll-grp-feed-time">{formatRelativeVi(a.time)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Roles */}
        <section className="ll-grp-roles ll-glass">
          <h3>Vai trò trong nhóm</h3>
          <div className="ll-grp-roles-list">
            {group.roles.map((role) => (
              <RolePill key={role.id} role={role} />
            ))}
          </div>
          <p className="ll-grp-roles-hint">
            Owner có thể tạo và gán vai trò tùy ý (Free: 3 vai trò, Pro: 10)
          </p>
        </section>
      </div>

      <div className="ll-grp-overview-side">
        {/* Closest deadline */}
        {closest && (
          <section className="ll-grp-overview-deadline ll-glass">
            <header>
              <h3>Deadline sắp tới</h3>
              <span className="ll-grp-overview-deadline-tag">
                {(() => {
                  const d = daysUntil(closest.dueAt);
                  return d < 0
                    ? `Quá ${Math.abs(d)}d`
                    : d === 0
                    ? "Hôm nay"
                    : `${d} ngày`;
                })()}
              </span>
            </header>
            <div className="ll-grp-overview-deadline-title">{closest.title}</div>
            <div className="ll-grp-overview-deadline-meta">
              {closest.completedBy.length}/{group.members.length} thành viên đã hoàn thành
            </div>
            <div className="ll-grp-overview-deadline-bar" aria-hidden="true">
              <div
                className="ll-grp-overview-deadline-bar-fill"
                style={{
                  width: `${
                    (closest.completedBy.length / group.members.length) * 100
                  }%`,
                }}
              />
            </div>
          </section>
        )}

        {/* Mini leaderboard */}
        <section className="ll-grp-overview-leaderboard ll-glass">
          <h3>🏆 BXH tuần</h3>
          {sorted.slice(0, 5).map((m, idx) => {
            const isYou = m.id === currentUserId;
            return (
              <div
                key={m.id}
                className={`ll-grp-overview-lb-row ${isYou ? "is-you" : ""}`}
              >
                <span className="ll-grp-overview-lb-rank">
                  {medals[idx] ?? <small>{idx + 1}</small>}
                </span>
                <div
                  className="ll-grp-overview-lb-avatar"
                  style={{ background: m.avatarColor }}
                  aria-hidden="true"
                >
                  {m.initials}
                </div>
                <span className="ll-grp-overview-lb-name">{m.name}</span>
                <span className="ll-grp-overview-lb-score">
                  {m.weeklyScore.toFixed(1)}
                </span>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
