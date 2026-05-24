import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
    // Search for short learning videos
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.append("part", "snippet");
    url.searchParams.append("q", q);
    url.searchParams.append("type", "video");
    url.searchParams.append("videoDuration", "short");
    url.searchParams.append("videoCaption", "closedCaption");
    url.searchParams.append("maxResults", "10");
    url.searchParams.append("key", apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    
    return NextResponse.json(data.items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
