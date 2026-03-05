'use client';

import { useState, useRef } from 'react';
import { generateStyleFitting } from '@/services/aiFitting';
import type { AIFittingResult, OutfitOption } from '@/domain/types';

interface AIFittingSectionProps {
  styleKeywordId: string;
  styleName: string;
  selectedOutfit: OutfitOption;
}

interface Measurements {
  height?: number;
  bust?: number;
  waist?: number;
  hips?: number;
}

export function AIFittingSection({ styleKeywordId, styleName, selectedOutfit }: AIFittingSectionProps) {
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
        outfitId: selectedOutfit.id,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 左侧：已选造型展示 */}
          <div className="bg-white rounded-lg p-3 border border-neutral-200">
            <p className="text-xs text-neutral-500 mb-2">已选造型</p>
            <div className="flex gap-3">
              <div className="w-20 h-28 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                <img
                  src={selectedOutfit.imageUrl}
                  alt={selectedOutfit.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800">{selectedOutfit.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{selectedOutfit.description}</p>
                <p className="text-[10px] text-neutral-400 mt-2">{selectedOutfit.colorScheme}</p>
              </div>
            </div>
          </div>

          {/* 右侧：上传区域 */}
          <div className="space-y-3">
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-4 text-center transition-colors
                ${uploadedImage ? 'border-brand bg-brand/5' : 'border-neutral-300 hover:border-neutral-400'}
              `}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {uploadedImage ? (
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={uploadedImage}
                      alt="上传的照片"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={handleClear}
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-neutral-700">照片已上传</p>
                    <p className="text-xs text-neutral-400">点击生成按钮开始</p>
                  </div>
                </div>
              ) : (
                <div className="py-2">
                  <div className="w-10 h-10 mx-auto bg-neutral-200 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-600">上传你的照片</p>
                  <p className="text-xs text-neutral-400 mt-0.5">JPG/PNG, 最大 5MB</p>
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

            {/* 三围数据（可选）- 折叠显示 */}
            <details className="text-xs">
              <summary className="text-neutral-500 cursor-pointer hover:text-neutral-700">
                + 添加三围数据（可选，提升效果）
              </summary>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">身高</label>
                  <input
                    type="number"
                    placeholder="165"
                    value={measurements.height || ''}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, height: Number(e.target.value) || undefined }))}
                    className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">胸围</label>
                  <input
                    type="number"
                    placeholder="86"
                    value={measurements.bust || ''}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, bust: Number(e.target.value) || undefined }))}
                    className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">腰围</label>
                  <input
                    type="number"
                    placeholder="66"
                    value={measurements.waist || ''}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, waist: Number(e.target.value) || undefined }))}
                    className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1">臀围</label>
                  <input
                    type="number"
                    placeholder="92"
                    value={measurements.hips || ''}
                    onChange={(e) => setMeasurements(prev => ({ ...prev, hips: Number(e.target.value) || undefined }))}
                    className="w-full px-2 py-1 text-xs border border-neutral-200 rounded focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* 错误提示 - 跨两列 */}
          {error && (
            <p className="md:col-span-2 text-xs text-rose-500">{error}</p>
          )}

          {/* 生成按钮 - 跨两列 */}
          <div className="md:col-span-2">
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
              className={`
                w-full py-2.5 rounded-lg text-sm font-medium transition-colors
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
                  <span>生成「{selectedOutfit.name}」风格的我</span>
                </>
              )}
            </button>
            <p className="mt-2 text-[10px] text-neutral-400 text-center">
              照片仅用于本次生成，不会被存储
            </p>
          </div>
        </div>
      ) : (
        /* 结果展示 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 原造型 */}
          <div>
            <p className="text-xs text-neutral-500 mb-2">选择的造型</p>
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-100">
              <img
                src={selectedOutfit.imageUrl}
                alt={selectedOutfit.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-neutral-600 mt-2 text-center">{selectedOutfit.name}</p>
          </div>

          {/* 生成结果 */}
          <div>
            <p className="text-xs text-neutral-500 mb-2">生成效果</p>
            <div className="aspect-[3/4] rounded-lg overflow-hidden bg-neutral-100">
              <img
                src={result.generatedImageUrl}
                alt={`${styleName} 风格`}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-brand mt-2 text-center font-medium">「{styleName}」风格的你 ✨</p>
          </div>

          {/* 操作按钮 - 跨两列 */}
          <div className="md:col-span-2 flex gap-2">
            <button
              onClick={handleClear}
              className="flex-1 py-2 text-sm text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              重新生成
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
