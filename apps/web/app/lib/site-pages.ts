export type SitePageKey = "pricing" | "about" | "contact" | "blog" | "learn" | "admin";

export type SitePageContent = {
  eyebrow: string;
  title: string;
  lead: string;
  primaryAction: string;
  secondaryAction: string;
  cards: Array<{
    kicker: string;
    title: string;
    body: string;
  }>;
};

export const sitePages: Record<SitePageKey, SitePageContent> = {
  pricing: {
    eyebrow: "Pricing",
    title: "Token-conscious plans for calm learning.",
    lead:
      "Free học nền tảng, trả phí cho voice AI, shadowing nâng cao, nhóm học có mentor và báo cáo tiến bộ dài hạn.",
    primaryAction: "Chọn gói học",
    secondaryAction: "Xem giới hạn AI",
    cards: [
      {
        kicker: "Free",
        title: "Starter Garden",
        body: "Lộ trình cá nhân, SRS, question bank mẫu và 4 lượt AI tutor mỗi ngày."
      },
      {
        kicker: "Pro",
        title: "Deep Practice",
        body: "Voice AI, roleplay dài, shadowing library đầy đủ, lịch học thông minh và lưu transcript."
      },
      {
        kicker: "Team",
        title: "Learning Studio",
        body: "Nhóm học, ranking riêng, quản lý cohort, dashboard giáo viên và báo cáo tiến bộ."
      }
    ]
  },
  about: {
    eyebrow: "About",
    title: "A language platform built like a quiet studio.",
    lead:
      "LumaLang không cố biến học tập thành áp lực. Sản phẩm ưu tiên nhịp học vừa đủ, cảm giác thư giãn và feedback có tình người.",
    primaryAction: "Triết lý sản phẩm",
    secondaryAction: "Xem lộ trình",
    cards: [
      {
        kicker: "01",
        title: "Personal rhythm",
        body: "Mỗi người có một nhịp học khác nhau. Lộ trình phải thích nghi, không ép khuôn."
      },
      {
        kicker: "02",
        title: "Less noise",
        body: "AI được dùng có quota và bối cảnh rõ, tránh đốt token vô thức hoặc sinh nội dung thiếu kiểm soát."
      },
      {
        kicker: "03",
        title: "Beautiful focus",
        body: "Giao diện phải khiến người học muốn quay lại vì cảm thấy nhẹ đầu, không vì bị kéo streak."
      }
    ]
  },
  contact: {
    eyebrow: "Reach Us",
    title: "Tell us the learning space you want to build.",
    lead:
      "Dùng trang này cho waitlist, đối tác nội dung shadowing, giáo viên, trường học hoặc user test định kỳ.",
    primaryAction: "Gửi lời nhắn",
    secondaryAction: "Đặt lịch demo",
    cards: [
      {
        kicker: "User testing",
        title: "Test cohort",
        body: "Mời người học thật vào thử lộ trình, shadowing, âm thanh tập trung và AI tutor quota."
      },
      {
        kicker: "Content",
        title: "Shadowing source",
        body: "Hợp tác clip có bản quyền cho tiếng Anh, Nhật, Hàn với transcript và rubric."
      },
      {
        kicker: "School",
        title: "Classroom pilot",
        body: "Thiết kế cohort học nhóm, dashboard giáo viên và kiểm soát chất lượng question bank."
      }
    ]
  },
  blog: {
    eyebrow: "Journal",
    title: "No-fluff notes on language, AI, and quiet product design.",
    lead:
      "Blog dùng ngôn ngữ glass lesson như file HTML tham khảo: bài học dài, progress đọc, tag, lesson card và code/notes rõ ràng.",
    primaryAction: "Đọc bài mới",
    secondaryAction: "Xem lesson format",
    cards: [
      {
        kicker: "Lesson",
        title: "Lesson glassmode structure",
        body: "Bố cục bài giảng có progress, meta, callout, checklist và code block như thiết kế bạn gửi."
      },
      {
        kicker: "AI Cost",
        title: "How to avoid burning tokens",
        body: "Cách chia free/pro voice AI, cache feedback, template roleplay và question bank có kiểm duyệt."
      },
      {
        kicker: "Shadowing",
        title: "Build a legal clip library",
        body: "Nguồn clip tự sản xuất, CC/license, transcript song ngữ và rubric luyện phát âm."
      }
    ]
  },
  learn: {
    eyebrow: "User Studio",
    title: "Your daily learning room.",
    lead:
      "Trang học cho user: hôm nay học gì, lịch, cây tri thức, shadowing, nhóm học, âm thanh tập trung và AI tutor.",
    primaryAction: "Bắt đầu buổi học",
    secondaryAction: "Xem tiến độ",
    cards: [
      {
        kicker: "Today",
        title: "10-minute session",
        body: "Task vừa đủ, lưu trạng thái, quay lại đúng chỗ đang học."
      },
      {
        kicker: "Voice",
        title: "AI roleplay with quota",
        body: "Roleplay theo kịch bản, sửa lỗi tự nhiên, giới hạn lượt để tối ưu chi phí."
      },
      {
        kicker: "Group",
        title: "Study circle",
        body: "Ghép nhóm theo level, mục tiêu, timezone và nhịp học."
      }
    ]
  },
  admin: {
    eyebrow: "Admin",
    title: "Operate the learning system without chaos.",
    lead:
      "Trang quản trị cho question bank, shadowing source, gói trả phí, user cohort, AI quota và báo cáo chất lượng.",
    primaryAction: "Mở dashboard",
    secondaryAction: "Xem schema",
    cards: [
      {
        kicker: "Content ops",
        title: "Question bank",
        body: "Quản lý blueprint, rubric, độ khó, trạng thái duyệt và lịch review câu hỏi."
      },
      {
        kicker: "AI ops",
        title: "Quota control",
        body: "Theo dõi lượt AI, loại request, cache feedback và cảnh báo chi phí."
      },
      {
        kicker: "Learning ops",
        title: "Cohort dashboard",
        body: "Theo dõi nhóm học, retention, hoàn thành task và điểm yếu phổ biến."
      }
    ]
  }
};
