import { NextResponse } from "next/server";

// Cache in memory for MVP. In production, this should be Redis or PostgreSQL.
const cache = new Map<string, any>();

export async function POST(req: Request) {
  try {
    const { text, videoId } = await req.json();
    if (!text || !videoId) {
      return NextResponse.json({ error: "Missing text or videoId" }, { status: 400 });
    }

    if (cache.has(videoId)) {
      return NextResponse.json(cache.get(videoId));
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing DeepSeek API Key" }, { status: 500 });
    }

    const systemPrompt = `Bạn là một chuyên gia phân tích ngôn ngữ tiếng Anh. 
Nhiệm vụ của bạn là đọc đoạn hội thoại (transcript) được cung cấp và trích xuất ra các CỤM TỪ (Phrasal verbs/Idioms) và NGỮ PHÁP (Grammar structures) nổi bật nhất trong bài.
BẠN BẮT BUỘC PHẢI TRẢ VỀ CHUẨN JSON THEO FORMAT SAU (không chứa text thừa, không bọc trong markdown tick):
{
  "phrases": [
    { "phrase": "turn out", "definition_vi": "hóa ra là", "context_en": "It turned out that we were neighbors" }
  ],
  "grammar": [
    { "structure": "Present Perfect", "explanation_vi": "Dùng để diễn tả hành động bắt đầu trong quá khứ và còn tiếp tục đến hiện tại (We've known each other)" }
  ]
}
Giới hạn: Tìm TỐI ĐA 5 cụm từ và TỐI ĐA 3 cấu trúc ngữ pháp. Nếu bài quá ngắn và không có, hãy trả về mảng rỗng.`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[deepseek error]", errorText);
      return NextResponse.json({ error: "Failed to fetch from DeepSeek" }, { status: response.status });
    }

    const data = await response.json();
    let resultContent = data.choices[0].message.content;
    
    // Safety fallback in case DeepSeek returns markdown block despite json_object format
    if (resultContent.startsWith('```json')) {
      resultContent = resultContent.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    
    const parsed = JSON.parse(resultContent);
    
    // Save to cache
    cache.set(videoId, parsed);
    
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[ai-analyze error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
