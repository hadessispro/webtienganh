import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.playlistId || !data.clipId) {
      return NextResponse.json({ error: "Missing playlistId or clipId" }, { status: 400 });
    }
    
    // Check if already exists
    const existing = await prisma.shadowingPlaylistClip.findUnique({
      where: {
        playlistId_clipId: {
          playlistId: data.playlistId,
          clipId: data.clipId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Clip already in playlist" }, { status: 400 });
    }

    // Get current max order
    const maxOrder = await prisma.shadowingPlaylistClip.findFirst({
      where: { playlistId: data.playlistId },
      orderBy: { order: 'desc' }
    });

    const newOrder = maxOrder ? maxOrder.order + 1 : 0;

    const item = await prisma.shadowingPlaylistClip.create({
      data: {
        playlistId: data.playlistId,
        clipId: data.clipId,
        order: newOrder
      }
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get('playlistId');
    const clipId = searchParams.get('clipId');
    
    if (!playlistId || !clipId) {
      return NextResponse.json({ error: "Missing IDs" }, { status: 400 });
    }

    await prisma.shadowingPlaylistClip.delete({
      where: { 
        playlistId_clipId: {
          playlistId,
          clipId
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
