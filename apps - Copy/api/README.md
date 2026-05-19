# API service direction

Backend nen dung Node.js voi NestJS, Prisma va PostgreSQL. Thu muc nay la scaffold dinh huong truoc khi cai dependency backend.

Module uu tien:

- `auth`: user, session, role.
- `profile`: ngon ngu, level, muc tieu hoc.
- `learning-path`: tao lo trinh tu template + dieu chinh theo tien do.
- `schedule`: lich hoc, reminder, study session.
- `lesson`: course, unit, lesson, activity, attempt.
- `srs`: flashcard va lich on tap.
- `media`: shadowing clip, caption, attempt.
- `test-bank`: question bank, blueprint, random test session.
- `community`: study buddy, group, challenge, leaderboard.
- `ai`: provider adapter, prompt template, conversation summary, usage ledger.
- `billing`: subscription, invoice, payment, credit ledger.

Nguyen tac chi phi AI:

- Moi luot AI phai ghi `usage_ledger`.
- Moi giao dich credit/subscription phai ghi ledger bat bien.
- Random test cho user chi boc cau hoi tu `question_bank` da kiem duyet.
- AI sinh cau hoi chi tao draft cho admin duyet.
