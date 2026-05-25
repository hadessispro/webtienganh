"use client";

import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import type { LearnerProfile } from "../lib/product-data";

export function ExamHubV2({ profile, onStartExam }: { profile: LearnerProfile, onStartExam: (id: string) => void }) {
  const [activeCategory, setActiveCategory] = useState(() => {
    if (profile.goal === "work") return "toeic";
    if (profile.goal === "foundation") return "vstep";
    return "ielts"; // exam
  });

  // Mock data for UI presentation
  const allCategories = [
    { id: "ielts", name: "IELTS Academic", goals: ["exam"] },
    { id: "toeic", name: "TOEIC Listening & Reading", goals: ["work", "exam"] },
    { id: "cambridge", name: "Cambridge PET/KET", goals: ["foundation", "exam"] },
    { id: "vstep", name: "VSTEP (A1-C1)", goals: ["foundation", "work"] }
  ];

  // Lọc bớt các đề không phù hợp nếu là work/foundation để đỡ ngợp.
  // Nếu là exam thì show hết hoặc những cái dành riêng cho exam.
  const categories = useMemo(() => {
    return allCategories.filter(c => c.goals.includes(profile.goal) || profile.goal === "exam");
  }, [profile.goal]);

  // Nếu tab hiện tại bị filter mất thì fallback
  if (!categories.find(c => c.id === activeCategory)) {
    setActiveCategory(categories[0]?.id || "ielts");
  }

  const mockExams = [
    { id: "cam-18-test-1", title: "Cambridge IELTS 18 - Test 1", questions: 40, time: 60, type: "Listening" },
    { id: "cam-18-test-2", title: "Cambridge IELTS 18 - Test 2", questions: 40, time: 60, type: "Reading" },
    { id: "cam-17-test-1", title: "Cambridge IELTS 17 - Test 1", questions: 40, time: 60, type: "Listening" },
    { id: "cam-16-test-1", title: "Cambridge IELTS 16 - Test 1", questions: 40, time: 60, type: "Listening" },
  ];

  return (
    <div className="ll-page" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>Thư viện Đề thi</h1>
        <p style={{ color: "var(--text-secondary)", margin: 0 }}>Hàng ngàn đề thi thật được số hóa. Làm bài với giao diện chuẩn như thi máy tính.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "16px", borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: "8px", overflowX: "auto" }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            style={{
              background: "none",
              border: "none",
              padding: "8px 16px",
              fontWeight: "600",
              cursor: "pointer",
              borderBottom: activeCategory === c.id ? "2px solid #10b981" : "2px solid transparent",
              color: activeCategory === c.id ? "#047857" : "var(--text-secondary)",
              transition: "all 0.2s"
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Hero Banner for selected category */}
      <div style={{ 
        position: "relative", borderRadius: "16px", overflow: "hidden", 
        background: "#064e3b", padding: "32px", display: "flex", 
        alignItems: "center", justifyContent: "space-between", color: "white" 
      }}>
        <div style={{ zIndex: 10, maxWidth: "500px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", marginTop: 0 }}>Sẵn sàng chinh phục {categories.find(c => c.id === activeCategory)?.name}?</h2>
          <p style={{ opacity: 0.8, marginBottom: "24px" }}>Trải nghiệm môi trường thi thật với tính năng tính giờ, tự động chấm điểm và giải thích đáp án bằng AI.</p>
          <button style={{ 
            background: "white", color: "#064e3b", padding: "12px 24px", 
            borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer" 
          }}>
            Vào phòng thi ngay
          </button>
        </div>
      </div>

      {/* Grid of exams */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {mockExams.map(exam => (
          <motion.div 
            key={exam.id}
            whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
            style={{ 
              background: "white", padding: "20px", borderRadius: "12px", 
              border: "1px solid rgba(0,0,0,0.05)", display: "flex", 
              flexDirection: "column", justifyContent: "space-between", cursor: "pointer" 
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", padding: "4px 8px", background: "#d1fae5", color: "#047857", borderRadius: "4px" }}>
                  {exam.type}
                </span>
                <span style={{ fontSize: "12px", fontWeight: "500", color: "var(--text-secondary)" }}>
                  {exam.time} phút
                </span>
              </div>
              <h3 style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px", color: "var(--text-primary)", marginTop: 0 }}>
                {exam.title}
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0 }}>{exam.questions} câu hỏi</p>
            </div>
            
            <div style={{ marginTop: "24px" }}>
              <button 
                onClick={() => onStartExam(exam.id)}
                style={{ 
                  width: "100%", padding: "10px", background: "#ecfdf5", 
                  color: "#059669", borderRadius: "8px", fontWeight: "600", 
                  border: "none", cursor: "pointer" 
                }}
              >
                Làm bài
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
