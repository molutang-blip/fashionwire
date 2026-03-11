import { TrendingSection } from "@/components/TrendingSection";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f5f2]">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-neutral-900 tracking-wide">
            FashionWire
          </h1>
          <p className="text-neutral-500 mt-1 text-sm">
            基于搜索、媒体与社交数据的时尚产业情报平台 · 每4小时更新
          </p>
        </header>

        <TrendingSection />
      </main>
    </div>
  );
}
