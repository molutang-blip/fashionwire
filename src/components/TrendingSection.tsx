'use client';

import { useRef, useState } from 'react';
import type { TrendingTopic, TrendingTopicDetail } from '@/domain/types';
import { FavoriteToggle } from './FavoriteToggle';
import { TrendDetailModal } from './TrendDetailModal';
import trendingDetailsRaw from '../../data/trending_details.json';
const trendingDetails = trendingDetailsRaw as Record<string, Omit<TrendingTopicDetail, keyof TrendingTopic>>;

interface TrendingSectionProps {
  topics: TrendingTopic[];
}

function DirectionIcon({ direction }: { direction: TrendingTopic["direction"] }) {
  if (direction === "up") return <span className="text-emerald-600">▲</span>;
  if (direction === "down") return <span className="text-rose-500">▼</span>;
  return <span className="text-neutral-400">◆</span>;
}

export function TrendingSection({ topics }: TrendingSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopicDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const displayTopics = topics.slice(0, 10);

  const handleTopicClick = (topic: TrendingTopic) => {
    const detail = trendingDetails[topic.id];
    if (detail) {
      const fullTopic: TrendingTopicDetail = {
        ...topic,
        ...detail,
      };
      setSelectedTopic(fullTopic);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="editor-card h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title mb-0 flex items-baseline gap-1">
            <span>🔥 全球时尚热榜</span>
            <span className="text-xs font-normal text-neutral-500">Global Fashion Trending</span>
          </h2>
          <div className="hidden sm:flex gap-2 text-[11px] text-neutral-600">
            <button className="pill-tab">All</button>
            <button className="pill-tab">Social</button>
            <button className="pill-tab">Search</button>
            <button className="pill-tab">E‑commerce</button>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 mb-2">
          过去 24 小时社交媒体与搜索平台上被频繁提及的时尚事件 / 人物 / 话题
        </p>

        <div
          ref={scrollRef}
          className="divide-y divide-neutral-100 flex-1 overflow-y-auto scrollbar-hide hover:scrollbar-show"
          style={{
            maxHeight: '320px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#d4d4d4 transparent'
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 4px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background-color: #d4d4d4;
              border-radius: 4px;
            }
            div:not(:hover)::-webkit-scrollbar-thumb {
              background-color: transparent;
            }
          `}</style>
          {displayTopics.map((topic, index) => (
            <article
              key={topic.id}
              className="py-2 flex items-start gap-3 sm:gap-4 cursor-pointer hover:bg-neutral-50 -mx-2 px-2 rounded transition-colors"
              onClick={() => handleTopicClick(topic)}
            >
              <div className="w-7 text-xs text-neutral-400 pt-0.5">
                #{String(index + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium text-neutral-900 truncate hover:text-[#D97757] transition-colors">
                    {topic.titleZh}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 whitespace-nowrap">
                    <DirectionIcon direction={topic.direction} />
                    <span>{topic.score}</span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <FavoriteToggle
                        id={topic.id}
                        kind="trending"
                        label={topic.titleZh}
                        meta={topic.titleEn}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                  <span className="badge border-none bg-neutral-100 py-0">
                    {topic.sourceLabel}
                  </span>
                  <span>{topic.timestamp}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-neutral-100 text-center">
          <p className="text-[10px] text-neutral-400">
            ↕ 鼠标悬停可滚动查看全部 {displayTopics.length} 条 · 点击词条查看详情
          </p>
        </div>
      </div>

      <TrendDetailModal
        topic={selectedTopic}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
