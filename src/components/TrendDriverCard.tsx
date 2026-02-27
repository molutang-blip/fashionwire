'use client';

import { useState } from 'react';
import type { TrendDriverEnhanced, TrendSource } from '@/domain/types';

interface TrendDriverCardProps {
  driver: TrendDriverEnhanced;
}

interface TrendDriverListProps {
  drivers: TrendDriverEnhanced[];
  initialCount?: number;
}

// 平台图标配置
const PLATFORM_ICONS: Record<TrendSource, { icon: string; color: string }> = {
  instagram: { icon: '📷', color: '#E4405F' },
  tiktok: { icon: '🎵', color: '#000000' },
  xiaohongshu: { icon: '📕', color: '#FE2C55' },
  weibo: { icon: '🔴', color: '#E6162D' },
  google: { icon: '🔍', color: '#4285F4' },
  baidu: { icon: '🐾', color: '#2932E1' },
  amazon: { icon: '📦', color: '#FF9900' },
  taobao: { icon: '🛒', color: '#FF5000' },
};

// 角色标签配置
const ROLE_LABELS: Record<TrendDriverEnhanced['role'], string> = {
  celebrity: '明星',
  kol: 'KOL',
  brand: '品牌',
  media: '媒体',
};

// 计算相对时间
function getRelativeTime(isoTime: string): string {
  const now = new Date();
  const time = new Date(isoTime);
  const diffMs = now.getTime() - time.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else {
    return '刚刚';
  }
}

// 格式化数字
function formatNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}w`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

// 单个 KOL 卡片
function TrendDriverCard({ driver }: TrendDriverCardProps) {
  const platformConfig = PLATFORM_ICONS[driver.platform];

  return (
    <div className="group relative bg-white border border-neutral-200 rounded-lg p-3 hover:border-neutral-300 hover:shadow-sm transition-all">
      {/* 首发者徽章 */}
      {driver.isFirstMover && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium shadow-sm">
          🥇首发
        </div>
      )}

      {/* 头部：头像 + 基础信息 */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={driver.avatar}
            alt={driver.name}
            className="w-10 h-10 rounded-full bg-neutral-200 object-cover"
          />
          {/* 平台图标 */}
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white border border-neutral-200 shadow-sm"
            title={driver.platform}
          >
            {platformConfig?.icon || '🌐'}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-medium text-sm text-neutral-900 truncate">{driver.name}</h4>
            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded">
              {ROLE_LABELS[driver.role]}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {getRelativeTime(driver.firstPostTime)}首发
          </p>
        </div>
      </div>

      {/* 数据指标 */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-neutral-400">发布</span>
          <span className="font-semibold text-neutral-700">{driver.postCount}条</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-neutral-400">互动</span>
          <span className="font-semibold text-neutral-700">{formatNumber(driver.engagementTotal)}</span>
        </div>
      </div>

      {/* 内容预览（如果有） */}
      {driver.previewContent && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          {driver.previewContent.type === 'image' && driver.previewContent.thumbnail && (
            <div className="relative">
              <img
                src={driver.previewContent.thumbnail}
                alt="内容预览"
                className="w-full h-20 object-cover rounded bg-neutral-100"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded transition-colors" />
            </div>
          )}
          {driver.previewContent.type === 'text' && driver.previewContent.text && (
            <p className="text-[11px] text-neutral-500 line-clamp-2 italic">
              "{driver.previewContent.text}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// KOL 列表组件（带展开/收起）
export function TrendDriverList({ drivers, initialCount = 6 }: TrendDriverListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 按首发时间排序，首发者优先
  const sortedDrivers = [...drivers].sort((a, b) => {
    // 首发者始终在最前
    if (a.isFirstMover && !b.isFirstMover) return -1;
    if (!a.isFirstMover && b.isFirstMover) return 1;
    // 其他按时间排序
    return new Date(a.firstPostTime).getTime() - new Date(b.firstPostTime).getTime();
  });

  const displayDrivers = isExpanded ? sortedDrivers : sortedDrivers.slice(0, initialCount);
  const hasMore = sortedDrivers.length > initialCount;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayDrivers.map(driver => (
          <TrendDriverCard key={driver.id} driver={driver} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>收起 ↑</>
          ) : (
            <>查看更多 ({sortedDrivers.length - initialCount}位) ↓</>
          )}
        </button>
      )}
    </div>
  );
}

export { TrendDriverCard };
