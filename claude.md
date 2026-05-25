# Báo cáo tiến độ PR-G: Vocab APIs & YouTube Shadowing

Chào Claude, dưới đây là chi tiết các hạng mục tôi đã hoàn thiện cho tính năng Vocab APIs & YouTube Shadowing theo thiết kế:

## 1. Vocab APIs (Server-side)
Đã chuyển đổi cấu trúc gọi API tra từ điển (Free Dictionary API) từ Client sang Server-side để bảo mật và tránh lỗi CORS.
- File xử lý adapter: `apps/web/lib/vocab/sources.ts`.
- File Route Handler: `apps/web/app/api/vocab/[word]/route.ts` (Sử dụng Cache In-memory tạm thời, chuẩn bị cấu trúc cho Upstash Redis sau này).
- Đã sửa lỗi Type cho params của Route Handler theo chuẩn Next.js 14+ (`Promise<{ word: string }>`).

## 2. Tính năng Shadowing (Luyện đọc nhại Youtube)
Hệ thống kết nối trực tiếp Youtube Data API v3 để cào subtitle và so sánh với Web Speech API.
- **YouTube API Integration:** 
  - `api/youtube/search/route.ts` để tìm kiếm video.
  - `api/youtube/transcript/route.ts` sử dụng `youtube-transcript` để phân tích phụ đề và cắt nhỏ các câu nói.
- **Scoring System:** 
  - `apps/web/app/lib/shadow-score.ts` tích hợp `string-similarity` để tính điểm Levenshtein Distance (Độ chính xác và Độ trôi chảy).
- **UI Components:**
  - `ShadowingPlayer.tsx`: Component chứa Video Player, Micro thu âm và Waveform UI.
  - `ShadowingView.tsx`: Trang tổng quan để duyệt và chọn bài học Shadowing.
  - Đã tích hợp trực tiếp vào `LumaUserDashboard.tsx`.

## 3. Quá trình Fix Lỗi
- **Prisma Monorepo Bug:** Fix lỗi `@prisma/client` không được resolve trong Edge Runtime bằng cách ép sinh client từ root (`npx prisma generate --schema=./apps/web/prisma/schema.prisma`).
- **NextAuth Untrusted Host & Edge Issue:** Tách `auth.config.ts` để chặn PrismaAdapter khỏi việc bị bundle vào Edge Middleware, và đặt `trustHost: true` để vượt qua lỗi ở port không mặc định (3001).
- **Vanilla CSS Auth UI:** Đã thay thế Tailwind CSS trong trang Đăng nhập (`/auth`) bằng UI Tokens thuần (Glassmorphism, CSS Variable) để khớp hoàn toàn với Design System.
- **Prisma Upsert bug**: Sửa lỗi payload truyền vào `prisma.placementProfile.upsert` không đúng cấu trúc (thiếu các object properties bắt buộc) do dùng lồng nested `data: data`.

## Trạng thái
- Mọi thứ đã hoạt động mượt mà và fix xong các lỗi Edge Cases.
- System sẵn sàng để Claude review!
