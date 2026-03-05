'use client';

import { useState, useRef } from 'react';
import { generateStyleFitting } from '@/services/aiFitting';
import type { AIFittingResult } from '@/domain/types';

interface AIFittingSectionProps {
  styleKeywordId: string;
  styleName: string;
}

interface Measurements {
  height?: number;
  bust?: number;
  waist?: number;
  hips?: number;
}

export function AIFittingSection({ styleKeywordId, styleName }: AIFittingSectionProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<Measurements>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIFittingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件');
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    // 读取并转换为 base64
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setError(null);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  // 处理拖放上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setError(null);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // 生成风格化图片
  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('请先上传照片');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateStyleFitting({
        styleKeywordId,
        userPhoto: uploadedImage,
        measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
      });
      setResult(response);
    } catch (err) {
      setError('生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 清除上传的图片
  const handleClear = () => {
    setUploadedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-neutral-50 rounded-lg p-4">
      {!result ? (
        <>
          {/* 上传区域 */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${uploadedImage ? 'border-brand bg-brand/5' : 'border-neutral-300 hover:border-neutral-400'}
            `}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {uploadedImage ? (
              <div className="space-y-3">
                <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden">
                  <img
                    src={uploadedImage}
                    alt="上传的照片"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={handleClear}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-neutral-600">照片已上传，点击下方按钮生成</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-neutral-200 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600">点击上传或拖拽照片到此处</p>
                <p className="text-xs text-neutral-400">支持 JPG、PNG，最大 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* 三围数据（可选） */}
          <div className="mt-4">
            <p className="text-xs text-neutral-500 mb-2">
              三围数据（可选，提升生成效果）
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">身高 cm</label>
                <input
                  type="number"
                  placeholder="165"
                  value={measurements.height || ''}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, height: Number(e.target.value) || undefined }))}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">胸围 cm</label>
                <input
                  type="number"
                  placeholder="86"
                  value={measurements.bust || ''}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, bust: Number(e.target.value) || undefined }))}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">腰围 cm</label>
                <input
                  type="number"
                  placeholder="66"
                  value={measurements.waist || ''}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, waist: Number(e.target.value) || undefined }))}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral-400 mb-1">臀围 cm</label>
                <input
                  type="number"
                  placeholder="92"
                  value={measurements.hips || ''}
                  onChange={(e) => setMeasurements(prev => ({ ...prev, hips: Number(e.target.value) || undefined }))}
                  className="w-full px-2 py-1.5 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="mt-3 text-xs text-rose-500">{error}</p>
          )}

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!uploadedImage || isGenerating}
            className={`
              mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors
              flex items-center justify-center gap-2
              ${uploadedImage && !isGenerating
                ? 'bg-brand text-white hover:bg-brand/90'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>生成「{styleName}」风格的我</span>
              </>
            )}
          </button>

          <p className="mt-2 text-[10px] text-neutral-400 text-center">
            照片仅用于本次生成，不会被存储或用于其他用途
          </p>
        </>
      ) : (
        /* 结果展示 */
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-neutral-100">
            <img
              src={result.generatedImageUrl}
              alt={`${styleName} 风格`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 py-2 text-sm text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              重新上传
            </button>
            <button
              className="flex-1 py-2 text-sm text-white bg-brand rounded-lg hover:bg-brand/90 transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              保存图片
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
