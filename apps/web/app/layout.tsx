import type { Metadata } from "next";
import { CursorEffect } from "./components/CursorEffect";
import "./styles/fonts.css";
import "./styles/theme.css";
import "./globals.css";

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
  return (
    <html lang="vi">
      <body>
        <CursorEffect />
        {children}
      </body>
    </html>
  );
}
