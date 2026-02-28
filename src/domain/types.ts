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
