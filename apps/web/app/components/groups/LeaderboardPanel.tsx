"use client";

/**
 * LeaderboardPanel
 * Two sections:
 * 1. Weekly leaderboard inside the group (resets Sunday 23:59)
 * 2. Group streak — consecutive days ≥5 members studied
 *
 * NOTE: This is the IN-GROUP leaderboard. The old global leaderboard
 * (across all users on the platform) was removed because it discouraged
 * smaller groups. Competition stays inside the group.
 */

import type { StudyGroupV2 } from "../../lib/group-data";

type Props = {
  group: StudyGroupV2;
  currentUserId: string;
};

export function LeaderboardPanel({ group, currentUserId }: Props) {
  const sorted = [...group.members].sort((a, b) => b.weeklyScore - a.weeklyScore);
  const yourRank = sorted.findIndex((m) => m.id === currentUserId) + 1;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="ll-grp-leaderboard-grid">
      {/* Left: leaderboard */}
      <section className="ll-grp-leaderboard ll-glass">
        <header className="ll-grp-leaderboard-head">
          <h3>🏆 BXH tuần này</h3>
          <div className="ll-grp-leaderboard-sub">
            Reset Chủ nhật 23:59 · Tính theo deadline + flashcard + shadowing
          </div>
        </header>
        {sorted.map((m, idx) => {
          const rank = idx + 1;
          const isYou = m.id === currentUserId;
          const medal = medals[idx];
          return (
            <div
              key={m.id}
              className={`ll-grp-leaderboard-row ${isYou ? "is-you" : ""}`}
            >
              <span className="ll-grp-leaderboard-rank">
                {medal ?? <span className="ll-grp-leaderboard-rank-num">{rank}</span>}
              </span>
              <div
                className="ll-grp-leaderboard-avatar"
                style={{ background: m.avatarColor }}
                aria-hidden="true"
              >
                {m.initials}
              </div>
              <span className="ll-grp-leaderboard-name">{m.name}</span>
              <span className="ll-grp-leaderboard-score">
                {m.weeklyScore.toFixed(1)}
              </span>
            </div>
          );
        })}
        {yourRank > 0 && (
          <div className="ll-grp-leaderboard-foot">
            Bạn đang ở vị trí <b>#{yourRank}</b>
          </div>
        )}
      </section>

      {/* Right: streak + history */}
      <div className="ll-grp-leaderboard-side">
        <section className="ll-grp-streak ll-glass">
          <header>
            <h3>🔥 Group streak</h3>
            <p>= số ngày liên tiếp có ≥5 thành viên cùng học</p>
          </header>
          <div className="ll-grp-streak-display">
            <div className="ll-grp-streak-flame" aria-hidden="true">
              🔥
            </div>
            <div>
              <div className="ll-grp-streak-number">{group.streak.current} ngày</div>
              <div className="ll-grp-streak-record">
                Kỷ lục: {group.streak.longest} ngày
              </div>
            </div>
          </div>
          <div
            className="ll-grp-streak-calendar"
            role="img"
            aria-label={`14 ngày gần nhất, ${group.streak.recentDays.filter(Boolean).length} ngày có học`}
          >
            {group.streak.recentDays.map((d, i) => (
              <span
                key={i}
                className={
                  d ? "ll-grp-streak-day is-active" : "ll-grp-streak-day"
                }
              />
            ))}
          </div>
        </section>

        <section className="ll-grp-history ll-glass">
          <h3>Lịch sử các tuần</h3>
          <div className="ll-grp-history-row">
            <span className="ll-grp-history-week">Tuần này</span>
            <span className="ll-grp-history-leader">
              {sorted[0]?.name ?? "—"}
            </span>
            <span className="ll-grp-history-score">
              {sorted[0]?.weeklyScore.toFixed(1) ?? "—"}
            </span>
          </div>
          <div className="ll-grp-history-row">
            <span className="ll-grp-history-week">Tuần trước</span>
            <span className="ll-grp-history-leader">Minh Anh</span>
            <span className="ll-grp-history-score">102.5</span>
          </div>
          <div className="ll-grp-history-row">
            <span className="ll-grp-history-week">2 tuần trước</span>
            <span className="ll-grp-history-leader">Bạn 👑</span>
            <span className="ll-grp-history-score">88.0</span>
          </div>
        </section>
      </div>
    </div>
  );
}
