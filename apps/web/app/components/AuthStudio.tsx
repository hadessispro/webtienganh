"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  AuthProvider,
  AvatarMode,
  SESSION_STORAGE_KEY,
  createDemoProfile,
  goalLabels,
  providerLabels
} from "../lib/product-data";
import type { Goal } from "../lib/learning-core";

const providerTokens: Record<AuthProvider, string> = {
  gmail: "gmail-oauth-demo-token",
  facebook: "facebook-oauth-demo-token",
  token: "manual-access-token"
};

export function AuthStudio() {
  const [provider, setProvider] = useState<AuthProvider>("gmail");
  const [name, setName] = useState("Luma Learner");
  const [email, setEmail] = useState("learner@gmail.com");
  const [token, setToken] = useState(providerTokens.gmail);
  const [language, setLanguage] = useState("Tiếng Anh");
  const [level, setLevel] = useState("A2");
  const [goal, setGoal] = useState<Goal>("work");
  const [dailyMinutes, setDailyMinutes] = useState(10);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>("initial");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gifPrompt, setGifPrompt] = useState("lo-fi leaf avatar, soft glass, smiling study mood");
  const [saved, setSaved] = useState(false);

  const initials = useMemo(() => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [name]);

  function pickProvider(nextProvider: AuthProvider) {
    setProvider(nextProvider);
    setToken(providerTokens[nextProvider]);
    if (nextProvider === "facebook") {
      setEmail("learner@facebook.local");
    }
    if (nextProvider === "token") {
      setEmail("token-user@lumalang.local");
    }
  }

  function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setAvatarUrl(String(reader.result));
      setAvatarMode("image");
    });
    reader.readAsDataURL(file);
  }

  function generateGifAvatar() {
    setAvatarMode("gif");
    setAvatarUrl("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const profile = createDemoProfile({
      provider,
      name,
      email,
      token,
      language,
      level,
      goal,
      dailyMinutes,
      avatarMode,
      avatarUrl: avatarUrl || undefined,
      gifPrompt: avatarMode === "gif" ? gifPrompt : undefined
    });

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(profile));
    setSaved(true);
    window.setTimeout(() => {
      window.location.href = "/learn";
    }, 450);
  }

  return (
    <section className="auth-studio" aria-label="Đăng ký học thử">
      <div className="auth-copy">
        <span className="eyebrow">Tài khoản học thử</span>
        <h1>Vào phòng học bằng Gmail, Facebook hoặc token riêng.</h1>
        <p>
          Đây là lớp frontend để test UX trước. Khi backend Node sẵn sàng, các nút này sẽ
          đổi sang OAuth thật và token sẽ được xác thực ở server.
        </p>
        <div className="auth-note">
          <strong>Avatar linh hoạt</strong>
          <span>Upload ảnh từ máy hoặc tạo GIF vibe học chill qua adapter API.</span>
        </div>
      </div>

      <form className="glass-panel auth-card" onSubmit={handleSubmit}>
        <div className="auth-card-header">
          <div className="avatar-preview" data-mode={avatarMode}>
            {avatarUrl ? <img alt="Avatar xem trước" src={avatarUrl} /> : <span>{initials || "L"}</span>}
          </div>
          <div>
            <span className="eyebrow">Identity</span>
            <h2>{name || "Bạn học mới"}</h2>
            <p>{providerLabels[provider]} session</p>
          </div>
        </div>

        <div className="provider-row" aria-label="Chọn phương thức đăng nhập">
          {(["gmail", "facebook", "token"] as AuthProvider[]).map((item) => (
            <button
              className={provider === item ? "active" : undefined}
              key={item}
              onClick={() => pickProvider(item)}
              type="button"
            >
              {providerLabels[item]}
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            Tên hiển thị
            <input onChange={(event) => setName(event.target.value)} value={name} />
          </label>
          <label>
            Email
            <input onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </label>
          <label className="wide-field">
            Token / OAuth access token
            <input onChange={(event) => setToken(event.target.value)} value={token} />
          </label>
          <label>
            Ngôn ngữ học
            <select onChange={(event) => setLanguage(event.target.value)} value={language}>
              <option>Tiếng Anh</option>
              <option>Tiếng Nhật</option>
              <option>Tiếng Hàn</option>
            </select>
          </label>
          <label>
            Trình độ
            <select onChange={(event) => setLevel(event.target.value)} value={level}>
              <option>Mới bắt đầu</option>
              <option>A1</option>
              <option>A2</option>
              <option>B1</option>
              <option>B2</option>
              <option>C1</option>
              <option>N5</option>
            </select>
          </label>
          <label>
            Mục tiêu
            <select onChange={(event) => setGoal(event.target.value as Goal)} value={goal}>
              {Object.entries(goalLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Thời lượng/ngày
            <select
              onChange={(event) => setDailyMinutes(Number(event.target.value))}
              value={dailyMinutes}
            >
              <option value={5}>5 phút</option>
              <option value={10}>10 phút</option>
              <option value={15}>15 phút</option>
              <option value={25}>25 phút</option>
            </select>
          </label>
        </div>

        <div className="avatar-tools">
          <label className="upload-chip">
            Upload avatar
            <input accept="image/*" onChange={handleAvatarUpload} type="file" />
          </label>
          <label className="wide-field">
            Prompt GIF avatar
            <input onChange={(event) => setGifPrompt(event.target.value)} value={gifPrompt} />
          </label>
          <button className="soft-button" onClick={generateGifAvatar} type="button">
            Tạo GIF demo
          </button>
        </div>

        <div className="auth-actions">
          <button className="hero-cta" type="submit">
            {saved ? "Đã lưu, vào phòng học..." : "Tạo tài khoản học"}
          </button>
          <Link className="route-link" href="/">
            Về trang chủ
          </Link>
        </div>
      </form>
    </section>
  );
}
