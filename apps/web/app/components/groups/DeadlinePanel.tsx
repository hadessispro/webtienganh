"use client";

/**
 * DeadlinePanel
 * Shared group deadlines. Each card shows progress = members who
 * completed / total members. Urgent (≤2 days) gets a warning style.
 */

import { daysUntil, type StudyGroupV2 } from "../../lib/group-data";

type Props = {
  group: StudyGroupV2;
  currentUserId: string;
  onCreate?: () => void;
};

export function DeadlinePanel({ group, currentUserId, onCreate }: Props) {
  if (group.deadlines.length === 0) {
    return (
      <div className="ll-grp-deadline-empty ll-glass">
        <div className="ll-grp-deadline-empty-icon" aria-hidden="true">📌</div>
        <h3>Chưa có deadline nào</h3>
        <p>Cùng deadline = cùng động lực. Tạo deadline đầu tiên cho nhóm.</p>
        <button type="button" className="ll-btn primary" onClick={onCreate}>
          + Thêm deadline
        </button>
      </div>
    );
  }

  return (
    <div className="ll-grp-deadline-grid">
      {group.deadlines.map((d) => {
        const days = daysUntil(d.dueAt);
        const isUrgent = days >= 0 && days <= 2;
        const isOverdue = days < 0;
        const total = group.members.length;
        const completed = d.completedBy.length;
        const pct = total > 0 ? (completed / total) * 100 : 0;
        const youDone = d.completedBy.includes(currentUserId);

        return (
          <article
            key={d.id}
            className="ll-grp-deadline-card ll-glass"
            data-urgency={isOverdue ? "overdue" : isUrgent ? "urgent" : "normal"}
          >
            <header className="ll-grp-deadline-head">
              <div>
                <h3>{d.title}</h3>
                <p>{d.description}</p>
              </div>
              <span className="ll-grp-deadline-due">
                {isOverdue
                  ? `Quá ${Math.abs(days)}d`
                  : days === 0
                  ? "Hôm nay"
                  : `Còn ${days}d`}
              </span>
            </header>

            <div className="ll-grp-deadline-progress-row">
              <span className="ll-grp-deadline-progress-label">
                {completed} / {total} hoàn thành
              </span>
              <span className="ll-grp-deadline-progress-pct">{Math.round(pct)}%</span>
            </div>
            <div className="ll-grp-deadline-bar" aria-hidden="true">
              <div
                className="ll-grp-deadline-bar-fill"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="ll-grp-deadline-members">
              {group.members.map((m) => {
                const done = d.completedBy.includes(m.id);
                const isYou = m.id === currentUserId;
                return (
                  <div
                    key={m.id}
                    className={`ll-grp-deadline-member-dot ${
                      done ? "is-done" : "is-pending"
                    } ${isYou ? "is-you" : ""}`}
                    style={{ background: m.avatarColor }}
                    title={`${m.name}${done ? " — đã xong" : " — chưa xong"}`}
                  >
                    {m.initials}
                  </div>
                );
              })}
            </div>

            {!youDone && (
              <button type="button" className="ll-btn mint ll-grp-deadline-cta">
                ✓ Đánh dấu hoàn thành
              </button>
            )}
            {youDone && (
              <div className="ll-grp-deadline-done">
                ✓ Bạn đã hoàn thành — chờ {total - completed} thành viên khác
              </div>
            )}
          </article>
        );
      })}

      <button
        type="button"
        className="ll-grp-deadline-create ll-glass"
        onClick={onCreate}
      >
        <div className="ll-grp-deadline-create-icon" aria-hidden="true">📌</div>
        <strong>Tạo deadline mới</strong>
        <small>Cùng nhóm cùng deadline</small>
      </button>
    </div>
  );
}
