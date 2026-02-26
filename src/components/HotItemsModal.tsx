'use client';

import { useEffect, useRef } from 'react';
import type { HotItem } from '@/domain/types';
import { FavoriteToggle } from './FavoriteToggle';

interface HotItemsModalProps {
  items: HotItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function HotItemsModal({ items, isOpen, onClose }: HotItemsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="font-display text-xl tracking-wide">
              👗 全部爆款单品
            </h2>
            <p className="text-[11px] text-neutral-500 mt-1">
              共 {items.length} 件单品
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors text-neutral-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="bg-white border border-neutral-200 rounded-md overflow-hidden flex flex-col hover:shadow-md transition-shadow"
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
        </div>
      </div>
    </div>
  );
}
