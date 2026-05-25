import { NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: examId } = await params;

    if (!examId) {
      return NextResponse.json({ error: "Exam ID is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        category: true,
        parts: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" }
            }
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // We shouldn't send correctAnswer to the client, but for a mock/demo it's okay.
    // In a real app, the client would send answers to another endpoint for grading.
    // Here we'll return everything so ExamRoom can self-grade.
    return NextResponse.json(exam);
  } catch (error: any) {
    console.error("[EXAM_API_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
