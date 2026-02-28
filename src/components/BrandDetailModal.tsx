'use client';

import { useEffect } from 'react';
import type { BrandUpdate, BrandUpdateDetail } from '@/domain/types';
import { CollapsibleCard } from './CollapsibleCard';
import { BrandMilestoneTimeline } from './BrandMilestoneTimeline';

interface BrandDetailModalProps {
  update: BrandUpdate | null;
  detail: BrandUpdateDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

// 动态类型配置
const UPDATE_TYPE_CONFIG = {
  runway: { label: 'Show / Runway', color: '#8B5CF6' },
  collection: { label: 'Collection', color: '#3B82F6' },
  business: { label: 'Business', color: '#10B981' },
};

// 格式化货币
function formatCurrency(value: number, unit: string, currency: string): string {
  const currencySymbol: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
  };
  const symbol = currencySymbol[currency] || currency;
  return `${symbol}${value}${unit}`;
}

// 增长/下跌显示
function ChangeIndicator({ value }: { value: number }) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  return (
    <span
      className={`text-xs font-medium ${
        isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-500' : 'text-neutral-500'
      }`}
    >
      {isPositive ? '↑' : isNegative ? '↓' : '→'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function BrandDetailModal({ update, detail, isOpen, onClose }: BrandDetailModalProps) {
  // ESC 关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !update || !detail) return null;

  const typeConfig = UPDATE_TYPE_CONFIG[update.type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-neutral-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* 头部 */}
        <div className="px-6 py-4 bg-white border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {/* 品牌 Logo 占位 */}
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center text-lg font-medium flex-shrink-0">
                {detail.brandName.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg tracking-tight text-neutral-900">
                  {detail.brandName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-neutral-500">{detail.brandNameZh}</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-sm text-neutral-400">{detail.group}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-600 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 可滚动内容区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* 卡片1: 本次动态详情 - 默认展开 */}
          <CollapsibleCard
            icon="📰"
            title="本次动态"
            titleEn="Latest Update"
            defaultExpanded={true}
            summary={update.title.slice(0, 20) + '...'}
          >
            <div className="space-y-3">
              {/* 类型标签 + 日期 */}
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 text-[11px] rounded-full text-white"
                  style={{ backgroundColor: typeConfig.color }}
                >
                  {typeConfig.label}
                </span>
                <span className="text-xs text-neutral-400">{update.date}</span>
              </div>

              {/* 标题 */}
              <div>
                <h3 className="text-base font-medium text-neutral-900">
                  {detail.newsDetail.titleZh}
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {detail.newsDetail.titleEn}
                </p>
              </div>

              {/* 配图 */}
              {detail.newsDetail.imageUrl && (
                <div className="relative rounded-lg overflow-hidden bg-neutral-100">
                  <img
                    src={detail.newsDetail.imageUrl}
                    alt={detail.newsDetail.titleZh}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* 正文内容 */}
              <p className="text-sm text-neutral-700 leading-relaxed">
                {detail.newsDetail.content}
              </p>

              {/* 原文链接 */}
              <a
                href={detail.newsDetail.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
              >
                <span>阅读原文</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </CollapsibleCard>

          {/* 卡片2: 品牌大事记 - 默认展开 */}
          <CollapsibleCard
            icon="📅"
            title="品牌大事记"
            titleEn="Brand Milestones (3Y)"
            defaultExpanded={true}
            summary={`近3年 ${detail.milestones.length} 个关键事件`}
          >
            <BrandMilestoneTimeline milestones={detail.milestones} />
          </CollapsibleCard>

          {/* 卡片3: 关键经营数据 - 默认折叠 */}
          <CollapsibleCard
            icon="📊"
            title="关键经营数据"
            titleEn="Financial Highlights"
            defaultExpanded={false}
            summary={`${detail.financials.annualRevenue.year}年营收 ${formatCurrency(
              detail.financials.annualRevenue.value,
              detail.financials.annualRevenue.unit,
              detail.financials.annualRevenue.currency
            )}`}
          >
            <div className="space-y-4">
              {/* 年度 & 季度营收 */}
              <div className="grid grid-cols-2 gap-4">
                {/* 年度营收 */}
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-[11px] text-neutral-500 mb-1">
                    {detail.financials.annualRevenue.year} 年度营收
                  </p>
                  <p className="text-xl font-semibold text-neutral-900">
                    {formatCurrency(
                      detail.financials.annualRevenue.value,
                      detail.financials.annualRevenue.unit,
                      detail.financials.annualRevenue.currency
                    )}
                  </p>
                  <div className="mt-1">
                    <ChangeIndicator value={detail.financials.annualRevenue.yoyChange} />
                    <span className="text-[10px] text-neutral-400 ml-1">同比</span>
                  </div>
                </div>

                {/* 季度营收 */}
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-[11px] text-neutral-500 mb-1">
                    {detail.financials.quarterlyRevenue.year} {detail.financials.quarterlyRevenue.quarter} 营收
                  </p>
                  <p className="text-xl font-semibold text-neutral-900">
                    {formatCurrency(
                      detail.financials.quarterlyRevenue.value,
                      detail.financials.quarterlyRevenue.unit,
                      detail.financials.quarterlyRevenue.currency
                    )}
                  </p>
                  <div className="mt-1">
                    <ChangeIndicator value={detail.financials.quarterlyRevenue.yoyChange} />
                    <span className="text-[10px] text-neutral-400 ml-1">同比</span>
                  </div>
                </div>
              </div>

              {/* 区域营收分布 */}
              <div>
                <p className="text-xs font-medium text-neutral-700 mb-2">区域营收分布</p>
                <div className="space-y-2">
                  {detail.financials.regionBreakdown.map((region) => (
                    <div key={region.region} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-neutral-600 truncate">
                        {region.region}
                      </div>
                      <div className="flex-1 h-4 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-500"
                          style={{ width: `${region.percentage}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs text-neutral-600">
                        {region.percentage}%
                      </div>
                      <div className="w-14 text-right">
                        <ChangeIndicator value={region.yoyChange} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 数据来源 */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                <span>数据来源: {detail.financials.dataSource}</span>
                <span>更新于 {detail.financials.lastUpdated}</span>
              </div>
            </div>
          </CollapsibleCard>
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>收藏品牌</span>
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>分享</span>
          </button>
        </div>
      </div>
    </div>
  );
}
