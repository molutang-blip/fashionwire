export type TrendSource =
  | "instagram"
  | "tiktok"
  | "xiaohongshu"
  | "weibo"
  | "google"
  | "baidu"
  | "amazon"
  | "taobao";

export interface TrendingTopic {
  id: string;
  titleZh: string;
  titleEn: string;
  score: number;
  sourceLabel: string;
  direction: "up" | "down" | "flat";
  timestamp: string;
}

export interface BrandUpdate {
  id: string;
  brand: string;
  group: string;
  type: "runway" | "collection" | "business";
  title: string;
  date: string;
  summary: string;
}

export interface HotItem {
  id: string;
  brand: string;
  name: string;
  category: string;
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
  sources: { source: TrendSource; count: number }[];
}

export type FavoriteKind = "trending" | "brandUpdate" | "hotItem";

export interface FavoriteTrending {
  kind: "trending";
  id: string;
  label: string;
  meta?: string;
  createdAt: string;
}

export interface FavoriteBrandUpdate {
  kind: "brandUpdate";
  id: string;
  label: string;
  meta?: string;
  createdAt: string;
}

export interface FavoriteHotItem {
  kind: "hotItem";
  id: string;
  label: string;
  meta?: string;
  createdAt: string;
}

export type FavoriteEntry =
  | FavoriteTrending
  | FavoriteBrandUpdate
  | FavoriteHotItem;
