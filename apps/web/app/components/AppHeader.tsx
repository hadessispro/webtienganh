import Link from "next/link";

type SiteRoute = "/" | "/placement" | "/admin" | "/pricing" | "/blog" | "/contact" | "/auth";

type AppHeaderProps = {
  active?: "home" | "placement" | "admin" | "pricing" | "blog" | "contact" | "auth";
  actionHref?: SiteRoute;
  actionLabel?: string;
};

const navItems = [
  { href: "/", label: "Trang chủ", id: "home" },
  { href: "/placement", label: "Đánh giá đầu vào", id: "placement" },
  { href: "/pricing", label: "Gói học", id: "pricing" },
  { href: "/blog", label: "Journal", id: "blog" },
  { href: "/admin", label: "Admin", id: "admin" }
] as const;

export function AppHeader({
  active,
  actionHref = "/auth",
  actionLabel = "Đăng nhập"
}: AppHeaderProps) {
  return (
    <header className="topbar macos-header static-header app-header">
      <div className="window-controls" aria-hidden="true">
        <span className="control-red" />
        <span className="control-yellow" />
        <span className="control-green" />
      </div>
      <Link className="brand lumalang-wordmark" href="/">
        <span className="brand-logo-frame">
          <img alt="" src="/images/lumalang-logo.png" />
        </span>
        <span>
          Luma<em>Lang</em><sup>*</sup>
        </span>
      </Link>
      <nav className="nav-pills" aria-label="Điều hướng chính">
        {navItems.map((item) => (
          <Link
            aria-current={active === item.id ? "page" : undefined}
            className={active === item.id ? "active" : undefined}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <details className="static-mobile-menu">
          <summary aria-label="Mở menu">Menu</summary>
          <nav aria-label="Điều hướng mobile">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact">Liên hệ</Link>
          </nav>
        </details>
        <Link className="ghost-button journey-button" href={actionHref}>
          {actionLabel}
        </Link>
      </div>
    </header>
  );
}
