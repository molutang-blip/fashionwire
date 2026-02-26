'use client';

import { useState } from 'react';
import type { TrendingTopic } from '@/domain/types';
import { FavoriteToggle } from './FavoriteToggle';

interface TrendingSectionProps {
  topics: TrendingTopic[];
  maxVisible?: number;
}

function DirectionIcon({ direction }: { direction: TrendingTopic["direction"] }) {
  if (direction === "up") return <span className="text-emerald-600">▲</span>;
  if (direction === "down") return <span className="text-rose-500">▼</span>;
  return <span className="text-neutral-400">◆</span>;
}

export function TrendingSection({ topics, maxVisible = 5 }: TrendingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayTopics = isExpanded ? topics : topics.slice(0, maxVisible);
  const hasMore = topics.length > maxVisible;

  return (
    <div className="editor-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="section-title mb-0">
          🔥 全球时尚热搜榜
          <span className="text-xs font-normal text-neutral-500">
            Global Fashion Trending
          </span>
        </h2>
        <div className="hidden sm:flex gap-2 text-[11px] text-neutral-600">
          <button className="pill-tab">All</button>
          <button className="pill-tab">Social</button>
          <button className="pill-tab">Search</button>
          <button className="pill-tab">E‑commerce</button>
        </div>
      </div>
      <p className="text-[11px] text-neutral-500 mb-2">
        聚焦过去 24 小时内在社交媒体与搜索平台上被频繁提及的时尚相关{" "}
        <span className="underline-offset-2">事件 / 人物 / 话题</span>，
        如红毯造型、秀场片段与行业大事件。
      </p>
      <div className="divide-y divide-neutral-100 flex-1 overflow-hidden">
        {displayTopics.map((topic, index) => (
          <article
            key={topic.id}
            className="py-2.5 flex items-start gap-3 sm:gap-4"
          >
            <div className="w-7 text-xs text-neutral-400 pt-0.5">
              #{String(index + 1).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-neutral-900 truncate">
                  {topic.titleZh}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-500 whitespace-nowrap">
                  <DirectionIcon direction={topic.direction} />
                  <span>{topic.score}</span>
                  <FavoriteToggle
                    id={topic.id}
                    kind="trending"
                    label={topic.titleZh}
                    meta={topic.titleEn}
                  />
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                <span className="badge border-none bg-neutral-100">
                  {topic.sourceLabel}
                </span>
                <span>{topic.timestamp}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="mt-2 pt-2 border-t border-neutral-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-700 transition-colors py-1"
          >
            {isExpanded ? (
              <>
                收起
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                展开更多 ({topics.length - maxVisible} 条)
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
