import type { AIFittingRequest, AIFittingResult } from '@/domain/types';

/**
 * AI 试穿服务
 * MVP 阶段使用 mock 实现，后续接入真实 API
 */

// 模拟 API 延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock 生成结果图片（基于造型 ID 返回不同的示例图）
const MOCK_GENERATED_IMAGES: Record<string, string> = {
  // 静奢风造型
  'ql-outfit-1': 'https://picsum.photos/seed/ai-ql-1/600/800',
  'ql-outfit-2': 'https://picsum.photos/seed/ai-ql-2/600/800',
  'ql-outfit-3': 'https://picsum.photos/seed/ai-ql-3/600/800',
  // 老钱风造型
  'om-outfit-1': 'https://picsum.photos/seed/ai-om-1/600/800',
  'om-outfit-2': 'https://picsum.photos/seed/ai-om-2/600/800',
  'om-outfit-3': 'https://picsum.photos/seed/ai-om-3/600/800',
  // 多巴胺穿搭造型
  'dd-outfit-1': 'https://picsum.photos/seed/ai-dd-1/600/800',
  'dd-outfit-2': 'https://picsum.photos/seed/ai-dd-2/600/800',
  'dd-outfit-3': 'https://picsum.photos/seed/ai-dd-3/600/800',
  // 美拉德色系造型
  'ml-outfit-1': 'https://picsum.photos/seed/ai-ml-1/600/800',
  'ml-outfit-2': 'https://picsum.photos/seed/ai-ml-2/600/800',
  'ml-outfit-3': 'https://picsum.photos/seed/ai-ml-3/600/800',
  // 清冷感造型
  'cg-outfit-1': 'https://picsum.photos/seed/ai-cg-1/600/800',
  'cg-outfit-2': 'https://picsum.photos/seed/ai-cg-2/600/800',
  'cg-outfit-3': 'https://picsum.photos/seed/ai-cg-3/600/800',
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

  // 优先根据 outfitId 返回对应图片，否则使用通用图片
  const generatedImageUrl = MOCK_GENERATED_IMAGES[request.outfitId]
    || `https://picsum.photos/seed/ai-${request.outfitId}/600/800`;

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
//       outfitId: request.outfitId,
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
