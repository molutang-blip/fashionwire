// =====================================================
// 融合层主入口 — 串联: 读取 → 实体提取 → 归并 → 计算 → 写入
// =====================================================

import {
  getRecentTopics,
  insertFusedTrends,
  getPreviousFusedTrends,
  cleanOldFusedTrends,
} from '@/lib/supabase';
import type { DBFusedTrend } from '@/domain/types';
import { annotateTopics, mergeIntoGroups, calculateScore, applyDecay, generateTitle, generateTags } from './scoring';

export async function runFusion(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('[Fusion] 开始融合流程...');

    // Step 1: 读取最近24小时原始数据
    const rawTopics = await getRecentTopics(24);
    console.log(`[Fusion] 读取到 ${rawTopics.length} 条原始数据`);

    if (rawTopics.length === 0) {
      console.warn('[Fusion] 无数据可融合');
      return { success: false, count: 0, error: '无原始数据' };
    }

    // Step 2: 实体标注
    const annotated = annotateTopics(rawTopics);

    // Step 3: 事件归并
    const groups = mergeIntoGroups(annotated);
    console.log(`[Fusion] 归并为 ${groups.length} 个事件组`);

    // Step 4: 获取上一批数据（用于趋势方向判断）
    const previousTrends = await getPreviousFusedTrends();
    const prevMap = new Map<string, number>();
    for (const p of previousTrends) {
      if (p.top_entity) prevMap.set(p.top_entity, p.score);
    }

    // Step 5: 计算每组的分数、标题、标签
    const batchId = `batch_${Date.now()}`;
    const results: Omit<DBFusedTrend, 'id' | 'created_at' | 'updated_at'>[] = [];

    for (const group of groups) {
      // 热度计算
      const { score: rawScore, rawScores } = calculateScore(group, rawTopics);

      // 衰减 — 用最新一条的时间
      const latestTime = group.topics
        .map(t => t.topic.created_at)
        .sort()
        .pop() || new Date().toISOString();
      const score = applyDecay(rawScore, latestTime);

      if (score <= 0) continue; // 过期数据跳过

      // 标题
      const { zh: titleZh, en: titleEn } = generateTitle(group);

      // 标签
      const tags = generateTags(group);

      // 趋势方向
      const prevScore = prevMap.get(group.topEntity.name);
      let direction = 'flat';
      let changePercent: number | null = null;
      if (prevScore !== undefined && prevScore > 0) {
        const pct = ((score - prevScore) / prevScore) * 100;
        changePercent = Math.round(pct);
        if (pct > 10) direction = 'up';
        else if (pct < -10) direction = 'down';
      } else {
        // 新上榜 = up
        direction = 'up';
      }

      results.push({
        title_zh: titleZh,
        title_en: titleEn,
        score,
        direction,
        change_percent: changePercent,
        sources: Array.from(group.sources),
        source_labels: Array.from(group.sourceLabels),
        entities: group.entities,
        tags,
        top_entity: group.topEntity.name,
        entity_type: group.topEntity.type,
        source_topic_ids: group.sourceIds,
        raw_scores: rawScores,
        batch_id: batchId,
      });
    }

    // Step 6: 按分数排序，取 Top 15
    results.sort((a, b) => b.score - a.score);
    const top15 = results.slice(0, 15);

    // Step 7: 写入 fused_trends
    await insertFusedTrends(top15);

    // Step 8: 清理旧批次（保留最近10批）
    await cleanOldFusedTrends(10);

    console.log(`[Fusion] 完成，写入 ${top15.length} 条融合结果`);
    return { success: true, count: top15.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : '未知错误';
    console.error('[Fusion] 融合失败:', msg);
    return { success: false, count: 0, error: msg };
  }
}
