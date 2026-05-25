import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const clips = await prisma.shadowingClip.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(clips);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const clip = await prisma.shadowingClip.create({
      data: {
        youtubeId: data.youtubeId,
        title: data.title,
        durationSec: data.durationSec,
        cefrEstimate: data.cefrEstimate || "A2",
        topics: data.topics || [],
        segments: data.segments,
      }
    });
    return NextResponse.json(clip);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.shadowingClip.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
