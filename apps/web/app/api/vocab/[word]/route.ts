import { NextResponse } from "next/server";
import { lookupFreeDictionary, lookupDatamuse } from "@/lib/vocab/sources";

// Simple in-memory cache for MVP. Upstash Redis would be better.
const cache = new Map<string, any>();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ word: string }> }
) {
  const { word: rawWord } = await params;
  const word = rawWord.toLowerCase();
  
  if (cache.has(word)) {
    return NextResponse.json(cache.get(word));
  }
  
  // 1. Try Free Dictionary
  let result = await lookupFreeDictionary(word);
  
  // 2. Fallback to Datamuse
  if (!result) {
    result = await lookupDatamuse(word);
  }
  
  if (!result) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  // 3. Translate the first definition to Vietnamese using DeepSeek if available
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey && result.definitions.length > 0) {
    try {
      const englishDef = result.definitions[0].definition;
      const aiRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "Dịch định nghĩa tiếng Anh sau sang tiếng Việt thật tự nhiên và ngắn gọn (chỉ trả về chuỗi tiếng Việt, KHÔNG giải thích thêm, KHÔNG có ngoặc kép):"
            },
            { role: "user", content: englishDef }
          ],
          temperature: 0.3
        }),
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const translated = aiData.choices?.[0]?.message?.content;
        if (translated) {
          result.definitions[0].definition = translated.trim();
        }
      }
    } catch (e) {
      console.error("DeepSeek translation error:", e);
    }
  }
  
  cache.set(word, result);
  return NextResponse.json(result);
}
