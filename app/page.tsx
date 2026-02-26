import type {
  TrendingTopic,
  BrandUpdate,
  HotItem,
  StyleKeyword,
  TrendSource
} from "@/domain/types";
import { TodayAngle } from "@/components/TodayAngle";
import { TrendingSection } from "@/components/TrendingSection";
import { BrandUpdatesSection } from "@/components/BrandUpdatesSection";
import { HotItemsSection } from "@/components/HotItemsSection";
import { StyleWordCloud } from "@/components/StyleWordCloud";
import trendingRaw from "../data/trending_topics.json";
import brandUpdatesRaw from "../data/brand_updates.json";
import hotItemsRaw from "../data/hot_items.json";
import styleKeywordsRaw from "../data/style_keywords.json";

function formatTimeWindow(window: string): string {
  if (window === "realtime") return "实时";
  if (window === "24h") return "24 小时内";
  if (window === "7d") return "7 天内";
  return window;
}

function mapToTrendSource(name: string): TrendSource {
  const lower = name.trim().toLowerCase();
  if (lower.includes("instagram")) return "instagram";
  if (lower.includes("tiktok")) return "tiktok";
  if (lower.includes("小红书") || lower.includes("xiaohongshu")) return "xiaohongshu";
  if (lower.includes("google")) return "google";
  if (lower.includes("baidu") || lower.includes("百度")) return "baidu";
  if (lower.includes("amazon")) return "amazon";
  if (lower.includes("taobao") || lower.includes("淘宝")) return "taobao";
  return "instagram";
}

const MOCK_TRENDING: TrendingTopic[] = (trendingRaw as any[]).map((item) => ({
  id: item.id,
  titleZh: item.title_zh,
  titleEn: item.title_en,
  score: item.score,
  sourceLabel: item.sources,
  direction: item.direction,
  timestamp: formatTimeWindow(item.time_window)
}));

const MOCK_BRAND_UPDATES: BrandUpdate[] = (brandUpdatesRaw as any[]).map((item) => ({
  id: item.id,
  brand: item.brand,
  group: item.group,
  type: item.type,
  title: item.title,
  date: item.event_date,
  summary: item.summary
}));

const MOCK_HOT_ITEMS: HotItem[] = (hotItemsRaw as any[]).map((item) => ({
  id: item.id,
  brand: item.brand,
  name: item.name,
  category: item.category,
  price: item.price,
  currency: item.currency,
  imageUrl: item.image_url,
  buyLink: item.buy_link,
  score: item.score
}));

const MOCK_KEYWORDS: StyleKeyword[] = (styleKeywordsRaw as any[]).map((item) => {
  const sources = String(item.sources)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const perSource = sources.length > 0 ? Math.max(1, Math.round(item.frequency / sources.length)) : item.frequency;

  return {
    id: item.id,
    keywordZh: item.keyword_zh,
    keywordEn: item.keyword_en,
    frequency: item.frequency,
    sources: sources.map((s) => ({
      source: mapToTrendSource(s),
      count: perSource
    }))
  };
});

export default function HomePage() {
  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Hero */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr,1.1fr] items-stretch">
        <div className="editor-card h-full flex flex-col">
          <div className="badge mb-3">Daily Briefing · 当日总览</div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-snug mb-3">
            今天的全球时尚长什么样？
          </h1>
          <p className="text-sm sm:text-[15px] text-neutral-700 leading-relaxed mb-4 max-w-xl">
            基于过去 24 小时的社交讨论、搜索趋势与电商信号，我们为你汇总出今日最值得关注的事件、品牌动向与风格情绪。
          </p>
          <div className="grid grid-cols-2 gap-4 text-[11px] text-neutral-600 max-w-xl mt-auto">
            <div>
              <p className="uppercase tracking-wide mb-1 text-neutral-500">
                今日最高热度话题
              </p>
              <p className="text-neutral-900">
                Met Gala 红毯造型
                <span className="ml-1 text-neutral-500 text-[10px]">
                  · Social / Search
                </span>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide mb-1 text-neutral-500">
                上升最快风格关键词
              </p>
              <p className="text-neutral-900">
                安静奢华
                <span className="ml-1 text-neutral-500 text-[10px]">
                  Quiet Luxury
                </span>
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide mb-1 text-neutral-500">
                电商侧爆发品类
              </p>
              <p className="text-neutral-900">
                红色高跟鞋 · 轻奢包袋
              </p>
            </div>
            <div>
              <p className="uppercase tracking-wide mb-1 text-neutral-500">
                适合你的今日焦点
              </p>
              <p className="text-neutral-900">
                奢侈品牌女装 / 包袋
                <span className="ml-1 text-neutral-500 text-[10px]">
                  （后续将结合你的偏好自动生成）
                </span>
              </p>
            </div>
          </div>
        </div>
        <TodayAngle />
      </section>

      {/* Global Fashion Trending + Brand Intelligence */}
      <section id="trending" className="grid gap-6 lg:grid-cols-[1.3fr,1.1fr] items-start">
        <TrendingSection topics={MOCK_TRENDING} maxVisible={5} />
        <BrandUpdatesSection updates={MOCK_BRAND_UPDATES} maxVisible={5} />
      </section>

      {/* Hot Items */}
      <HotItemsSection items={MOCK_HOT_ITEMS} displayCount={6} />

      {/* Style Keywords Cloud */}
      <StyleWordCloud keywords={MOCK_KEYWORDS} />
    </div>
  );
}
