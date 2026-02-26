'use client';

import { DailyAvatar } from './DailyAvatar';

interface BriefingData {
  hotTopic: string;
  hotTopicSource: string;
  styleKeyword: string;
  styleKeywordEn: string;
  hotCategory: string;
  focusArea: string;
}

interface DailyBriefingProps {
  data: BriefingData;
}

export function DailyBriefing({ data }: DailyBriefingProps) {
  return (
    <div className="editor-card h-full flex flex-col">
      <div className="badge mb-3">Daily Briefing · 当日总览</div>
      <h1 className="font-display text-2xl sm:text-3xl tracking-tight leading-snug mb-3">
        今天的全球时尚长什么样？
      </h1>
      <p className="text-sm text-neutral-700 leading-relaxed mb-4">
        基于过去 24 小时的社交讨论、搜索趋势与电商信号，我们为你汇总出今日最值得关注的时尚情报。
      </p>

      <div className="flex-1 grid grid-cols-[1fr,140px] sm:grid-cols-[1fr,180px] gap-4 items-stretch">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-neutral-600 content-center">
          <div className="bg-neutral-50 rounded-md p-2.5">
            <p className="uppercase tracking-wide mb-1 text-neutral-400 text-[10px]">
              🔥 今日最高热度话题
            </p>
            <p className="text-neutral-900 font-medium">
              {data.hotTopic}
            </p>
            <p className="text-neutral-500 text-[10px] mt-0.5">
              {data.hotTopicSource}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-md p-2.5">
            <p className="uppercase tracking-wide mb-1 text-neutral-400 text-[10px]">
              📈 上升最快风格关键词
            </p>
            <p className="text-neutral-900 font-medium">
              {data.styleKeyword}
            </p>
            <p className="text-neutral-500 text-[10px] mt-0.5">
              {data.styleKeywordEn}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-md p-2.5">
            <p className="uppercase tracking-wide mb-1 text-neutral-400 text-[10px]">
              🛒 电商侧爆发品类
            </p>
            <p className="text-neutral-900 font-medium">
              {data.hotCategory}
            </p>
          </div>

          <div className="bg-neutral-50 rounded-md p-2.5">
            <p className="uppercase tracking-wide mb-1 text-neutral-400 text-[10px]">
              ✨ 适合你的今日焦点
            </p>
            <p className="text-neutral-900 font-medium">
              {data.focusArea}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-lg overflow-hidden">
          <DailyAvatar
            hotTopic={data.hotTopic}
            styleKeyword={data.styleKeyword}
            hotCategory={data.hotCategory}
            focusArea={data.focusArea}
          />
        </div>
      </div>
    </div>
  );
}
