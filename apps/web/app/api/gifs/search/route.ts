import { NextResponse } from "next/server";

type GifOption = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width?: number;
  height?: number;
  source: "giphy" | "fallback";
};

type GiphyImage = {
  height?: string;
  url?: string;
  width?: string;
};

type GiphyResult = {
  alt_text?: string;
  id?: string;
  images?: {
    downsized?: GiphyImage;
    fixed_width?: GiphyImage;
    fixed_width_small?: GiphyImage;
    original?: GiphyImage;
    preview_gif?: GiphyImage;
  };
  title?: string;
};

const FALLBACK_GIF =
  "data:image/gif;base64,R0lGODlhEAAQAPIAAP8AAP///wAAAP8A/wD/AP//AAAAACH5BAAAAAAALAAAAAAQABAAAAM6SLrc/jDKSau9OOvNu/9gKI5kaZ5oqq5s675wLM90bd94ru987//AoHBILBqPyKRyyWw6n9BoAAA7";

const fallbackTitles = [
  "Study sparkle",
  "Mochi focus",
  "Coffee review",
  "Tiny celebration",
  "Vocabulary mood",
  "Good job loop"
];

function fallbackResults(limit: number): GifOption[] {
  return fallbackTitles.slice(0, limit).map((title, index) => ({
    id: `fallback-${index + 1}`,
    previewUrl: FALLBACK_GIF,
    source: "fallback",
    title,
    url: FALLBACK_GIF,
    width: 16,
    height: 16
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "study cat";
  const limit = Math.min(18, Math.max(6, Number(searchParams.get("limit") ?? 12) || 12));
  const apiKey = process.env.GIPHY_API_KEY || process.env.NEXT_PUBLIC_GIPHY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      message: "Chưa cấu hình GIPHY_API_KEY nên đang dùng GIF fallback để test UI.",
      results: fallbackResults(limit),
      source: "fallback"
    });
  }

  const endpoint = new URL("https://api.giphy.com/v1/gifs/search");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("api_key", apiKey);
  endpoint.searchParams.set("limit", String(limit));
  endpoint.searchParams.set("offset", "0");
  endpoint.searchParams.set("rating", "pg");
  endpoint.searchParams.set("lang", "vi");
  endpoint.searchParams.set("bundle", "messaging_non_clips");

  try {
    const response = await fetch(endpoint, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`GIPHY returned ${response.status}`);
    }

    const payload = (await response.json()) as { data?: GiphyResult[]; meta?: { status?: number } };
    const results = (payload.data ?? [])
      .map((item): GifOption | null => {
        const original = item.images?.original;
        const downsized = item.images?.downsized;
        const fixedWidth = item.images?.fixed_width;
        const fixedSmall = item.images?.fixed_width_small;
        const preview = item.images?.preview_gif;
        const url = fixedWidth?.url ?? downsized?.url ?? original?.url ?? fixedSmall?.url ?? preview?.url;
        const previewUrl = fixedSmall?.url ?? preview?.url ?? fixedWidth?.url ?? url;

        if (!url || !previewUrl) {
          return null;
        }

        const width = Number(fixedWidth?.width ?? downsized?.width ?? original?.width ?? fixedSmall?.width);
        const height = Number(fixedWidth?.height ?? downsized?.height ?? original?.height ?? fixedSmall?.height);

        return {
          id: item.id ?? url,
          previewUrl,
          source: "giphy",
          title: item.alt_text || item.title || query,
          url,
          width: Number.isFinite(width) ? width : undefined,
          height: Number.isFinite(height) ? height : undefined
        };
      })
      .filter((item): item is GifOption => Boolean(item));

    if (!results.length) {
      return NextResponse.json({
        message: "GIPHY không trả GIF phù hợp, đang dùng fallback.",
        results: fallbackResults(limit),
        source: "fallback"
      });
    }

    return NextResponse.json({ results, source: "giphy" });
  } catch {
    return NextResponse.json({
      message: "Không gọi được GIPHY lúc này, đang dùng fallback.",
      results: fallbackResults(limit),
      source: "fallback"
    });
  }
}
