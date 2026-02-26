'use client';

import { useState } from 'react';
import type { HotItem } from '@/domain/types';
import { FavoriteToggle } from './FavoriteToggle';
import { HotItemsModal } from './HotItemsModal';

interface HotItemsSectionProps {
  items: HotItem[];
  displayCount?: number;
}

export function HotItemsSection({ items, displayCount = 6 }: HotItemsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayItems = items.slice(0, displayCount);
  const hasMore = items.length > displayCount;

  return (
    <>
      <section id="items" className="editor-card bg-neutral-50/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">
            👗 爆款单品
            <span className="text-xs font-normal text-neutral-500">
              Hot Items · 模拟数据
            </span>
          </h2>
          <div className="hidden sm:flex gap-2 text-[11px] text-neutral-600">
            <button className="pill-tab">All</button>
            <button className="pill-tab">Clothing</button>
            <button className="pill-tab">Bags</button>
            <button className="pill-tab">Shoes</button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-neutral-200 rounded-md overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-neutral-100 flex items-center justify-center text-[11px] text-neutral-400">
                图片占位 · {item.brand}
              </div>
              <div className="px-3.5 py-3 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      {item.brand}
                    </p>
                    <h3 className="text-sm text-neutral-900 line-clamp-2">
                      {item.name}
                    </h3>
                  </div>
                  <FavoriteToggle
                    id={item.id}
                    kind="hotItem"
                    label={item.name}
                    meta={item.brand}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-600">
                  <span>
                    {item.currency} {item.price.toLocaleString()}
                  </span>
                  <span>热度指数 {item.score}</span>
                </div>
                <button className="mt-1 text-[11px] underline-offset-2 hover:underline text-neutral-800 text-left">
                  前往购买
                </button>
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
            >
              查看全部 {items.length} 件单品
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </section>

      <HotItemsModal
        items={items}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
