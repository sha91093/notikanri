import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title: "のうち管理",
  description: "農地管理アプリ - 農地マップ・営農スケジュール・作業日誌",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
