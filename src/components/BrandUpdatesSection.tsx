'use client';

import { useRef, useState } from 'react';
import type { BrandUpdate, BrandUpdateDetail } from '@/domain/types';
import { FavoriteToggle } from './FavoriteToggle';
import { BrandDetailModal } from './BrandDetailModal';
import brandDetailsRaw from '../../data/brand_details.json';

// 类型断言
const brandDetails = brandDetailsRaw as unknown as Record<string, Omit<BrandUpdateDetail, 'brandId'>>;

interface BrandUpdatesSectionProps {
  updates: BrandUpdate[];
  maxVisible?: number;
}

export function BrandUpdatesSection({ updates, maxVisible = 5 }: BrandUpdatesSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<BrandUpdate | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<BrandUpdateDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 只取前10条
  const displayUpdates = updates.slice(0, 10);

  // 点击条目时，获取详情数据并打开弹窗
  const handleUpdateClick = (update: BrandUpdate) => {
    const detail = brandDetails[update.id];
    if (detail) {
      setSelectedUpdate(update);
      setSelectedDetail({
        ...detail,
        brandId: update.id,
      } as BrandUpdateDetail);
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div id="brands" className="editor-card h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title mb-0">
            🏢 品牌动态
            <span className="text-xs font-normal text-neutral-500 ml-1">
              Brand Intelligence
            </span>
          </h2>
          <button className="pill-tab text-[11px]">View All Brands</button>
        </div>
        <p className="text-[11px] text-neutral-500 mb-2">
          汇总全球重点品牌的秀场发布与商业动向，按时间排序，帮助你快速浏览行业「今天在发生什么」。
        </p>

        {/* 可滚动区域 - 鼠标悬停时可滚动 */}
        <div
          ref={scrollRef}
          className="space-y-1.5 text-[11px] text-neutral-700 flex-1 overflow-y-auto scrollbar-hide hover:scrollbar-show"
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
          {displayUpdates.map((item) => (
            <article
              key={item.id}
              className="border border-neutral-200 rounded-md px-3 py-2 bg-white/70 hover:bg-white hover:border-neutral-300 transition-colors cursor-pointer"
              onClick={() => handleUpdateClick(item)}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-neutral-900 text-[10px] text-white flex items-center justify-center flex-shrink-0">
                    {item.brand.slice(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">
                      <span className="font-medium">{item.brand}</span>
                      <span className="text-neutral-400 mx-1">·</span>
                      <span className="text-neutral-500">{item.group}</span>
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {item.type === "runway"
                        ? "Show / Collection"
                        : item.type === "collection"
                        ? "Collection"
                        : "Business"}{" "}
                      · {item.date}
                    </p>
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <FavoriteToggle
                    id={item.id}
                    kind="brandUpdate"
                    label={item.title}
                    meta={item.brand}
                  />
                </div>
              </div>
              <p className="text-[11px] text-neutral-800 leading-snug line-clamp-1 hover:text-[#D97757] transition-colors">
                {item.title}
              </p>
              <p className="text-[10px] text-neutral-500 leading-snug line-clamp-1 mt-0.5">
                {item.summary}
              </p>
            </article>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-2 pt-2 border-t border-neutral-100 text-center">
          <p className="text-[10px] text-neutral-400">
            ↕ 鼠标悬停可滚动查看全部 {displayUpdates.length} 条 · 点击查看品牌详情
          </p>
        </div>
      </div>

      {/* 品牌详情弹窗 */}
      <BrandDetailModal
        update={selectedUpdate}
        detail={selectedDetail}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
