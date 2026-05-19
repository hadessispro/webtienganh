# Ke hoach trien khai nen tang hoc ngon ngu AI

## 1. Dinh huong san pham

Muc tieu giai doan dau khong phai la lam mot Duolingo day du, ma la tao mot nen tang hoc ngon ngu co the test voi user hang tuan:

- Hoc nhanh trong 5-10 phut moi phien.
- Co lo trinh ca nhan hoa vua du, khong qua phuc tap.
- Co hoi thoai AI nhung kiem soat token chat.
- Co phat am/voice o muc MVP bang API mien phi cua trinh duyet truoc.
- Co thu phi ro rang cho cac tinh nang ton chi phi that: AI chat dai, voice AI nang cao, cham phat am sau.

Nhom user nen chon truoc:

- Uu tien 1: Nguoi Viet di lam muon hoc tieng Anh giao tiep cong viec.
- Uu tien 2: Nguoi hoc IELTS/TOEIC can luyen noi, tu vung, phan xa.
- Cap ngon ngu dau: Viet - Anh.

Website nen duoc dinh hinh la **nen tang hoc ngon ngu ca nhan hoa**, khong chi la web bai tap. Ba truc san pham can ro ngay tu dau:

- Muc tieu hoc: hoc de thi, hoc de giao tiep cong viec, hoc de bo tuc kien thuc.
- Cach hoc: lo trinh ca nhan, lich hoc, bai hoc ngan, on tap, shadowing, de luyen.
- Dong luc: ban hoc, nhom hoc, thu hang, streak, feedback tien bo.

Khong nen dinh vi la "app AI chat" vi se dot token va kho giu chan. AI chi nen la lop gia su/thich nghi nam tren mot he thong hoc co cau truc.

## 1.1. Ba che do hoc chinh

### Hoc de thi

Phu hop IELTS, TOEIC, JLPT, TOPIK hoac cac bai kiem tra noi bo sau nay.

Tinh nang can co:

- Placement test dau vao.
- Lo trinh theo muc tieu diem va deadline.
- Ngan hang cau hoi theo ky nang: nghe, doc, tu vung, ngu phap, noi, viet.
- De ngau nhien theo blueprint, khong tao cau hoi hoan toan tu AI o MVP.
- Cham diem, giai thich dap an, lich on diem yeu.
- Mock test co gioi han thoi gian.

Rui ro:

- Tao de ngau nhien de sai dap an rat de xay ra neu dung AI thuan.
- Can item bank co kiem duyet, metadata ro, va generator chi boc/tron cau hoi theo rule.

### Hoc de giao tiep cong viec

Day la nhom nen uu tien cho MVP vi co gia tri ro va hop voi AI tutor.

Tinh nang can co:

- Scenario theo cong viec: meeting, email, phong van, thuyet trinh, customer support, daily standup.
- AI roleplay co gioi han luot mien phi.
- Mau cau/cum tu theo ngu canh.
- Speaking practice bang Web Speech API truoc.
- Feedback ngan: noi tu nhien hon, sua loi ngu phap, goi y cau thay the.
- Lesson 5-10 phut, co the hoc tren dien thoai.

Rui ro:

- Neu hoi thoai AI qua tu do se ton token va chat luong khong on dinh.
- Can scenario script, rubric, va gioi han context.

### Hoc de bo tuc kien thuc

Phu hop nguoi hoc muon lap lo hong tu vung, ngu phap, phat am, nghe/doc co ban.

Tinh nang can co:

- Skill map theo CEFR hoac cap do noi bo.
- Bai hoc micro-learning.
- Flashcard + SRS.
- Giai thich ngu phap ngan gon.
- Bai tap typing/listening/translation co dap an xac dinh.
- Goi y bai tiep theo dua tren loi sai.

Rui ro:

- Neu noi dung qua rong se cham ra mat.
- Can bat dau bang 1 ngon ngu dich va 1 framework cap do.

## 1.2. Dinh hinh pham vi theo giai doan

### Muc MVP

MVP nen la **learning platform co lo trinh ca nhan + lesson player + AI tutor gioi han + SRS + lich hoc**.

Bao gom:

- Onboarding chon muc tieu hoc.
- Placement mini test.
- Tao lo trinh ca nhan tu template.
- Dat time hoc moi ngay/lich hoc trong tuan.
- Dashboard bai hoc hom nay.
- Lesson player.
- Flashcard/SRS.
- AI tutor text mode gioi han.
- Web Speech API cho speaking/shadowing co ban.
- Thu thap feedback user.

Chua nen lam day du:

- Mang xa hoi phuc tap.
- Chat nhom realtime lon.
- Thu vien phim lon co ban quyen.
- De thi AI sinh tu do.
- Cham phat am chuyen sau.

### Muc Beta

Them:

- Ket ban hoc cung.
- Hoc nhom nho.
- Leaderboard theo tuan/thang.
- Kho video/phim shadowing dang curated clips.
- De luyen random theo item bank.
- Billing va goi tra phi AI.
- Admin/content studio nghiem tuc.

### Muc Scale

Them:

- Multi-language marketplace.
- Native mobile app.
- Voice AI nang cao.
- Livestream/classroom.
- Community moderation.
- Recommendation engine bang embedding.
- Partnership noi dung co ban quyen.

## 2. Huong thiet ke tu portfolio.html

File `portfolio.html` dang theo phong cach:

- Nen toi, glassmorphism, border trong, blur, shadow sau.
- Typography hien dai: font sans manh, mono cho label/system text, serif italic cho diem nhan.
- Mau nhan neon: cyan, pink, violet, lime.
- Hero co cam giac 3D/AI studio, floating card, motion nhe.
- Navigation dang pill center, label ngan.
- Card co hover/tilt va feedback tuc thoi.

Khi ap dung vao app hoc ngon ngu:

- Dung phong cach nay cho landing, dashboard, AI tutor room, progress overview.
- Giam hieu ung orb/mesh qua nang trong man hoc chinh de tranh mat tap trung.
- Khong dung custom cursor tren mobile va khu vuc hoc chinh.
- 3D/animation chi nen la diem nhan: avatar AI tutor, mascot, hoac progress visual.
- Man bai hoc can ro rang, it nhieu, uu tien doc/de thao tac hon la phoi dien.

## 3. Stack cong nghe de xuat

### Frontend

- Next.js App Router + TypeScript.
- Tailwind CSS cho design system.
- shadcn/ui hoac Radix UI cho component accessible.
- Framer Motion cho micro-interaction.
- Three.js/React Three Fiber chi dung cho avatar/hero neu can.
- PWA: offline shell, cache lesson, luu progress tam thoi.

### Backend

- Node.js voi NestJS.
- REST API cho MVP, sau do co the them GraphQL neu admin/content phuc tap.
- WebSocket hoac Server-Sent Events cho AI conversation streaming.
- BullMQ + Redis cho job nen: tao bai hoc, xu ly audio, gui email, sync analytics.

### Database

- PostgreSQL la database chinh.
- Prisma ORM de quan ly schema/migration ro rang.
- Redis cho session/cache/rate limit/queue.
- pgvector trong PostgreSQL cho semantic search va goi y noi dung truoc; chua can Pinecone/Weaviate o MVP.
- Object storage S3-compatible cho audio, avatar, file bai hoc, import subtitle.

### Thanh toan va goi tra phi

- Thiet ke theo `Payment Provider Adapter` de co the thay Stripe/Paddle/VNPay/MoMo/ZaloPay tuy thi truong.
- Luu noi bo bang subscription, invoice, credit ledger, usage ledger.
- Khong de logic hoc phu thuoc truc tiep vao mot cong thanh toan.

## 4. Kien truc module

### Web app Next.js

- Landing page: gioi thieu san pham, demo nhanh, pricing ro rang.
- Onboarding: muc tieu, trinh do, thoi gian hoc, placement mini test.
- Dashboard: streak, muc tieu hom nay, bai tiep theo, tu can on.
- Lesson player: nghe, doc, chon dap an, flashcard, typing, speaking.
- AI tutor room: hoi thoai theo kich ban, goi y cau tra loi, sua loi sau moi luot.
- Vocabulary review: spaced repetition.
- Progress: CEFR/skill map, lich su hoc, diem manh/yeu.
- Account & billing.
- Admin/content studio.

### Learning path module

Chuc nang thiet ke lo trinh ca nhan la trung tam cua san pham.

Input:

- Ngon ngu nguoi hoc biet.
- Ngon ngu muon hoc.
- Muc tieu: thi, giao tiep cong viec, bo tuc kien thuc.
- Trinh do hien tai.
- Deadline hoac thoi gian hoc mong muon.
- So phut hoc moi ngay.
- Ky nang uu tien: nghe, noi, doc, viet, tu vung, ngu phap.

Output:

- Lo trinh 4-12 tuan.
- Bai hoc hom nay.
- Bai on tap SRS.
- Bai shadowing neu muc tieu la nghe/noi.
- De luyen neu muc tieu la thi.
- Goi y dieu chinh sau moi tuan.

Logic MVP:

- Dung template path truoc, khong can AI tao full path.
- AI chi dung de giai thich/ca nhan hoa text nhe neu can.
- Path engine dua tren rule: level + goal + available time + weakness.

### Study schedule module

Chuc nang dat time hoc can co ngay tu dau vi lien quan retention.

- User chon khung gio hoc trong tuan.
- Nhac hoc qua in-app/email/push sau khi co PWA.
- Session 5, 10, 15, 25 phut.
- Tu dong chia workload theo thoi gian user co.
- Neu bo lo bai hoc, he thong doi lich nhe, khong phat nang.

### Study buddy va group learning

Giai doan dau khong nen lam social network day du. Nen lam nhe:

- Ket ban theo cung muc tieu/cung level/cung timezone.
- Tao nhom 2-5 nguoi.
- Challenge nhom theo tuan: hoan thanh lesson, shadowing, vocab review.
- Phong hoc nhom bat dau bang checklist va comment, chua can video call.
- Matching dua tren muc tieu hoc va lich hoc.

Can co moderation tu som:

- Report/block user.
- Gioi han chat voi nguoi la neu can.
- Admin xem report.

### Ranking module

Leaderboard tao dong luc nhung phai tranh lam user hoc vi diem ao.

Nen co:

- Bang xep hang ban be/nhom truoc, global sau.
- Xep hang theo consistency va lesson completion, khong chi XP.
- Reset theo tuan de user moi con co co hoi.
- Tach leaderboard theo goal/level de cong bang.

Khong nen co o MVP:

- Global leaderboard lon ngay tu dau.
- Thu hang dua tren so luot AI chat vi se khuyen khich dot token.

### Shadowing media library

Kho phim shadowing la tinh nang rat gia tri nhung can xu ly ban quyen va metadata.

MVP nen bat dau bang:

- Clip ngan co quyen su dung hoac noi dung tu tao.
- Subtitle song ngu.
- Playback speed 0.75x, 1x, 1.25x.
- Loop cau.
- Click tu de luu flashcard.
- Record voice local va so sanh text qua Web Speech API.
- Diem shadowing co ban dua tren transcript match, khong cham phat am chuyen sau.

Beta:

- Import YouTube/public content neu hop le.
- Tach cau tu subtitle.
- Goi y clip theo level.
- Bien clip thanh lesson.

Scale:

- Kho phim/podcast co ban quyen.
- Cham phat am theo phoneme bang speech provider.
- AI tao bai tap tu clip sau khi co moderation.

### Random test generator

Phan tao de ngau nhien can lam theo cach kiem soat, vi dung AI sinh cau hoi truc tiep se loi nhieu.

Dung kien truc:

- `question_bank`: cau hoi da kiem duyet.
- `question_blueprints`: cau truc de thi theo ky nang, level, topic, do kho.
- `test_sessions`: de da tao cho user.
- `test_items`: danh sach cau hoi trong de.
- `explanations`: giai thich dap an co kiem duyet hoac AI draft + admin approve.

Nguyen tac:

- MVP random = boc cau hoi tu item bank theo blueprint.
- AI chi de tao ban nhap cau hoi cho admin duyet.
- Khong dua cau hoi AI chua duyet vao de thi that.
- Moi cau hoi phai co dap an, giai thich, level, topic, skill, do kho, nguon.
- Neu la writing/speaking, cham bang rubric va luu uncertainty score.

### Backend NestJS

- Auth module: email/password, OAuth sau, refresh token, device session.
- User profile module: muc tieu, trinh do, ngon ngu dang hoc.
- Curriculum module: course, unit, lesson, activity.
- Learning engine module: progress, attempt, scoring, next lesson.
- SRS module: flashcard, review schedule, FSRS/SM-2.
- AI tutor module: prompt templates, conversation, correction, usage limit.
- Speech module: Web Speech first, Whisper/Azure/ElevenLabs sau.
- Billing module: plan, subscription, payment events, credit wallet.
- Usage module: token, audio minutes, AI turn count, abuse/rate limit.
- Analytics module: events for user testing and retention.
- Admin module: content, moderation, user support.

## 5. Database cot loi

Bang nen co ngay tu dau:

- `users`: tai khoan.
- `profiles`: muc tieu hoc, native language, target language, level.
- `languages`: ngon ngu ho tro.
- `learning_goals`: thi, giao tiep cong viec, bo tuc kien thuc.
- `learning_paths`: lo trinh ca nhan cua user.
- `learning_path_steps`: cac buoc/bai trong lo trinh.
- `study_schedules`: lich hoc user dat.
- `study_sessions`: phien hoc theo lich hoac hoc tu do.
- `courses`, `units`, `lessons`: cau truc noi dung.
- `activities`: tung bai tap nho trong lesson.
- `lesson_attempts`: moi lan hoc.
- `activity_attempts`: cau tra loi, dung/sai, thoi gian.
- `vocab_items`: tu/cum tu.
- `user_vocab`: trang thai tu voi tung user.
- `srs_reviews`: lich on tap.
- `ai_conversations`: phien hoi thoai.
- `ai_messages`: tin nhan da rut gon, metadata.
- `ai_feedback`: loi sai, goi y, diem manh.
- `study_buddies`: quan he ban hoc.
- `study_groups`: nhom hoc.
- `study_group_members`: thanh vien nhom.
- `group_challenges`: thu thach nhom.
- `leaderboard_periods`: ky xep hang.
- `leaderboard_entries`: diem xep hang theo user/nhom.
- `media_assets`: phim/clip/audio.
- `media_captions`: subtitle va cau shadowing.
- `shadowing_attempts`: lan luyen shadowing.
- `question_bank`: ngan hang cau hoi kiem duyet.
- `question_blueprints`: cau truc tao de.
- `test_sessions`: de da tao.
- `test_items`: cau hoi trong de.
- `usage_ledger`: token, audio seconds, AI turns.
- `plans`, `subscriptions`, `invoices`, `payments`.
- `credit_ledger`: cong/tru credit de kiem soat chi phi AI.
- `admin_audit_logs`: lich su thao tac admin.

Nguyen tac:

- Tat ca giao dich thanh toan va credit phai ghi ledger bat bien.
- Subscription chi la trang thai hien tai, ledger moi la nguon doi soat.
- AI usage phai gan voi user, conversation, model, provider, estimated cost.

## 6. Chien luoc AI toi uu token

### Tang mien phi/chi phi thap

- Placement test bang rule-based + ngan hang cau hoi, khong can LLM.
- Tu vung, flashcard, grammar explanation co the sinh san truoc va cache.
- Bai tap co dap an dung/sai cham bang logic local.
- Voice MVP dung Web Speech API cho speech-to-text tren browser neu ho tro.
- Text-to-speech MVP dung browser SpeechSynthesis.

### Tang AI co kiem soat

- Moi user free co han muc AI turns/ngay.
- Moi conversation co summary ngan, khong gui toan bo lich su.
- Prompt theo scenario co schema co dinh.
- Retrieval chi lay lesson context can thiet, khong day ca khoa hoc vao prompt.
- Sua loi theo batch sau 2-3 luot noi, khong can goi AI moi cau neu chua can.
- Cache feedback cho cau tra loi trung lap.
- Dung model re/nhanh cho correction don gian, model manh cho roleplay tra phi.

### Tinh nang nen de tra phi

- Roleplay AI khong gioi han.
- Voice AI realtime/chat noi dai.
- Cham phat am chi tiet theo am vi.
- Tao lesson theo nganh nghe rieng.
- Import video/podcast va tu dong bien thanh bai hoc.
- Bao cao tien bo nang cao.

## 7. MVP trong 4 dot trien khai

### Dot 1: Prototype test UX

Muc tieu: user vao hoc duoc trong 60 giay.

- Landing theo style portfolio da tinh gon.
- Onboarding 4 buoc: ngon ngu, muc tieu hoc, trinh do, lich hoc.
- Dashboard co bai hoc hom nay.
- Tao lo trinh ca nhan tu template.
- Dat time hoc moi ngay.
- 1 lesson mau: nghe, doc, chon dap an, typing.
- Flashcard review co SRS gia lap.
- AI tutor mock/local rules de test luong hoi thoai.
- 1 clip shadowing mau voi subtitle.
- Thu thap feedback sau moi lesson.

Ket qua can co:

- User test duoc khong can dang ky truoc.
- Do duoc thoi gian hoan thanh lesson.
- Biet user co thich AI tutor flow khong truoc khi ton tien API.

### Dot 2: Backend that va auth

- Next.js ket noi NestJS.
- PostgreSQL + Prisma migration.
- Auth, profile, lesson progress, study schedule.
- Learning path engine ban dau.
- Admin nhap lesson co ban.
- Event analytics.
- Deploy staging.

Ket qua can co:

- User co account that.
- Tien do luu va dong bo.
- Admin them/sua lesson khong can code.

### Dot 3: AI tiet kiem token

- AI tutor module voi provider adapter.
- Prompt templates theo scenario.
- Conversation summary.
- Usage ledger va limit theo plan.
- Streaming response.
- Web Speech API cho STT/TTS browser.
- Fallback text mode khi browser khong ho tro voice.
- Question bank va random test generator theo blueprint.
- Shadowing attempt tracking.

Ket qua can co:

- Free plan khong bi vuot chi phi.
- Paid plan mo khoa AI tutor ro rang.
- Co log de tinh cost theo user.

### Dot 4: Billing, PWA, scale nho

- Subscription + payment adapter.
- Credit ledger.
- PWA offline lesson shell.
- Redis rate limit.
- Job queue cho email/audio/content.
- Study buddy, group challenge nho, leaderboard theo tuan.
- Monitoring/logging.
- Backup database.

Ket qua can co:

- Thu phi duoc.
- Quan ly giao dich va credit ro rang.
- He thong du de test user dinh ky va iter nhanh.

## 8. Roadmap 90 ngay

Ngay 1-7:

- Chot persona, cap ngon ngu, 10 scenario hoi thoai dau.
- Chot 3 muc tieu hoc dau: thi, giao tiep cong viec, bo tuc kien thuc.
- Dung design system Next.js.
- Tao prototype onboarding, lo trinh ca nhan, lich hoc, lesson + AI tutor mock.

Ngay 8-21:

- NestJS API, PostgreSQL, Prisma.
- Auth, profile, lesson progress, study schedule, learning path.
- Admin lesson editor ban dau.

Ngay 22-35:

- SRS, vocab review, analytics.
- Onboarding + placement mini test.
- Shadowing clip MVP.
- Question bank schema va generator theo blueprint.
- User testing batch 1.

Ngay 36-55:

- AI tutor provider adapter.
- Token ledger, free quota, paid quota.
- Web Speech API, TTS browser.
- User testing batch 2.

Ngay 56-75:

- Payment adapter, subscription, invoices, credit ledger.
- PWA cache lesson.
- Study buddy, group challenge, leaderboard nho.
- Admin support tools.

Ngay 76-90:

- Toi uu UX, pricing, retention.
- Bao cao tien bo.
- Logging, backup, monitoring.
- Beta public nho.

## 9. Nguyen tac UX

- Khong bat dang ky truoc khi hoc thu.
- Moi man hoc chi co mot viec chinh.
- Sai thi giai thich ngan gon va dua cau dung tu nhien.
- AI feedback nen mang tinh gia su, khong cham diem lanh lung.
- Voice la tuy chon, khong ep user noi noi cong cong.
- Luon co text mode thay the.
- Hieu ung dep nhung khong che noi dung hoc.
- Pricing noi thang: free co han muc AI, paid mo khoa AI ton chi phi.

## 10. Quyet dinh ky thuat nen chot som

- Monorepo hay tach repo: nen dung monorepo giai doan dau.
- Package manager: pnpm.
- Frontend: Next.js + Tailwind + shadcn/ui.
- Backend: NestJS + Prisma.
- DB: PostgreSQL + pgvector.
- Cache/queue: Redis + BullMQ.
- Storage: S3-compatible.
- AI adapter: OpenAI/Anthropic/Gemini tuy cost, khong khoa vao 1 provider.
- Payment adapter: truong phai co adapter rieng de thay provider theo thi truong.

## 11. Definition of Done cho MVP

- User moi vao hoc thu trong duoi 60 giay.
- Hoan thanh 1 lesson trong 5-10 phut.
- Luu tien do sau khi dang ky.
- Co it nhat 20 lesson/activity mau cho Viet - Anh.
- Co 3 loai muc tieu hoc: thi, giao tiep cong viec, bo tuc kien thuc.
- Co lo trinh ca nhan tu template.
- Co dat lich/thoi gian hoc.
- Co 1-3 clip shadowing mau.
- Co question bank va random test generator theo blueprint.
- Co AI tutor mock hoac AI limited flow.
- Co usage ledger cho moi luot AI.
- Co admin them/sua lesson.
- Co trang pricing/free vs paid.
- Co form feedback sau lesson.
- Co analytics co ban: activation, lesson completion, return rate, AI usage.
