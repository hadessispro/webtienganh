import type { Metadata } from "next";
import { CursorEffect } from "./components/CursorEffect";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./globals.css";
import { SessionProvider } from "./components/SessionProvider";

export const metadata: Metadata = {
  title: "LumaLang - AI language learning sanctuary",
  description:
    "Nen tang hoc ngon ngu ca nhan hoa voi lo trinh, shadowing, nhom hoc va AI tutor tiet kiem token.",
  icons: {
    icon: "/images/lumalang-logo.png",
    apple: "/images/lumalang-logo.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `suppressHydrationWarning` on <html> and <body> tells React to
  // ignore mismatches injected by browser extensions (Microsoft
  // Translator, Google Translate, Grammarly, etc) which modify the
  // DOM before React hydrates. Without this we get a "hydration
  // failed because server HTML didn't match client" overlay on
  // every page load when the user has those extensions installed.
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SessionProvider>
          <CursorEffect />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
