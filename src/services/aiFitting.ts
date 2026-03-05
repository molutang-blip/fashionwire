import type { AIFittingRequest, AIFittingResult } from '@/domain/types';

/**
 * AI 试穿服务
 * MVP 阶段使用 mock 实现，后续接入真实 API
 */

// 模拟 API 延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock 生成结果图片（基于风格返回不同的示例图）
const MOCK_GENERATED_IMAGES: Record<string, string> = {
  'quiet-luxury': 'https://picsum.photos/seed/ai-quiet-luxury/600/800',
  'old-money': 'https://picsum.photos/seed/ai-old-money/600/800',
  'dopamine-dressing': 'https://picsum.photos/seed/ai-dopamine/600/800',
  'maillard': 'https://picsum.photos/seed/ai-maillard/600/800',
  'cool-girl': 'https://picsum.photos/seed/ai-cool-girl/600/800',
};

/**
 * 生成风格化试穿图片
 * @param request AI 试穿请求参数
 * @returns 生成结果
 */
export async function generateStyleFitting(request: AIFittingRequest): Promise<AIFittingResult> {
  // MVP: 模拟 API 调用延迟（2-4秒）
  const processingTime = 2000 + Math.random() * 2000;
  await delay(processingTime);

  // MVP: 随机模拟失败（10% 概率）
  if (Math.random() < 0.1) {
    throw new Error('AI 服务暂时不可用，请稍后重试');
  }

  // 返回 mock 结果
  const generatedImageUrl = MOCK_GENERATED_IMAGES[request.styleKeywordId]
    || `https://picsum.photos/seed/ai-${request.styleKeywordId}/600/800`;

  return {
    generatedImageUrl,
    styleKeywordId: request.styleKeywordId,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 真实 API 实现（预留）
 * 后续可替换为实际的 AI 试穿服务调用
 */
// export async function generateStyleFittingReal(request: AIFittingRequest): Promise<AIFittingResult> {
//   const response = await fetch('/api/ai-fitting', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       styleKeywordId: request.styleKeywordId,
//       userPhoto: request.userPhoto,
//       measurements: request.measurements,
//     }),
//   });
//
//   if (!response.ok) {
//     throw new Error('生成失败，请稍后重试');
//   }
//
//   return response.json();
// }
