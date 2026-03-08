import { TrendingSection } from "@/components/TrendingSection";

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">FashionWire</h1>
          <p className="text-neutral-600 mt-2">全球时尚趋势热榜</p>
        </header>
        
        <TrendingSection />
      </main>
    </div>
  );
}
