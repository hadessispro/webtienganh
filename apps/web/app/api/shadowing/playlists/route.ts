import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const playlists = await prisma.shadowingPlaylist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        clips: {
          include: { clip: true },
          orderBy: { order: 'asc' }
        }
      }
    });
    return NextResponse.json(playlists);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.title) {
      return NextResponse.json({ error: "Missing title" }, { status: 400 });
    }
    const playlist = await prisma.shadowingPlaylist.create({
      data: {
        title: data.title,
      },
      include: { clips: true }
    });
    return NextResponse.json(playlist);
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

    await prisma.shadowingPlaylist.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
