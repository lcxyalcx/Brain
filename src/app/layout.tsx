import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KPL 爱因斯坦的大脑 · 粉丝下单演示站",
  description:
    "选择支持的 KPL 战队，购买脑子数量，并把脑子分配到指定选手头上。纯前端演示，适合部署到 Vercel。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}
