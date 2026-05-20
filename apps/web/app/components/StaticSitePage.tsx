import Link from "next/link";
import type { SitePageContent } from "../lib/site-pages";

type StaticSitePageProps = {
  content: SitePageContent;
};

export function StaticSitePage({ content }: StaticSitePageProps) {
  return (
    <main className="page-shell theme-light static-shell">
      <header className="topbar macos-header static-header">
        <div className="window-controls" aria-hidden="true">
          <span className="control-red" />
          <span className="control-yellow" />
          <span className="control-green" />
        </div>
        <Link className="brand lumalang-wordmark" href="/">
          <span className="brand-logo-frame">
            <img alt="" src="/images/lumalang-logo.png" />
          </span>
          <span>Luma<span className="ll-accent">Lang</span><sup>*</sup></span>
        </Link>
        <nav className="nav-pills" aria-label="Điều hướng chính">
          <Link href="/">Trang chủ</Link>
          <Link href="/learn">Phòng học</Link>
          <Link href="/pricing">Gói học</Link>
          <Link href="/blog">Journal</Link>
          <Link href="/contact">Liên hệ</Link>
        </nav>
        <div className="header-actions">
          <details className="static-mobile-menu">
            <summary aria-label="Mở menu">Menu</summary>
            <nav aria-label="Điều hướng mobile trang phụ">
              <Link href="/">Trang chủ</Link>
              <Link href="/learn">Phòng học</Link>
              <Link href="/pricing">Gói học</Link>
              <Link href="/blog">Journal</Link>
              <Link href="/contact">Liên hệ</Link>
            </nav>
          </details>
          <Link className="ghost-button journey-button" href="/learn">Vào học</Link>
        </div>
      </header>

      <section className="route-hero">
        <div className="route-landscape" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="route-window">
          <div className="route-window-top">
            <div className="window-controls" aria-hidden="true">
              <span className="control-red" />
              <span className="control-yellow" />
              <span className="control-green" />
            </div>
            <span>lumalang.learning/{content.eyebrow.toLowerCase().replaceAll(" ", "-")}</span>
          </div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
          <div className="route-actions">
            <Link className="hero-cta" href="/learn">{content.primaryAction}</Link>
            <Link className="route-link" href="/">{content.secondaryAction}</Link>
          </div>
        </div>
      </section>

      <section className="route-card-grid" aria-label="Nội dung chính">
        {content.cards.map((card) => (
          <article className="glass-panel route-card" key={card.title}>
            <span>{card.kicker}</span>
            <h2>{card.title}</h2>
            <p>{card.body}</p>
          </article>
        ))}
      </section>

      <footer className="site-footer route-footer">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="brand-logo-frame compact">
              <img alt="" src="/images/lumalang-logo.png" />
            </span>
            <span>LumaLang</span>
          </Link>
          <p>Một nơi học nhẹ hơn, sâu hơn, và ít ồn hơn.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/blog">Journal</Link>
          <Link href="/admin">Admin</Link>
        </nav>
        <div className="footer-note">
          <strong>Tech Minimalism</strong>
          <span>Glass, calm motion, clear hierarchy.</span>
        </div>
      </footer>
    </main>
  );
}
