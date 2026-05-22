/**
 * Group domain — types, seed data, and the chat filter logic.
 *
 * Design rules:
 * - Default open, free tier limited to ≤ 5 members per group.
 * - Pro tier (paid) unlocks ≤ 20 members + cohort schedule + voice replay etc.
 * - Safety: chat filter auto-redacts phone numbers, Zalo/Telegram IDs, banking
 *   keywords. Message still sends but with `***` in place.
 * - Roles are Discord-style: owner picks a label + color, assigns to members.
 *
 * Persistence: localStorage for now (key `lumalang.groups.v1`), schema-ready
 * for the future Prisma backend.
 */

import type { Goal } from "./learning-core";

export type PlanTier = "free" | "pro";

export type GroupVisibility = "open" | "invite_only";

/** Discord-style custom role. Owner can create up to N (free=3, pro=10). */
export type GroupRole = {
  id: string;
  label: string;
  color: string;       // hex
  icon?: string;       // emoji
  isOwner?: boolean;   // only one role can be owner
};

export type GroupMember = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  roleId: string;
  online: boolean;
  /** What the member is doing right now, surface in voice/activity panels */
  activity?: "shadowing" | "quiz" | "chat" | "voice" | "flashcards";
  /** Weekly score for the group's leaderboard (0-100, recalculated weekly) */
  weeklyScore: number;
};

/** A deadline shared across all members of the group. */
export type GroupDeadline = {
  id: string;
  title: string;
  description: string;
  /** ISO datetime when the deadline expires */
  dueAt: string;
  /** Member ids that have already completed this deadline */
  completedBy: string[];
  createdBy: string;
};

/**
 * Group streak: number of consecutive days where ≥5 members (or all members
 * if group <5) studied for ≥1 task. Resets if a day is missed.
 */
export type GroupStreak = {
  current: number;
  longest: number;
  /** Last 14 days as booleans (most recent last) */
  recentDays: boolean[];
};

export type StudyGroupV2 = {
  id: string;
  name: string;
  description: string;
  /** CEFR range (e.g. "B1-B2") */
  level: string;
  /** Single primary goal for matching purposes */
  goal: Goal;
  visibility: GroupVisibility;
  /** 6-char invite code, used for invite-only or for share links */
  inviteCode: string;
  /** Tier of the OWNER, not member — determines group size cap etc */
  ownerPlanTier: PlanTier;
  ownerId: string;
  createdAt: string;
  members: GroupMember[];
  roles: GroupRole[];
  streak: GroupStreak;
  deadlines: GroupDeadline[];
  /** Optional: visual tone for the group avatar gradient */
  accentColor: string;
};

/** Plan limits */
export const PLAN_LIMITS: Record<PlanTier, {
  maxMembers: number;
  maxRoles: number;
  voiceMinutesPerSession: number; // 0 = unlimited
  voiceReplay: boolean;
  cohortSchedule: boolean;
  coWatchHD: boolean;
  customBranding: boolean;
}> = {
  free: {
    maxMembers: 5,
    maxRoles: 3,
    voiceMinutesPerSession: 30,
    voiceReplay: false,
    cohortSchedule: false,
    coWatchHD: false,
    customBranding: false,
  },
  pro: {
    maxMembers: 20,
    maxRoles: 10,
    voiceMinutesPerSession: 0,
    voiceReplay: true,
    cohortSchedule: true,
    coWatchHD: true,
    customBranding: true,
  },
};

/* ────────────────────────────────────────────────────────────────────
   CHAT FILTER
   Auto-redact phone numbers, off-platform messaging IDs, and Vietnamese
   bank/payment keywords. We replace matched substrings with `***`.
   Returns both the safe text and a list of patterns that fired so the
   UI can show a banner + report CTA.
   ──────────────────────────────────────────────────────────────────── */

export type RedactionReason =
  | "phone_number"
  | "messaging_app"
  | "bank_or_transfer"
  | "tuition_keyword";

export type RedactedMessage = {
  safe: string;
  flags: RedactionReason[];
};

/**
 * Note on word boundaries: the standard `\b` only treats ASCII letters as
 * word characters, so it fires INSIDE Vietnamese words containing
 * diacritics ("học" → boundary between "ọ" and "c"). For Vietnamese we use
 * Unicode-aware lookarounds: (?<![\p{L}\p{N}]) and (?![\p{L}\p{N}]).
 */
const REDACTION_RULES: Array<{
  reason: RedactionReason;
  pattern: RegExp;
}> = [
  // Vietnamese phone numbers: 9-11 consecutive digits, possibly with dots/spaces/dashes
  {
    reason: "phone_number",
    pattern: /(?:(?:\+?84|0)[\s.\-]?)?(?:\d[\s.\-]?){8,10}\d/g,
  },
  // Off-platform messaging apps
  {
    reason: "messaging_app",
    pattern: /(?<![\p{L}\p{N}])(zalo|telegram|whatsapp|signal|messenger|viber|kakao|line)(?![\p{L}\p{N}])/giu,
  },
  // Banking & transfer keywords (Vietnamese + English)
  {
    reason: "bank_or_transfer",
    pattern: /(?<![\p{L}\p{N}])(chuy[eể]n\s*kho[aả]n|stk|s[oố]\s*t[aà]i\s*kho[aả]n|vietcombank|vcb|techcombank|tcb|bidv|mb\s*bank|momo|zalopay|vnpay|paypal|wire\s*transfer|bank\s*account)(?![\p{L}\p{N}])/giu,
  },
  // Tuition / payment phrasing
  {
    reason: "tuition_keyword",
    pattern: /(?<![\p{L}\p{N}])(h[oọ]c\s*ph[ií]|đ[oó]ng\s*ti[eề]n|n[oộ]p\s*ti[eề]n|ph[ií]\s*kh[oó]a|tuition\s*fee|pay\s*me)(?![\p{L}\p{N}])/giu,
  },
];

export function applyChatFilter(input: string): RedactedMessage {
  let safe = input;
  const flags: Set<RedactionReason> = new Set();

  for (const rule of REDACTION_RULES) {
    if (rule.pattern.test(input)) {
      flags.add(rule.reason);
      // Reset lastIndex (global regex) before replace
      rule.pattern.lastIndex = 0;
      safe = safe.replace(rule.pattern, (match) => "*".repeat(Math.max(3, Math.min(match.length, 10))));
    }
  }

  return { safe, flags: Array.from(flags) };
}

export const REDACTION_LABELS: Record<RedactionReason, string> = {
  phone_number: "số điện thoại",
  messaging_app: "ứng dụng liên lạc ngoài",
  bank_or_transfer: "thông tin ngân hàng / chuyển khoản",
  tuition_keyword: "yêu cầu thu phí",
};

/* ────────────────────────────────────────────────────────────────────
   SEED DATA
   ──────────────────────────────────────────────────────────────────── */

const DAYS_AGO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const DAYS_AHEAD = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// Stable demo roles used across groups
const DEMO_ROLES = {
  owner:    { id: "role-owner", label: "Founder", color: "#7c3aed", icon: "👑", isOwner: true },
  active:   { id: "role-active", label: "Active", color: "#0f9d58", icon: "🔥" },
  helper:   { id: "role-helper", label: "Helper", color: "#e2a73a", icon: "🤝" },
  newbie:   { id: "role-newbie", label: "Newbie", color: "#4187d6", icon: "🌱" },
};

export const defaultStudyGroups: StudyGroupV2[] = [
  {
    id: "office-english-club",
    name: "Office English Club",
    description: "Phản xạ meeting, daily standup 9pm tối thứ 2/4/6",
    level: "B1-B2",
    goal: "work",
    visibility: "open",
    inviteCode: "OEC-K3F",
    ownerPlanTier: "free",
    ownerId: "m-thao",
    createdAt: DAYS_AGO(64),
    accentColor: "#0f9d58",
    roles: [DEMO_ROLES.owner, DEMO_ROLES.active, DEMO_ROLES.helper, DEMO_ROLES.newbie],
    members: [
      { id: "m-thao",    name: "Hoàng Thảo", initials: "HT", avatarColor: "#e2a73a", roleId: "role-owner",  online: true,  activity: "chat",       weeklyScore: 91.0 },
      { id: "m-minhanh", name: "Minh Anh",   initials: "MA", avatarColor: "#e23a6e", roleId: "role-active", online: true,  activity: "shadowing",  weeklyScore: 94.2 },
      { id: "m-nam",     name: "Nam",        initials: "NA", avatarColor: "#4187d6", roleId: "role-helper", online: true,  activity: "voice",      weeklyScore: 87.5 },
      { id: "m-self",    name: "Bạn (Luma)", initials: "LL", avatarColor: "#0f9d58", roleId: "role-active", online: true,                          weeklyScore: 72.0 },
      { id: "m-phuong",  name: "Phương",     initials: "PH", avatarColor: "#7c3aed", roleId: "role-newbie", online: false,                         weeklyScore: 68.8 },
    ],
    streak: {
      current: 12,
      longest: 18,
      recentDays: [true, true, true, true, false, true, true, true, true, true, true, true, true, true],
    },
    deadlines: [
      {
        id: "d-mock-test",
        title: "Mock test full IELTS",
        description: "Hoàn thành 1 mock test + chụp ảnh kết quả gửi vào chat",
        dueAt: DAYS_AHEAD(2),
        completedBy: ["m-thao", "m-minhanh", "m-nam"],
        createdBy: "m-thao",
      },
      {
        id: "d-flashcards",
        title: "Flashcard 30 từ business",
        description: "Học hết 30 thẻ trong bộ Business Vocab tuần này",
        dueAt: DAYS_AHEAD(5),
        completedBy: ["m-minhanh"],
        createdBy: "m-thao",
      },
    ],
  },

  {
    id: "ielts-70-buddies",
    name: "IELTS 7.0 Buddies",
    description: "Writing-focused, peer review chéo mỗi cuối tuần",
    level: "B2",
    goal: "exam",
    visibility: "open",
    inviteCode: "IELTS70",
    ownerPlanTier: "pro",
    ownerId: "m-self",
    createdAt: DAYS_AGO(40),
    accentColor: "#e23a6e",
    roles: [DEMO_ROLES.owner, DEMO_ROLES.active, DEMO_ROLES.helper, DEMO_ROLES.newbie],
    members: [
      { id: "m-self",    name: "Bạn (Luma)", initials: "LL", avatarColor: "#0f9d58", roleId: "role-owner",  online: true,                          weeklyScore: 72.0 },
      { id: "m-quan",    name: "Quân",       initials: "QU", avatarColor: "#e2a73a", roleId: "role-active", online: false,                         weeklyScore: 64.3 },
      { id: "m-vi",      name: "Vi",         initials: "VI", avatarColor: "#4187d6", roleId: "role-helper", online: false,                         weeklyScore: 71.8 },
      { id: "m-na",      name: "Nga",        initials: "NA", avatarColor: "#e23a6e", roleId: "role-newbie", online: false,                         weeklyScore: 41.0 },
    ],
    streak: {
      current: 5,
      longest: 11,
      recentDays: [false, false, true, true, true, true, true, false, false, false, false, false, false, false],
    },
    deadlines: [
      {
        id: "d-peer-review",
        title: "Peer review chéo Writing",
        description: "Mỗi người chấm 2 bài Task 2 của thành viên khác",
        dueAt: DAYS_AHEAD(7),
        completedBy: ["m-self", "m-vi"],
        createdBy: "m-self",
      },
    ],
  },

  {
    id: "morning-coffee-talk",
    name: "Morning Coffee Talk",
    description: "Trò chuyện casual 7-8am, không áp lực",
    level: "A2-B1",
    goal: "foundation",
    visibility: "invite_only",
    inviteCode: "COFFEE9",
    ownerPlanTier: "free",
    ownerId: "m-vi",
    createdAt: DAYS_AGO(15),
    accentColor: "#7c3aed",
    roles: [DEMO_ROLES.owner, DEMO_ROLES.active, DEMO_ROLES.newbie],
    members: [
      { id: "m-vi",      name: "Vi",         initials: "VI", avatarColor: "#7c3aed", roleId: "role-owner",  online: false,                         weeklyScore: 71.8 },
      { id: "m-qu",      name: "Quỳnh",      initials: "QU", avatarColor: "#e2a73a", roleId: "role-active", online: false,                         weeklyScore: 58.0 },
      { id: "m-an",      name: "An",         initials: "AN", avatarColor: "#4187d6", roleId: "role-newbie", online: false,                         weeklyScore: 32.5 },
    ],
    streak: {
      current: 3,
      longest: 7,
      recentDays: [true, true, true, false, false, false, false, false, false, false, false, false, false, false],
    },
    deadlines: [],
  },
];

/* ────────────────────────────────────────────────────────────────────
   SEED CHAT MESSAGES (per group, demo only)
   ──────────────────────────────────────────────────────────────────── */

export type ChatMessage = {
  id: string;
  groupId: string;
  authorId: string;
  text: string;
  /** Filter flags from when the message was sent */
  flags: RedactionReason[];
  /** ISO timestamp */
  sentAt: string;
};

export const defaultChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    groupId: "office-english-club",
    authorId: "m-thao",
    text: "Tối nay 9pm họp standup nhé, ai có thể join?",
    flags: [],
    sentAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    groupId: "office-english-club",
    authorId: "m-minhanh",
    text: "Em sẽ vào!",
    flags: [],
    sentAt: new Date(Date.now() - 27 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-3",
    groupId: "office-english-club",
    authorId: "m-nam",
    text: "Anh chuẩn bị xong slide phần meeting structure rồi",
    flags: [],
    sentAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-4",
    groupId: "office-english-club",
    authorId: "m-phuong",
    text: "Cho em hỏi link tài liệu để chuẩn bị trước được không ạ",
    flags: [],
    sentAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
];

export const GROUPS_STORAGE_KEY = "lumalang.groups.v1";
export const GROUP_CHAT_STORAGE_KEY = "lumalang.group-chat.v1";

/* ────────────────────────────────────────────────────────────────────
   HELPERS
   ──────────────────────────────────────────────────────────────────── */

export function getRoleById(group: StudyGroupV2, roleId: string): GroupRole | undefined {
  return group.roles.find((r) => r.id === roleId);
}

export function getMemberById(group: StudyGroupV2, memberId: string): GroupMember | undefined {
  return group.members.find((m) => m.id === memberId);
}

export function getOnlineCount(group: StudyGroupV2): number {
  return group.members.filter((m) => m.online).length;
}

/** Days until the deadline, negative if overdue. */
export function daysUntil(iso: string): number {
  const due = new Date(iso).getTime();
  const now = Date.now();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

/** Format a relative time in Vietnamese (e.g. "2 phút trước"). */
export function formatRelativeVi(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút trước`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const d = Math.floor(hrs / 24);
  return `${d} ngày trước`;
}

/** Format a clock time HH:MM (24h). */
export function formatHM(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
