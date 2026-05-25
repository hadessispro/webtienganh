/**
 * Path: apps/web/app/api/study-sessions/route.ts
 *
 * GET  /api/study-sessions?limit=8  — list user's recent study sessions
 *                                       (returns [] for non-authed users)
 * POST /api/study-sessions          — record a completed session
 *
 * Payload for POST:
 *   {
 *     totalSkills: number,
 *     correctCount: number,
 *     wrongCount: number,
 *     attempts: Array<{ skillId, correct, elapsedMs, qualityScore? }>,
 *     primaryType?: string,
 *     durationMs?: number
 *   }
 *
 * Used by PracticeViewV2 for "Đề gần đây" and metric calculation.
 */

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  // Not logged in → return empty array (PracticeViewV2 gracefully handles)
  if (!session?.user?.id) return NextResponse.json([]);

  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "8");
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitParam) ? limitParam : 8));

  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    // Derive primaryType from attempts JSON
    const out = sessions.map((s: any) => {
      let primaryType: string | undefined;
      try {
        const attempts = Array.isArray(s.attempts) ? s.attempts : [];
        const typeCounts: Record<string, number> = {};
        for (const a of attempts) {
          if (a?.type) typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1;
        }
        primaryType = Object.entries(typeCounts).sort(
          ([, a], [, b]) => b - a,
        )[0]?.[0];
      } catch {
        // ignore
      }
      return {
        id: s.id,
        startedAt: s.startedAt,
        finishedAt: s.finishedAt,
        totalSkills: s.totalSkills,
        correctCount: s.correctCount,
        wrongCount: s.wrongCount,
        primaryType,
      };
    });

    return NextResponse.json(out);
  } catch (e) {
    console.warn("[study-sessions] GET failed:", e);
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const totalSkills = Number(body.totalSkills);
  const correctCount = Number(body.correctCount ?? 0);
  const wrongCount = Number(body.wrongCount ?? 0);

  if (!Number.isFinite(totalSkills) || totalSkills < 1) {
    return NextResponse.json(
      { error: "totalSkills required" },
      { status: 400 },
    );
  }

  try {
    const created = await prisma.studySession.create({
      data: {
        userId: session.user.id,
        startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
        finishedAt: new Date(),
        durationMs: Number.isFinite(body.durationMs)
          ? Number(body.durationMs)
          : null,
        totalSkills,
        correctCount,
        wrongCount,
        attempts: Array.isArray(body.attempts) ? body.attempts : [],
      },
    });

    return NextResponse.json({ id: created.id });
  } catch (e) {
    console.warn("[study-sessions] POST failed:", e);
    return NextResponse.json(
      { error: "Could not save session" },
      { status: 500 },
    );
  }
}
