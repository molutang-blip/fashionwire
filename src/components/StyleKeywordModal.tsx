'use client';

import { useEffect, useState } from 'react';
import type { StyleKeywordDetail, OutfitOption } from '@/domain/types';
import { AIFittingSection } from './AIFittingSection';

interface StyleKeywordModalProps {
  detail: StyleKeywordDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

// 重要程度配置
const IMPORTANCE_CONFIG = {
  must: { label: '必备', color: '#EF4444', bgColor: '#FEE2E2' },
  recommended: { label: '推荐', color: '#F59E0B', bgColor: '#FEF3C7' },
  optional: { label: '可选', color: '#6B7280', bgColor: '#F3F4F6' },
};

export function StyleKeywordModal({ detail, isOpen, onClose }: StyleKeywordModalProps) {
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitOption | null>(null);

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

  // 弹窗关闭时重置选中状态
  useEffect(() => {
    if (!isOpen) {
      setSelectedOutfit(null);
    }
  }, [isOpen]);

  if (!isOpen || !detail) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-neutral-100 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl tracking-tight text-neutral-900 flex items-center gap-2">
                <span>🎨</span>
                <span>{detail.keywordZh}</span>
                <span className="text-neutral-400 font-normal">{detail.keywordEn}</span>
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                &quot;{detail.definition}&quot;
              </p>
              {detail.representativeFigures && detail.representativeFigures.length > 0 && (
                <p className="text-xs text-neutral-400 mt-1">
                  代表人物：{detail.representativeFigures.join('、')}
                </p>
              )}
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* 起源背景 */}
          {detail.origin && (
            <section>
              <p className="text-xs text-neutral-500 leading-relaxed bg-neutral-50 rounded-lg p-3">
                📖 {detail.origin}
              </p>
            </section>
          )}

          {/* 👗 穿搭公式 + 造型选择 - 左右布局 */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-4">
              <span>👗</span>
              <span>穿搭公式</span>
              <span className="text-xs font-normal text-neutral-400">Style Formula</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* 左侧：公式详情 (占 3 列) */}
              <div className="lg:col-span-3 space-y-5">
                {/* 核心单品列表 */}
                <div>
                  <p className="text-xs text-neutral-500 mb-2">核心单品</p>
                  <div className="space-y-2">
                    {detail.formula.coreItems.map((item, index) => {
                      const config = IMPORTANCE_CONFIG[item.importance];
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm"
                        >
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
                            style={{ color: config.color, backgroundColor: config.bgColor }}
                          >
                            {config.label}
                          </span>
                          <span className="text-neutral-500 w-10 flex-shrink-0">{item.category}</span>
                          <span className="text-neutral-800">{item.description}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 配色方案 */}
                <div>
                  <p className="text-xs text-neutral-500 mb-2">配色方案</p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm border border-neutral-200"
                        style={{ backgroundColor: detail.formula.colorPalette.primary }}
                        title="主色"
                      />
                      <div
                        className="w-8 h-8 rounded-lg shadow-sm border border-neutral-200"
                        style={{ backgroundColor: detail.formula.colorPalette.secondary }}
                        title="辅色"
                      />
                      {detail.formula.colorPalette.accent && (
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border border-neutral-200"
                          style={{ backgroundColor: detail.formula.colorPalette.accent }}
                          title="点缀色"
                        />
                      )}
                    </div>
                    <span className="text-xs text-neutral-600">
                      {detail.formula.colorPalette.name}
                    </span>
                  </div>
                </div>

                {/* 推荐材质 */}
                <div>
                  <p className="text-xs text-neutral-500 mb-2">推荐材质</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.formula.materials.map((material, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded text-xs"
                      >
                        {material}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 避免 */}
                {detail.formula.avoidItems && detail.formula.avoidItems.length > 0 && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">❌ 避免</p>
                    <p className="text-xs text-neutral-500">
                      {detail.formula.avoidItems.join(' · ')}
                    </p>
                  </div>
                )}
              </div>

              {/* 右侧：3套造型选择 (占 2 列) */}
              <div className="lg:col-span-2">
                <p className="text-xs text-neutral-500 mb-2">选择一套造型试穿 ↓</p>
                <div className="space-y-3">
                  {detail.outfits.map((outfit) => {
                    const isSelected = selectedOutfit?.id === outfit.id;
                    return (
                      <button
                        key={outfit.id}
                        onClick={() => setSelectedOutfit(outfit)}
                        className={`
                          w-full flex gap-3 p-2 rounded-lg border-2 transition-all text-left
                          ${isSelected
                            ? 'border-brand bg-brand/5 shadow-sm'
                            : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                          }
                        `}
                      >
                        {/* 造型图片 */}
                        <div className="relative w-16 h-20 flex-shrink-0 rounded-md overflow-hidden bg-neutral-100">
                          <img
                            src={outfit.imageUrl}
                            alt={outfit.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
                              <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* 造型信息 */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className={`text-sm font-medium ${isSelected ? 'text-brand' : 'text-neutral-800'}`}>
                            {outfit.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                            {outfit.description}
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-1">
                            {outfit.colorScheme}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* 🪞 AI 试穿 - 选择造型后显示 */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-3">
              <span>🪞</span>
              <span>试试这个风格</span>
              <span className="text-xs font-normal text-neutral-400">Try This Style</span>
            </h3>

            {selectedOutfit ? (
              <AIFittingSection
                styleKeywordId={detail.id}
                styleName={detail.keywordZh}
                selectedOutfit={selectedOutfit}
              />
            ) : (
              <div className="bg-neutral-50 rounded-lg p-6 text-center">
                <div className="w-12 h-12 mx-auto bg-neutral-200 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-500">请先在上方选择一套造型</p>
                <p className="text-xs text-neutral-400 mt-1">选择后可上传照片生成该风格的你</p>
              </div>
            )}
          </section>

          {/* 📸 风格示例 */}
          <section>
            <h3 className="flex items-center gap-2 text-sm font-medium text-neutral-900 mb-3">
              <span>📸</span>
              <span>更多灵感</span>
              <span className="text-xs font-normal text-neutral-400">Style Inspiration</span>
            </h3>
            <div
              className="flex gap-3 overflow-x-auto pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {detail.examples.map((example) => (
                <div
                  key={example.id}
                  className="flex-shrink-0 w-28"
                >
                  <div className="aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100 mb-1">
                    <img
                      src={example.imageUrl}
                      alt={example.caption || '风格示例'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {example.caption && (
                    <p className="text-[10px] text-neutral-500 line-clamp-2">
                      {example.caption}
                    </p>
                  )}
                  {example.source && (
                    <p className="text-[9px] text-neutral-400">
                      via {example.source}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-neutral-400">
            热度 {detail.frequency} · {detail.sources.length} 个平台讨论
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>分享穿搭公式</span>
          </button>
        </div>
      </div>
    </div>
  );
}
