export type TrendSource =
  | "instagram"
  | "tiktok"
  | "xiaohongshu"
  | "weibo"
  | "google"
  | "baidu"
  | "amazon"
  | "taobao";

export type TrendDirection = "up" | "down" | "flat";

export interface TrendingTopic {
  id: string;
  titleZh: string;
  titleEn: string;
  score: number;
  sourceLabel: string;
  direction: TrendDirection;
  timestamp: string;
}

// 扩展的趋势详情类型（用于弹窗展示）
export interface PlatformBreakdown {
  platform: TrendSource;
  percentage: number;
  count: number;
}

export interface TrendDriver {
  id: string;
  name: string;
  avatar: string;
  role: "celebrity" | "kol" | "brand" | "media";
  platform?: string;
}

export interface CuratedPost {
  id: string;
  thumbnail: string;
  platform: TrendSource;
  description: string;
  externalUrl: string;
  likes?: number;
  comments?: number;
}

export interface TrendingTopicDetail extends TrendingTopic {
  platformBreakdown: PlatformBreakdown[];
  keyInsight: string;
  trendDrivers: TrendDriver[];
  curatedPosts: CuratedPost[];
}

export type BrandUpdateType = "runway" | "collection" | "business";

export interface BrandUpdate {
  id: string;
  brand: string;
  group: string;
  type: BrandUpdateType;
  title: string;
  date: string;
  summary: string;
}

export type HotItemCategory =
  | "clothing"
  | "bag"
  | "shoes"
  | "accessory"
  | "jewellery"
  | "other";

export interface HotItem {
  id: string;
  brand: string;
  name: string;
  category: HotItemCategory;
  price: number;
  currency: string;
  imageUrl: string;
  buyLink: string;
  score: number;
}

export interface StyleKeyword {
  id: string;
  keywordZh: string;
  keywordEn: string;
  frequency: number;
  sources: {
    source: TrendSource;
    count: number;
  }[];
}

export type FavoriteKind = "trending" | "brandUpdate" | "hotItem";

export interface FavoriteEntryBase {
  id: string;
  kind: FavoriteKind;
  createdAt: string;
}

export interface FavoriteTrending extends FavoriteEntryBase {
  kind: "trending";
  titleZh: string;
  titleEn: string;
}

export interface FavoriteBrandUpdate extends FavoriteEntryBase {
  kind: "brandUpdate";
  brand: string;
  title: string;
}

export interface FavoriteHotItem extends FavoriteEntryBase {
  kind: "hotItem";
  brand: string;
  name: string;
  imageUrl: string;
}

export type FavoriteEntry =
  | FavoriteTrending
  | FavoriteBrandUpdate
  | FavoriteHotItem;
