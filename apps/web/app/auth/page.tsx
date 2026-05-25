import { signIn } from "@/auth"

export default function AuthPage() {
  return (
    <div className="page-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="glass-panel" style={{ padding: "48px 32px", maxWidth: "440px", width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
          <div className="brand" style={{ fontSize: "28px", justifyContent: "center" }}>
            <div className="brand-mark">LL</div>
            <span>LumaLang</span>
          </div>
          <h2 style={{ fontSize: "24px", margin: "12px 0 8px" }}>Chào mừng trở lại</h2>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px", lineHeight: "1.5" }}>
            Đăng nhập để lưu tiến độ và tiếp tục lộ trình học tiếng Anh cá nhân hóa của bạn.
          </p>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/learn" })
            }}
          >
            <button
              type="submit"
              className="primary-button"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", width: "100%", background: "white", color: "var(--ink)", border: "1px solid var(--line)", padding: "14px", borderRadius: "999px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Đăng nhập bằng Google
            </button>
          </form>

          <div style={{ position: "relative", margin: "24px 0" }}>
            <div style={{ borderTop: "1px solid var(--line)", position: "absolute", top: "50%", left: 0, right: 0 }}></div>
            <span style={{ position: "relative", background: "var(--page)", padding: "0 16px", color: "var(--soft)", fontSize: "13px", fontWeight: 600 }}>HOẶC</span>
          </div>

          <form action={async () => { "use server" }}>
            <button
              type="button"
              disabled
              className="primary-button"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", width: "100%", background: "#1877F2", color: "white", border: "none", padding: "14px", borderRadius: "999px", fontSize: "16px", fontWeight: "600", opacity: 0.6, cursor: "not-allowed" }}
            >
              <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Đăng nhập bằng Facebook
            </button>
          </form>
        </div>
        
        <p style={{ marginTop: "32px", fontSize: "13px", color: "var(--soft)", lineHeight: "1.5" }}>
          Bằng việc đăng nhập, bạn đồng ý với <a href="#" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: "600" }}>Điều khoản</a> & <a href="#" style={{ color: "var(--blue)", textDecoration: "none", fontWeight: "600" }}>Bảo mật</a> của chúng tôi.
        </p>

      </div>
    </div>
  )
}
