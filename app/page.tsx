import type {
  TrendingTopic,
  BrandUpdate,
  HotItem,
  StyleKeyword,
  TrendSource
} from "@/domain/types";
import { TodayAngle } from "@/components/TodayAngle";
import { DailyBriefing } from "@/components/DailyBriefing";
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

const DAILY_BRIEFING_DATA = {
  hotTopic: "Met Gala 红毯造型",
  hotTopicSource: "Social / Search",
  styleKeyword: "安静奢华",
  styleKeywordEn: "Quiet Luxury",
  hotCategory: "红色高跟鞋 · 轻奢包袋",
  focusArea: "奢侈品牌女装 / 包袋"
};

export default function HomePage() {
  return (
    <div className="space-y-8 lg:space-y-10">
      {/* Hero: Daily Briefing + Today Angle */}
      <section className="grid gap-6 lg:grid-cols-[1.6fr,1.1fr] items-stretch">
        <DailyBriefing data={DAILY_BRIEFING_DATA} />
        <TodayAngle />
      </section>

      {/* Global Fashion Trending + Brand Intelligence */}
      <section id="trending" className="grid gap-6 lg:grid-cols-[1.3fr,1.1fr] items-start">
       <TrendingSection topics={MOCK_TRENDING} />
        <BrandUpdatesSection updates={MOCK_BRAND_UPDATES} maxVisible={5} />
      </section>

      {/* Hot Items */}
      <HotItemsSection items={MOCK_HOT_ITEMS} displayCount={6} />

      {/* Style Keywords Cloud */}
      <StyleWordCloud keywords={MOCK_KEYWORDS} />
    </div>
  );
}
