import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const attempt = await prisma.shadowingAttempt.create({
      data: {
        userId: session.user.id,
        clipId: data.clipId,
        segmentIdx: data.segmentIdx,
        scoreJson: data.scoreJson,
      }
    });
    return NextResponse.json(attempt);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
