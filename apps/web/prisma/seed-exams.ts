import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Exam Data...");

  // 1. Create Category
  const toeicCategory = await prisma.examCategory.upsert({
    where: { slug: "toeic" },
    update: {},
    create: {
      slug: "toeic",
      name: "TOEIC Listening & Reading",
      description: "Đề thi thử TOEIC chuẩn format mới",
      order: 1
    }
  });

  // 2. Create Exam
  const exam = await prisma.exam.create({
    data: {
      id: "toeic-test-1",
      title: "TOEIC Mini Test 1",
      description: "Bài test rút gọn đánh giá trình độ TOEIC",
      categoryId: toeicCategory.id,
      durationMin: 30,
      isPublished: true,
      
      // 3. Create Parts
      parts: {
        create: [
          {
            title: "Part 5: Incomplete Sentences",
            order: 1,
            content: "Choose the word that best completes the sentence.",
            questions: {
              create: [
                {
                  order: 1,
                  type: "multiple_choice",
                  question: "The new software update will be ______ to all users by next Friday.",
                  options: ["available", "availably", "availability", "avails"],
                  answer: "available",
                  explanation: "Cần một tính từ đứng sau to be. 'available' (có sẵn) là phù hợp nhất."
                },
                {
                  order: 2,
                  type: "multiple_choice",
                  question: "Employees are required to ______ their identification badges at all times.",
                  options: ["wear", "wears", "wearing", "wore"],
                  answer: "wear",
                  explanation: "Sau 'required to' cần động từ nguyên thể."
                }
              ]
            }
          },
          {
            title: "Part 7: Reading Comprehension",
            order: 2,
            content: "Questions 3-4 refer to the following email:\n\nTo: All Staff\nFrom: HR Department\nSubject: Office Renovation\n\nPlease be advised that the main lobby will be closed for renovations starting next Monday. All employees must use the rear entrance until further notice. The project is expected to take three weeks to complete.\n\nThank you for your cooperation.",
            questions: {
              create: [
                {
                  order: 3,
                  type: "multiple_choice",
                  question: "Why will the main lobby be closed?",
                  options: ["For a private event", "For renovations", "For cleaning", "For a staff meeting"],
                  answer: "For renovations",
                  explanation: "Email có ghi: 'the main lobby will be closed for renovations'."
                },
                {
                  order: 4,
                  type: "multiple_choice",
                  question: "How long is the project expected to last?",
                  options: ["One week", "Two weeks", "Three weeks", "Four weeks"],
                  answer: "Three weeks",
                  explanation: "Email ghi rõ: 'expected to take three weeks to complete'."
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log("Seeding complete! Exam ID:", exam.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
