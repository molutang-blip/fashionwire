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
  relatedItems?: RelatedItem[];
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

// ====== 品牌动态详情类型定义 ======

// 大事记事件类型
export type BrandMilestoneType = 'personnel' | 'financial' | 'marketing' | 'product';

// 品牌大事记事件
export interface BrandMilestone {
  id: string;
  date: string;              // ISO日期
  type: BrandMilestoneType;
  title: string;
  description: string;
}

// 区域营收分布
export interface RegionBreakdown {
  region: string;
  percentage: number;
  yoyChange: number;         // 同比变化百分比
}

// 财务数据
export interface BrandFinancials {
  annualRevenue: {
    value: number;
    unit: string;            // 'B' for billion, 'M' for million
    currency: string;        // 'EUR', 'USD', 'GBP'
    year: number;
    yoyChange: number;
  };
  quarterlyRevenue: {
    value: number;
    unit: string;
    currency: string;
    quarter: string;         // 'Q1', 'Q2', 'Q3', 'Q4'
    year: number;
    yoyChange: number;
  };
  regionBreakdown: RegionBreakdown[];
  dataSource: string;
  lastUpdated: string;
}

// 动态详情内容
export interface BrandNewsDetail {
  titleZh: string;
  titleEn: string;
  content: string;
  imageUrl?: string;
  sourceUrl: string;
}

// 完整的品牌动态详情
export interface BrandUpdateDetail {
  brandId: string;
  brandName: string;
  brandNameZh: string;
  group: string;
  newsDetail: BrandNewsDetail;
  milestones: BrandMilestone[];
  financials: BrandFinancials;
}

// ====== 相关单品类型定义（热榜详情内条件展示）======

export interface RelatedItem {
  id: string;
  brand: string;
  name: string;
  imageUrl: string;
  price?: number;
  currency?: string;
  externalUrl: string;
}

// ====== 风格关键词增强类型 ======

// 预设造型选项
export interface OutfitOption {
  id: string;
  name: string;                    // 如 "经典通勤"、"周末休闲"、"约会造型"
  imageUrl: string;                // 完整造型图片
  description?: string;            // 简短描述
  colorScheme: string;             // 配色描述，如 "米白+灰"
}

// 配色方案
export interface ColorPalette {
  primary: string;      // 主色 hex，如 "#1A1A1A"
  secondary: string;    // 辅色 hex
  accent?: string;      // 点缀色 hex（可选）
  name: string;         // 配色名称，如 "黑白灰经典配色"
}

// 核心单品
export interface FormulaItem {
  category: string;     // 品类，如 "外套"、"下装"
  description: string;  // 描述，如 "驼色羊绒大衣"
  importance: 'must' | 'recommended' | 'optional';  // 重要程度
}

// 穿搭公式
export interface StyleFormula {
  coreItems: FormulaItem[];          // 核心单品清单（5-7件）
  colorPalette: ColorPalette;        // 配色方案
  materials: string[];               // 材质关键词，如 ["羊绒", "真丝", "小羊皮"]
  avoidItems?: string[];             // 避免单品（可选），如 ["荧光色", "过多logo"]
}

// 风格示例图
export interface StyleExample {
  id: string;
  imageUrl: string;
  caption?: string;                  // 图片说明，如 "Kendall Jenner 街拍"
  source?: string;                   // 来源，如 "Instagram"
}

// 风格关键词详情（增强版）
export interface StyleKeywordDetail {
  id: string;
  keywordZh: string;
  keywordEn: string;
  definition: string;                // 一句话定义
  origin?: string;                   // 起源/背景（可选）
  representativeFigures?: string[];  // 代表人物（可选），如 ["Sofia Richie", "Gwyneth Paltrow"]
  formula: StyleFormula;             // 穿搭公式
  outfits: OutfitOption[];           // 预设造型（3套）
  examples: StyleExample[];          // 风格示例图（3-4张）
  frequency: number;                 // 热度频次（继承原有）
  sources: { source: TrendSource; count: number }[];  // 来源分布（继承原有）
}

// AI 试穿请求参数
export interface AIFittingRequest {
  styleKeywordId: string;
  outfitId: string;                  // 选中的造型 ID
  userPhoto: string;                 // base64 或 URL
  measurements?: {                   // 三围数据（可选）
    bust?: number;                   // 胸围 cm
    waist?: number;                  // 腰围 cm
    hips?: number;                   // 臀围 cm
    height?: number;                 // 身高 cm
  };
}

// AI 试穿结果
export interface AIFittingResult {
  generatedImageUrl: string;         // 生成的图片 URL
  styleKeywordId: string;
  createdAt: string;
}
