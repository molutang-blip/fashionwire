'use client';

import { useEffect } from 'react';
import type { TrendingTopicDetailEnhanced, TrendSource, PlatformBreakdownEnhanced } from '@/domain/types';
import { TrendTimeline } from './TrendTimeline';
import { TrendDriverList } from './TrendDriverCard';

interface TrendDetailModalEnhancedProps {
  topic: TrendingTopicDetailEnhanced | null;
  isOpen: boolean;
  onClose: () => void;
}

// 平台显示配置
const PLATFORM_CONFIG: Record<TrendSource, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: '#E4405F' },
  tiktok: { label: 'TikTok', color: '#000000' },
  xiaohongshu: { label: '小红书', color: '#FE2C55' },
  weibo: { label: '微博', color: '#E6162D' },
  google: { label: 'Google', color: '#4285F4' },
  baidu: { label: '百度', color: '#2932E1' },
  amazon: { label: 'Amazon', color: '#FF9900' },
  taobao: { label: '淘宝', color: '#FF5000' },
};

// 数据来源标签
const DATA_SOURCE_LABELS: Record<PlatformBreakdownEnhanced['dataSource'], { label: string; color: string }> = {
  official_api: { label: '官方API', color: '#10B981' },
  aggregator: { label: '聚合平台', color: '#F59E0B' },
  estimated: { label: '估算', color: '#6B7280' },
};

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === 'up') return <span className="text-emerald-600">▲</span>;
  if (direction === 'down') return <span className="text-rose-500">▼</span>;
  return <span className="text-neutral-400">◆</span>;
}

function PlatformBreakdownChart({ breakdown }: { breakdown: PlatformBreakdownEnhanced[] }) {
  const sorted = [...breakdown].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-2">
      {sorted.map((item) => {
        const config = PLATFORM_CONFIG[item.platform] || { label: item.platform, color: '#666' };
        const sourceConfig = DATA_SOURCE_LABELS[item.dataSource];
        return (
          <div key={item.platform} className="flex items-center gap-3">
            <div className="w-16 text-[11px] text-neutral-600 truncate">
              {config.label}
            </div>
            <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: config.color,
                }}
              />
            </div>
            <div className="w-12 text-right text-[11px] text-neutral-600">
              {item.percentage}%
            </div>
            {/* 数据来源小标签 */}
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: sourceConfig.color }}
              title={`数据来源: ${sourceConfig.label}`}
            />
          </div>
        );
      })}
      {/* 图例 */}
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-neutral-100 text-[9px] text-neutral-400">
        <span>数据来源:</span>
        {Object.entries(DATA_SOURCE_LABELS).map(([key, config]) => (
          <span key={key} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
            {config.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TrendDetailModalEnhanced({ topic, isOpen, onClose }: TrendDetailModalEnhancedProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !topic) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl tracking-tight text-neutral-900">
                {topic.titleZh}
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {topic.titleEn}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 核心指标 */}
          <div className="flex items-center gap-3 mt-3 text-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-900 text-white rounded-full">
              <span className="font-semibold">{topic.score}</span>
              <DirectionIcon direction={topic.direction} />
            </div>
            <span className="text-neutral-500">{topic.timestamp}</span>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">
              {topic.sourceLabel}
            </span>
          </div>
        </div>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 📈 趋势时间线（新增核心模块） */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-3">
              <span>📈</span>
              <span>趋势演变</span>
              <span className="text-xs font-normal text-neutral-400">Trend Timeline</span>
            </h3>
            <TrendTimeline data={topic.timeline} />
          </section>

          {/* 📊 跨平台热度分布 */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-3">
              <span>📊</span>
              <span>跨平台热度分布</span>
              <span className="text-xs font-normal text-neutral-400">Cross-Platform Breakdown</span>
            </h3>
            <PlatformBreakdownChart breakdown={topic.platformBreakdown} />
          </section>

          {/* 💡 关键洞察 */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-2">
              <span>💡</span>
              <span>关键洞察</span>
              <span className="text-xs font-normal text-neutral-400">Key Insight</span>
            </h3>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-4">
              <p className="text-sm text-neutral-700 leading-relaxed">
                &quot;{topic.keyInsight}&quot;
              </p>
            </div>
          </section>

          {/* 👗 谁在带这个风（增强版） */}
          {topic.trendDrivers && topic.trendDrivers.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-3">
                <span>👗</span>
                <span>谁在带这个风</span>
                <span className="text-xs font-normal text-neutral-400">Trend Drivers</span>
                <span className="ml-auto text-[10px] text-neutral-400">
                  共 {topic.trendDrivers.length} 位参与者
                </span>
              </h3>
              <TrendDriverList drivers={topic.trendDrivers} initialCount={4} />
            </section>
          )}

          {/* 📸 精选内容 */}
          {topic.curatedPosts && topic.curatedPosts.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-3">
                <span>📸</span>
                <span>精选内容</span>
                <span className="text-xs font-normal text-neutral-400">Curated Posts</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {topic.curatedPosts.slice(0, 2).map((post) => {
                  const platformConfig = PLATFORM_CONFIG[post.platform];
                  return (
                    <a
                      key={post.id}
                      href={post.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-300 transition-colors"
                    >
                      <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                        <img
                          src={post.thumbnail}
                          alt={post.description}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div
                          className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] text-white"
                          style={{ backgroundColor: platformConfig?.color || '#666' }}
                        >
                          {platformConfig?.label || post.platform}
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] text-neutral-600 line-clamp-2">
                          {post.description}
                        </p>
                        {(post.likes ?? 0) > 0 || (post.comments ?? 0) > 0 ? (
                          <div className="flex gap-3 mt-1 text-[10px] text-neutral-400">
                            {(post.likes ?? 0) > 0 && <span>❤ {((post.likes ?? 0) / 1000).toFixed(0)}k</span>}
                            {(post.comments ?? 0) > 0 && <span>💬 {((post.comments ?? 0) / 1000).toFixed(1)}k</span>}
                          </div>
                        ) : null}
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>收藏</span>
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>生成分享图</span>
          </button>
        </div>
      </div>
    </div>
  );
}
