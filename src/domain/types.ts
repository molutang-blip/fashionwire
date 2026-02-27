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
  platform?: TrendSource;
}

// ====== 增强版类型定义（时间线+KOL详情）======

// 时间线数据点
export interface TimelineDataPoint {
  date: string;              // ISO日期，如 "2025-01-15"
  heatValue: number;         // 热度值
  engagementCount: number;   // 互动量
  postCount: number;         // 发布量
}

// 关键节点事件类型
export type TimelineEventType = 'first_post' | 'peak_point' | 'celebrity_join' | 'brand_response';

// 关键节点事件
export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;             // 如 "深夜徐老师首发"
  description?: string;      // 详细描述
  relatedDriverId?: string;  // 关联的KOL ID
}

// 内容预览
export interface PreviewContent {
  type: 'image' | 'text';
  thumbnail?: string;
  text?: string;
}

// 增强版 TrendDriver
export interface TrendDriverEnhanced {
  id: string;
  name: string;
  avatar: string;
  role: "celebrity" | "kol" | "brand" | "media";
  platform: TrendSource;
  firstPostTime: string;     // ISO时间
  postCount: number;         // 发布量
  engagementTotal: number;   // 互动量汇总
  isFirstMover: boolean;     // 是否首发者
  previewContent?: PreviewContent;
}

// 数据来源类型
export type DataSourceType = 'official_api' | 'aggregator' | 'estimated';

// 增强版平台分布
export interface PlatformBreakdownEnhanced {
  platform: TrendSource;
  percentage: number;
  count: number;
  dataSource: DataSourceType;
  lastUpdated: string;
}

// 时间线数据
export interface TimelineData {
  dataPoints: TimelineDataPoint[];
  events: TimelineEvent[];
}

// 增强版话题详情
export interface TrendingTopicDetailEnhanced extends TrendingTopic {
  timeline: TimelineData;
  platformBreakdown: PlatformBreakdownEnhanced[];
  trendDrivers: TrendDriverEnhanced[];
  keyInsight: string;
  curatedPosts: CuratedPost[];
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
