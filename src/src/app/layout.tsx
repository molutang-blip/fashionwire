import "./globals.css";
import { Playfair_Display, Noto_Sans_SC } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap"
});

const notoSans = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto",
  display: "swap"
});

export const metadata = {
  title: "FashionWire · 全球时尚趋势追踪",
  description: "基于社交媒体、搜索趋势与电商数据的时尚情报平台"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${playfair.variable} ${notoSans.variable}`}>
      <body className="page-shell">
        <header className="border-b border-neutral-200 bg-white/80 backdrop-blur sticky top-0 z-30">
          <div className="page-container flex items-center justify-between h-14">
            <a href="/" className="font-display text-lg tracking-wide">
              FashionWire
            </a>
            <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-600">
              <a href="#trending" className="hover:text-neutral-900">热搜</a>
              <a href="#brands" className="hover:text-neutral-900">品牌</a>
              <a href="#items" className="hover:text-neutral-900">单品</a>
              <a href="#keywords" className="hover:text-neutral-900">关键词</a>
            </nav>
          </div>
        </header>
        <main className="flex-1 page-container py-8">{children}</main>
        <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
          © 2025 FashionWire · 数据仅供参考
        </footer>
      </body>
    </html>
  );
}
