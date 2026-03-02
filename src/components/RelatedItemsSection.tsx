'use client';

import type { RelatedItem } from '@/domain/types';

interface RelatedItemsSectionProps {
  items: RelatedItem[];
}

// 格式化价格
function formatPrice(price: number, currency?: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CNY: '¥',
  };
  const symbol = currency ? (symbols[currency] || currency + ' ') : '$';
  return `${symbol}${price.toLocaleString()}`;
}

export function RelatedItemsSection({ items }: RelatedItemsSectionProps) {
  // 最多显示5个
  const displayItems = items.slice(0, 5);

  return (
    <div className="relative">
      {/* 水平滚动容器 */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {displayItems.map((item) => (
          <a
            key={item.id}
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-shrink-0 w-36 snap-start"
          >
            {/* 产品图片 */}
            <div className="aspect-square rounded-lg overflow-hidden bg-neutral-100 mb-2">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* 产品信息 */}
            <div className="space-y-0.5">
              {/* 品牌名 */}
              <p className="text-[10px] uppercase tracking-wide text-neutral-400 truncate">
                {item.brand}
              </p>

              {/* 产品名 */}
              <p className="text-xs text-neutral-800 line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                {item.name}
              </p>

              {/* 价格（如果有） */}
              {item.price && (
                <p className="text-xs font-medium text-neutral-900">
                  {formatPrice(item.price, item.currency)}
                </p>
              )}

              {/* 外链提示 */}
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 group-hover:text-brand transition-colors">
                <span>查看详情</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* 右侧渐变提示（表示可滚动） */}
      {items.length > 3 && (
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      )}
    </div>
  );
}
