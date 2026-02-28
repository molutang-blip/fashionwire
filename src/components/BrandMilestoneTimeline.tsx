'use client';

import { useState } from 'react';
import type { BrandMilestone, BrandMilestoneType } from '@/domain/types';

interface BrandMilestoneTimelineProps {
  milestones: BrandMilestone[];
}

// 事件类型配置
const MILESTONE_CONFIG: Record<BrandMilestoneType, { icon: string; color: string; label: string }> = {
  personnel: { icon: '👔', color: '#EF4444', label: '人事变动' },
  financial: { icon: '📊', color: '#3B82F6', label: '财报/业绩' },
  marketing: { icon: '🎯', color: '#8B5CF6', label: '营销动作' },
  product: { icon: '🛍️', color: '#F59E0B', label: '产品动态' },
};

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// 格式化完整日期
function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function BrandMilestoneTimeline({ milestones }: BrandMilestoneTimelineProps) {
  const [filter, setFilter] = useState<BrandMilestoneType | 'all'>('all');

  // 按日期倒序排列
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 筛选事件
  const filteredMilestones = filter === 'all'
    ? sortedMilestones
    : sortedMilestones.filter(m => m.type === filter);

  return (
    <div className="space-y-3">
      {/* 筛选按钮 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 text-[11px] rounded-full transition-colors ${
            filter === 'all'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          全部
        </button>
        {(Object.entries(MILESTONE_CONFIG) as [BrandMilestoneType, typeof MILESTONE_CONFIG[BrandMilestoneType]][]).map(
          ([type, config]) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full transition-colors ${
                filter === type
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </button>
          )
        )}
      </div>

      {/* 时间线 */}
      <div className="relative pl-6 space-y-0">
        {/* 垂直连接线 */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-neutral-200" />

        {filteredMilestones.map((milestone, index) => {
          const config = MILESTONE_CONFIG[milestone.type];
          return (
            <div
              key={milestone.id}
              className="relative pb-4 last:pb-0"
            >
              {/* 节点圆点 */}
              <div
                className="absolute left-[-15px] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: config.color }}
              />

              {/* 事件内容 */}
              <div className="group">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {formatDate(milestone.date)}
                  </span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${config.color}15`,
                      color: config.color,
                    }}
                  >
                    {config.icon} {config.label}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-neutral-900 group-hover:text-brand transition-colors">
                  {milestone.title}
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {milestone.description}
                </p>
              </div>
            </div>
          );
        })}

        {filteredMilestones.length === 0 && (
          <div className="py-4 text-center text-sm text-neutral-400">
            暂无相关事件
          </div>
        )}
      </div>
    </div>
  );
}
