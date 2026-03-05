'use client';

import { useMemo, useState } from 'react';
import type { StyleKeyword, StyleKeywordDetail } from '@/domain/types';
import { StyleKeywordModal } from './StyleKeywordModal';

// 导入风格详情数据
import styleKeywordDetails from '@/../data/style_keyword_details.json';

interface StyleWordCloudProps {
  keywords: StyleKeyword[];
}

// 类型断言：JSON 数据转换为正确类型
const STYLE_DETAILS = styleKeywordDetails as Record<string, StyleKeywordDetail>;

// 根据热度返回颜色类名
function getColorByFrequency(frequency: number, maxFreq: number, minFreq: number): string {
  const range = maxFreq - minFreq;
  const normalized = range > 0 ? (frequency - minFreq) / range : 0.5;

  // 热度越高，颜色越显眼（从浅灰到品牌色）
  if (normalized > 0.8) {
    return 'text-brand font-bold'; // 最高热度 - 品牌色
  } else if (normalized > 0.6) {
    return 'text-rose-500 font-semibold'; // 高热度 - 玫红
  } else if (normalized > 0.4) {
    return 'text-amber-600 font-medium'; // 中高热度 - 琥珀
  } else if (normalized > 0.2) {
    return 'text-emerald-600'; // 中热度 - 翠绿
  } else {
    return 'text-neutral-500'; // 低热度 - 灰色
  }
}

// 根据热度返回字体大小
function getSizeByFrequency(frequency: number, maxFreq: number, minFreq: number): string {
  const range = maxFreq - minFreq;
  const normalized = range > 0 ? (frequency - minFreq) / range : 0.5;

  if (normalized > 0.8) {
    return 'text-2xl sm:text-3xl';
  } else if (normalized > 0.6) {
    return 'text-xl sm:text-2xl';
  } else if (normalized > 0.4) {
    return 'text-lg sm:text-xl';
  } else if (normalized > 0.2) {
    return 'text-base sm:text-lg';
  } else {
    return 'text-sm sm:text-base';
  }
}

export function StyleWordCloud({ keywords }: StyleWordCloudProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<StyleKeywordDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { maxFreq, minFreq, shuffledKeywords } = useMemo(() => {
    const frequencies = keywords.map(k => k.frequency);
    const max = Math.max(...frequencies);
    const min = Math.min(...frequencies);

    // 打乱顺序使词云看起来更自然
    const shuffled = [...keywords].sort(() => Math.random() - 0.5);

    return { maxFreq: max, minFreq: min, shuffledKeywords: shuffled };
  }, [keywords]);

  // 处理关键词点击
  const handleKeywordClick = (keyword: StyleKeyword) => {
    const detail = STYLE_DETAILS[keyword.id];
    if (detail) {
      setSelectedKeyword(detail);
      setIsModalOpen(true);
    }
  };

  // 关闭弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedKeyword(null);
  };

  // 检查关键词是否有详情数据
  const hasDetail = (keywordId: string) => !!STYLE_DETAILS[keywordId];

  return (
    <>
      <section id="keywords" className="editor-card bg-neutral-50/60">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-title mb-0">
            ✨ 风格灵感
            <span className="text-xs font-normal text-neutral-500">
              Style Inspiration · 点击探索穿搭公式
            </span>
          </h2>
          <div className="hidden sm:flex gap-2 text-[11px] text-neutral-600">
            <button className="pill-tab">本周</button>
            <button className="pill-tab">上周</button>
            <button className="pill-tab">近 30 天</button>
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 mb-4">
          按周维度聚合过去一段时间内反复出现的{" "}
          <span className="underline-offset-2">风格 / 廓形 / 颜色 / 材质</span> 关键词。
          <span className="text-brand font-medium">点击任意关键词</span>，查看穿搭公式并试穿该风格。
        </p>

        {/* 词云区域 */}
        <div className="relative min-h-[280px] sm:min-h-[320px] border border-neutral-200 rounded-lg bg-white p-6 sm:p-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4">
          {shuffledKeywords.map((keyword, index) => {
            const colorClass = getColorByFrequency(keyword.frequency, maxFreq, minFreq);
            const sizeClass = getSizeByFrequency(keyword.frequency, maxFreq, minFreq);
            const hasDetailData = hasDetail(keyword.id);

            // 添加一些随机的旋转和位移效果
            const rotation = (index % 3 === 0) ? 'rotate-[-3deg]' : (index % 3 === 1) ? 'rotate-[2deg]' : '';

            return (
              <button
                key={keyword.id}
                onClick={() => handleKeywordClick(keyword)}
                disabled={!hasDetailData}
                className={`
                  inline-block transition-all duration-300
                  ${hasDetailData
                    ? 'cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95'
                    : 'cursor-default opacity-60'
                  }
                  ${colorClass} ${sizeClass} ${rotation}
                `}
                title={hasDetailData
                  ? `${keyword.keywordEn} · 热度 ${keyword.frequency} · 点击查看穿搭公式`
                  : `${keyword.keywordEn} · 热度 ${keyword.frequency} · 详情即将上线`
                }
              >
                {keyword.keywordZh}
                {hasDetailData && (
                  <span className="ml-1 text-[10px] opacity-60">→</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] text-neutral-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-brand"></span>
            <span>极高热度</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span>高热度</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-600"></span>
            <span>中高热度</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
            <span>中热度</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-neutral-400"></span>
            <span>一般热度</span>
          </div>
        </div>

        {/* 提示信息 */}
        <p className="mt-3 text-center text-[10px] text-neutral-400">
          💡 点击带 → 标记的关键词，查看穿搭公式、风格示例，还可以 AI 试穿
        </p>
      </section>

      {/* 风格详情弹窗 */}
      <StyleKeywordModal
        detail={selectedKeyword}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
