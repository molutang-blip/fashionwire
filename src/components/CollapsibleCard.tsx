'use client';

import { useState, ReactNode } from 'react';

interface CollapsibleCardProps {
  title: string;
  titleEn?: string;
  icon: string;
  defaultExpanded?: boolean;
  summary?: string;           // 折叠时显示的摘要
  children: ReactNode;
}

export function CollapsibleCard({
  title,
  titleEn,
  icon,
  defaultExpanded = true,
  summary,
  children,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
      {/* 卡片头部 - 可点击展开/折叠 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base flex-shrink-0">{icon}</span>
          <h3 className="font-medium text-sm text-neutral-900 truncate">{title}</h3>
          {titleEn && (
            <span className="text-xs text-neutral-400 hidden sm:inline">{titleEn}</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 折叠时显示摘要 */}
          {!isExpanded && summary && (
            <span className="text-xs text-neutral-500 max-w-[150px] truncate hidden sm:inline">
              {summary}
            </span>
          )}
          {/* 展开/折叠图标 */}
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 卡片内容 - 带动画展开/折叠 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-1 border-t border-neutral-100">
          {children}
        </div>
      </div>
    </div>
  );
}
