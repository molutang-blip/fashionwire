'use client';

import { useMemo } from 'react';
import type { StyleKeyword } from '@/domain/types';

interface StyleWordCloudProps {
  keywords: StyleKeyword[];
}

function getColorByFrequency(frequency: number, maxFreq: number, minFreq: number): string {
  const range = maxFreq - minFreq;
  const normalized = range > 0 ? (frequency - minFreq) / range : 0.5;

  if (normalized > 0.8) {
    return 'text-brand font-bold';
  } else if (normalized > 0.6) {
    return 'text-rose-500 font-semibold';
  } else if (normalized > 0.4) {
    return 'text-amber-600 font-medium';
  } else if (normalized > 0.2) {
    return 'text-emerald-600';
  } else {
    return 'text-neutral-500';
  }
}

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
  const { maxFreq, minFreq, shuffledKeywords } = useMemo(() => {
    const frequencies = keywords.map(k => k.frequency);
    const max = Math.max(...frequencies);
    const min = Math.min(...frequencies);
    const shuffled = [...keywords].sort(() => Math.random() - 0.5);
    return { maxFreq: max, minFreq: min, shuffledKeywords: shuffled };
  }, [keywords]);

  return (
    <section id="keywords" className="editor-card bg-neutral-50/60">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-title mb-0">
          ☁️ 风格关键词云
          <span className="text-xs font-normal text-neutral-500">
            Style Keywords Cloud
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
        <span className="underline-offset-2">风格 / 廓形 / 颜色 / 材质</span> 关键词，
        是对情绪与审美方向的「背景噪音」扫描。热度越高，颜色越显眼。
      </p>

      <div className="relative min-h-[280px] sm:min-h-[320px] border border-neutral-200 rounded-lg bg-white p-6 sm:p-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 sm:gap-y-4">
        {shuffledKeywords.map((keyword, index) => {
          const colorClass = getColorByFrequency(keyword.frequency, maxFreq, minFreq);
          const sizeClass = getSizeByFrequency(keyword.frequency, maxFreq, minFreq);
          const rotation = (index % 3 === 0) ? 'rotate-[-3deg]' : (index % 3 === 1) ? 'rotate-[2deg]' : '';

          return (
            <span
              key={keyword.id}
              className={`
                inline-block cursor-default transition-all duration-300
                hover:scale-110 hover:opacity-80
                ${colorClass} ${sizeClass} ${rotation}
              `}
              title={`${keyword.keywordEn} · 热度 ${keyword.frequency}`}
            >
              {keyword.keywordZh}
            </span>
          );
        })}
      </div>

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
    </section>
  );
}
