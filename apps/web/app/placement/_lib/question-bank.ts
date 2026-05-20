/**
 * Path: apps/web/app/placement/_lib/question-bank.ts
 *
 * MVP question bank for adaptive placement.
 * In Phase 2+ this comes from `question_bank` table.
 */
import type { PlacementQuestion, CEFRLevel } from "./types";

const QUESTIONS: PlacementQuestion[] = [
  // ===== A1 =====
  {
    id: "a1-g1",
    level: "A1",
    type: "grammar",
    skill: "grammar",
    prompt: "She ___ coffee every morning.",
    options: ["drinks", "drink", "is drink"],
    answerIndex: 0,
    explainVi: "Chủ ngữ số ít (she) ở thì hiện tại đơn cần động từ thêm -s.",
  },
  {
    id: "a1-v1",
    level: "A1",
    type: "vocab",
    skill: "vocab",
    prompt: "Từ 'morning' nghĩa là gì?",
    options: ["Buổi sáng", "Buổi tối", "Buổi trưa"],
    answerIndex: 0,
    explainVi: "Morning = buổi sáng.",
  },
  {
    id: "a1-l1",
    level: "A1",
    type: "listening",
    skill: "listening",
    prompt: "Nghe và chọn số đúng:",
    audioText: "It is half past seven.",
    options: ["7:30", "6:30", "8:30"],
    answerIndex: 0,
    explainVi: "Half past seven = 7:30.",
  },
  // ===== A2 =====
  {
    id: "a2-g1",
    level: "A2",
    type: "grammar",
    skill: "grammar",
    prompt: "Yesterday I ___ to the office at 8.",
    options: ["went", "go", "going"],
    answerIndex: 0,
    explainVi: "Yesterday cần quá khứ đơn: go → went.",
  },
  {
    id: "a2-v1",
    level: "A2",
    type: "vocab",
    skill: "vocab",
    prompt: "Chọn nghĩa gần nhất của 'deadline':",
    options: ["Hạn chót", "Lịch họp", "Người phản hồi"],
    answerIndex: 0,
    explainVi: "Deadline = hạn chót, thời điểm phải hoàn thành.",
  },
  {
    id: "a2-l1",
    level: "A2",
    type: "listening",
    skill: "listening",
    prompt: "Nghe và chọn giờ:",
    audioText: "The train leaves at quarter past nine.",
    options: ["9:15", "9:45", "8:45"],
    answerIndex: 0,
    explainVi: "Quarter past nine = 9:15.",
  },
  // ===== B1 =====
  {
    id: "b1-g1",
    level: "B1",
    type: "grammar",
    skill: "grammar",
    prompt: "Fix: 'I am agree with this plan.'",
    options: [
      "I agree with this plan.",
      "I am agreed this plan.",
      "I agreeing with this plan.",
    ],
    answerIndex: 0,
    explainVi: "'Agree' là động từ thường, không dùng to be trước nó.",
  },
  {
    id: "b1-n1",
    level: "B1",
    type: "natural",
    skill: "speaking",
    prompt: "Chọn câu trả lời tự nhiên: 'Can you give us a quick update?'",
    options: [
      "Sure. I finished the first part and I am checking the final details.",
      "Yes update quick now yesterday.",
      "I don't know all update.",
    ],
    answerIndex: 0,
    explainVi: "Câu A tự nhiên, đủ chủ ngữ-thì-thông tin. B sai cấu trúc, C cụt.",
  },
  {
    id: "b1-v1",
    level: "B1",
    type: "vocab",
    skill: "vocab",
    prompt: "Trong context: 'We need to follow up with the client.' — 'follow up' nghĩa là?",
    options: [
      "Liên hệ tiếp / theo dõi tiến độ",
      "Đi theo sau lưng khách",
      "Bỏ qua khách",
    ],
    answerIndex: 0,
    explainVi: "Follow up = theo sát, kiểm tra lại sau lần liên hệ trước.",
  },
  // ===== B2 =====
  {
    id: "b2-g1",
    level: "B2",
    type: "grammar",
    skill: "grammar",
    prompt: "If we ___ the deadline, the launch will be delayed.",
    options: ["miss", "missed", "had missed"],
    answerIndex: 0,
    explainVi: "Câu điều kiện loại 1: if + present, will + verb.",
  },
  {
    id: "b2-n1",
    level: "B2",
    type: "natural",
    skill: "speaking",
    prompt: "Email lịch sự cho khách: 'Thanks for your patience while we _____ this issue.'",
    options: ["look into", "see in", "watch on"],
    answerIndex: 0,
    explainVi: "Cụm 'look into' = xem xét, điều tra. Đây là chuẩn email công việc.",
  },
  {
    id: "b2-v1",
    level: "B2",
    type: "vocab",
    skill: "vocab",
    prompt: "'The proposal is contingent on budget approval.' — 'contingent on' nghĩa là?",
    options: ["Phụ thuộc vào", "Bao gồm cả", "Tách rời khỏi"],
    answerIndex: 0,
    explainVi: "Contingent on X = phụ thuộc vào X, chỉ xảy ra nếu X thỏa.",
  },
  // ===== C1 =====
  {
    id: "c1-g1",
    level: "C1",
    type: "grammar",
    skill: "grammar",
    prompt: "Chọn câu đúng nhất:",
    options: [
      "Had we known the risks, we would have postponed the launch.",
      "If we would know the risks, we postponed the launch.",
      "If we knew the risks before, we would postpone.",
    ],
    answerIndex: 0,
    explainVi: "Đảo ngữ điều kiện 3: Had + S + PII, S + would have + PII.",
  },
  {
    id: "c1-v1",
    level: "C1",
    type: "vocab",
    skill: "vocab",
    prompt: "'The findings corroborate our hypothesis.' — 'corroborate' đồng nghĩa với?",
    options: ["Củng cố / xác nhận", "Bác bỏ", "Trì hoãn"],
    answerIndex: 0,
    explainVi: "Corroborate = củng cố bằng bằng chứng, xác nhận giả thuyết.",
  },
  // ===== C2 =====
  {
    id: "c2-g1",
    level: "C2",
    type: "grammar",
    skill: "grammar",
    prompt: "Chọn câu chuẩn academic:",
    options: [
      "Not only did the policy backfire, but it also alienated key stakeholders.",
      "Not only the policy backfire but also alienating stakeholders.",
      "The policy not only backfired and also alienate stakeholders.",
    ],
    answerIndex: 0,
    explainVi: "'Not only ... but also' kèm đảo ngữ trợ động từ ở vế đầu.",
  },
  {
    id: "c2-v1",
    level: "C2",
    type: "vocab",
    skill: "vocab",
    prompt: "'His remarks were rather equivocal.' — 'equivocal' nghĩa là?",
    options: ["Mập mờ, đa nghĩa", "Rõ ràng, dứt khoát", "Hài hước, thân mật"],
    answerIndex: 0,
    explainVi: "Equivocal = mơ hồ, có thể hiểu theo nhiều cách (thường có chủ ý).",
  },
];

/** Pick a random question of the given level, excluding ones already shown. */
export function pickQuestion(
  level: CEFRLevel,
  excludeIds: string[]
): PlacementQuestion | null {
  const pool = QUESTIONS.filter(
    (q) => q.level === level && !excludeIds.includes(q.id)
  );
  if (pool.length === 0) {
    // fallback: take any unseen question close in level
    const idx = ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(level);
    for (let offset = 1; offset < 6; offset++) {
      for (const sign of [-1, 1]) {
        const tryIdx = idx + sign * offset;
        if (tryIdx < 0 || tryIdx > 5) continue;
        const nearby = QUESTIONS.filter(
          (q) =>
            q.level === (["A1", "A2", "B1", "B2", "C1", "C2"][tryIdx] as CEFRLevel) &&
            !excludeIds.includes(q.id)
        );
        if (nearby.length) return nearby[Math.floor(Math.random() * nearby.length)];
      }
    }
    return null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
