export type TrendSource = 'google' | 'instagram' | 'tiktok';

export type TrendDirection = 'up' | 'down' | 'flat';

export interface TrendingTopic {
  id: string;
  titleZh: string;           // 中文情报标题
  titleEn: string;           // 英文原标题
  score: number;             // 综合热度 0-100
  sourceLabel: string;       // 来源标记（如 "Google + WWD"）
  direction: TrendDirection; // 趋势方向
  timestamp: string;         // ISO时间
  entities?: {               // 提取的实体
    brands?: string[];
    events?: string[];
    people?: string[];
  };
}
