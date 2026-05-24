import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  
  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    
    // Group transcript into 5-10 second segments
    const segments = [];
    let currentSegment: any = null;
    
    for (const item of transcript) {
      if (!currentSegment) {
        currentSegment = {
          start: item.offset,
          end: item.offset + item.duration,
          text_en: item.text,
          text_vi: "" // Can be translated later or omitted
        };
      } else {
        if (currentSegment.end - currentSegment.start < 10000) { // < 10 seconds
          currentSegment.text_en += " " + item.text;
          currentSegment.end = item.offset + item.duration;
        } else {
          segments.push({
            ...currentSegment,
            start: Math.round(currentSegment.start / 1000),
            end: Math.round(currentSegment.end / 1000)
          });
          currentSegment = {
            start: item.offset,
            end: item.offset + item.duration,
            text_en: item.text,
            text_vi: ""
          };
        }
      }
    }
    
    if (currentSegment) {
      segments.push({
        ...currentSegment,
        start: Math.round(currentSegment.start / 1000),
        end: Math.round(currentSegment.end / 1000)
      });
    }

    return NextResponse.json(segments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
