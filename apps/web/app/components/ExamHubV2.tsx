"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export function ExamHubV2() {
  const [activeCategory, setActiveCategory] = useState("ielts");

  // Mock data for UI presentation
  const categories = [
    { id: "ielts", name: "IELTS Academic" },
    { id: "toeic", name: "TOEIC Listening & Reading" },
    { id: "cambridge", name: "Cambridge PET/KET" },
    { id: "vstep", name: "VSTEP (A1-C1)" }
  ];

  const mockExams = [
    { id: "cam-18-test-1", title: "Cambridge IELTS 18 - Test 1", questions: 40, time: 60, type: "Listening" },
    { id: "cam-18-test-2", title: "Cambridge IELTS 18 - Test 2", questions: 40, time: 60, type: "Reading" },
    { id: "cam-17-test-1", title: "Cambridge IELTS 17 - Test 1", questions: 40, time: 60, type: "Listening" },
    { id: "cam-16-test-1", title: "Cambridge IELTS 16 - Test 1", questions: 40, time: 60, type: "Listening" },
  ];

  return (
    <div className="ll-exams-v2 p-6 h-full flex flex-col gap-6" style={{ background: "var(--bg-secondary)", borderRadius: "1.5rem" }}>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Thư viện Đề thi</h1>
        <p style={{ color: "var(--text-secondary)" }}>Hàng ngàn đề thi thật được số hóa. Làm bài với giao diện chuẩn như thi máy tính.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[rgba(0,0,0,0.05)] pb-2 overflow-x-auto no-scrollbar">
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-all ${
              activeCategory === c.id 
                ? "border-b-2 border-emerald-500 text-emerald-700" 
                : "text-[rgba(0,0,0,0.5)] hover:text-emerald-600"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Hero Banner for selected category */}
      <div className="relative rounded-2xl overflow-hidden bg-emerald-900 p-8 flex items-center justify-between shadow-lg">
        <div className="z-10 text-white max-w-lg">
          <h2 className="text-2xl font-bold mb-2">Sẵn sàng chinh phục {categories.find(c => c.id === activeCategory)?.name}?</h2>
          <p className="opacity-80 mb-6">Trải nghiệm môi trường thi thật với tính năng tính giờ, tự động chấm điểm và giải thích đáp án bằng AI.</p>
          <button className="bg-white text-emerald-900 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-50 transition-colors">
            Vào phòng thi ngay
          </button>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500 to-transparent opacity-50 pointer-events-none" />
      </div>

      {/* Grid of exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {mockExams.map(exam => (
          <motion.div 
            key={exam.id}
            whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
            className="bg-white p-5 rounded-xl border border-[rgba(0,0,0,0.05)] flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">
                  {exam.type}
                </span>
                <span className="text-xs font-medium text-[rgba(0,0,0,0.4)]">
                  {exam.time} phút
                </span>
              </div>
              <h3 className="font-bold text-lg mb-1 leading-tight" style={{ color: "var(--text-primary)" }}>
                {exam.title}
              </h3>
              <p className="text-sm text-[rgba(0,0,0,0.5)]">{exam.questions} câu hỏi</p>
            </div>
            
            <div className="mt-6">
              <button className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-lg font-medium hover:bg-emerald-100 transition-colors">
                Làm bài
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
