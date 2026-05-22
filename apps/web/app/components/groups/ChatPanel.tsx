"use client";

/**
 * ChatPanel
 * Group chat with auto-redact filter. When a user types a message
 * containing a phone number, off-platform messaging ID, or banking
 * keyword, the offending substring is replaced with asterisks BEFORE
 * the message is stored. The UI then shows a small warning + report
 * button so other members can flag the sender.
 *
 * Design choices:
 * - We chose AUTO-REDACT (Q2 from product spec) over block-and-warn
 *   because it lets benign mentions through ("đang dùng telegram để học
 *   tiếng Nhật") while neutering exploit attempts ("zalo 0901234567").
 * - The redacted message is what other members see. The sender is NOT
 *   shown their original text after sending — they see the same `***`
 *   so they understand what happened.
 * - Messages are stored locally for now. When we wire the backend,
 *   redaction will happen server-side and the report payload will go
 *   to a moderation queue.
 */

import { useMemo, useRef, useState } from "react";
import {
  applyChatFilter,
  formatHM,
  getMemberById,
  getRoleById,
  REDACTION_LABELS,
  type ChatMessage,
  type StudyGroupV2,
} from "../../lib/group-data";
import { RolePill } from "./RolePill";

type Props = {
  group: StudyGroupV2;
  currentUserId: string;
  initialMessages: ChatMessage[];
};

export function ChatPanel({ group, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Group members keyed by id for O(1) lookup during render
  const memberMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof getMemberById>> = {};
    for (const m of group.members) map[m.id] = m;
    return map;
  }, [group.members]);

  const onlineMembers = group.members.filter((m) => m.online);
  const offlineMembers = group.members.filter((m) => !m.online);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const { safe, flags } = applyChatFilter(trimmed);

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      groupId: group.id,
      authorId: currentUserId,
      text: safe,
      flags,
      sentAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, msg]);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="ll-grp-chat">
      <div className="ll-grp-chat-main ll-glass">
        <div className="ll-grp-chat-messages">
          {messages.map((m) => {
            const author = memberMap[m.authorId];
            if (!author) return null;
            const role = getRoleById(group, author.roleId);
            const isMe = m.authorId === currentUserId;
            return (
              <div key={m.id} className="ll-grp-chat-msg">
                <div
                  className="ll-grp-chat-msg-avatar"
                  style={{ background: author.avatarColor }}
                  aria-hidden="true"
                >
                  {author.initials}
                </div>
                <div className="ll-grp-chat-msg-body">
                  <div className="ll-grp-chat-msg-head">
                    <span className="ll-grp-chat-msg-author">{isMe ? "Bạn" : author.name}</span>
                    {role && <RolePill role={role} size="sm" />}
                    <span className="ll-grp-chat-msg-time">{formatHM(m.sentAt)}</span>
                  </div>
                  <div
                    className={
                      m.flags.length > 0
                        ? "ll-grp-chat-msg-text ll-grp-chat-msg-text-flagged"
                        : "ll-grp-chat-msg-text"
                    }
                  >
                    {m.text}
                  </div>
                  {m.flags.length > 0 && (
                    <div className="ll-grp-chat-msg-warning">
                      <span aria-hidden="true">🛡️</span>
                      <span className="ll-grp-chat-msg-warning-text">
                        Đã ẩn:{" "}
                        {m.flags.map((f, i) => (
                          <span key={f}>
                            {i > 0 && ", "}
                            {REDACTION_LABELS[f]}
                          </span>
                        ))}
                      </span>
                      <button type="button" className="ll-grp-chat-msg-report">
                        🚩 Báo cáo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="ll-grp-chat-input-bar">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder='Nhập tin nhắn... (thử gõ "zalo 0901234567" để xem filter)'
            className="ll-grp-chat-input"
            aria-label="Tin nhắn"
          />
          <button type="button" onClick={handleSend} className="ll-grp-chat-send">
            Gửi
          </button>
        </div>
        <div className="ll-grp-chat-input-hint">
          🛡️ Chat được bảo vệ: tự động lọc số điện thoại, link tài chính, từ khóa thu phí.{" "}
          <a href="#community-rules">Tìm hiểu</a>
        </div>
      </div>

      <aside className="ll-grp-chat-sidebar ll-glass">
        <h3 className="ll-grp-chat-sidebar-head">
          Online — {onlineMembers.length}
        </h3>
        {onlineMembers.map((m) => (
          <MemberRow key={m.id} member={m} role={getRoleById(group, m.roleId)} />
        ))}
        {offlineMembers.length > 0 && (
          <>
            <h3 className="ll-grp-chat-sidebar-head ll-grp-chat-sidebar-head-secondary">
              Offline — {offlineMembers.length}
            </h3>
            {offlineMembers.map((m) => (
              <MemberRow key={m.id} member={m} role={getRoleById(group, m.roleId)} />
            ))}
          </>
        )}
      </aside>
    </div>
  );
}

function MemberRow({
  member,
  role,
}: {
  member: { id: string; name: string; initials: string; avatarColor: string; online: boolean; activity?: string };
  role: ReturnType<typeof getRoleById>;
}) {
  return (
    <div className={`ll-grp-member-row ${member.online ? "is-online" : "is-offline"}`}>
      <div className="ll-grp-member-avatar-wrap">
        <div
          className="ll-grp-member-avatar"
          style={{ background: member.avatarColor }}
          aria-hidden="true"
        >
          {member.initials}
        </div>
        {member.online && <span className="ll-grp-member-dot" aria-hidden="true" />}
      </div>
      <div className="ll-grp-member-info">
        <div className="ll-grp-member-name">{member.name}</div>
        {member.activity && (
          <div className="ll-grp-member-activity">đang {member.activity}</div>
        )}
        {!member.activity && role && <RolePill role={role} size="sm" />}
      </div>
    </div>
  );
}
