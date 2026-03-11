// =====================================================
// 归并算法 + 热度计算 + 中文标题生成 + 标签生成
// =====================================================

import type { DBTrendingTopic } from '@/domain/types';
import type { EntitySet, EntityType } from '@/domain/types';
import { extractEntities, entityOverlap, mergeEntities, pickTopEntity } from './entities';

// ----- 术语映射词典 -----
const TERM_MAP: [RegExp, string][] = [
  [/fashion week/gi, '时装周'],
  [/spring\/summer|spring summer|ss\d{2}/gi, '春夏系列'],
  [/fall\/winter|fall winter|fw\d{2}/gi, '秋冬系列'],
  [/collaboration|collab\b/gi, '联名合作'],
  [/collection/gi, '系列发布'],
  [/launch|release|drop\b/gi, '新品发售'],
  [/campaign/gi, '广告大片'],
  [/streetwear/gi, '街头服饰'],
  [/haute couture/gi, '高级定制'],
  [/runway|catwalk/gi, '秀场'],
  [/lookbook/gi, '造型手册'],
  [/vintage/gi, '复古'],
  [/minimalist/gi, '极简风格'],
  [/sustainable/gi, '可持续时尚'],
  [/resort/gi, '度假系列'],
];

/** 标签生成规则 */
const TAG_RULES: [RegExp, string][] = [
  [/fashion week|时装周|runway|catwalk/i, '时装周'],
  [/collaborat|collab|联名/i, '联名合作'],
  [/haute couture|高级定制/i, '高级定制'],
  [/streetwear|街头/i, '街头服饰'],
  [/sustainab|可持续/i, '可持续时尚'],
  [/launch|release|drop|发售/i, '新品发售'],
  [/campaign|广告/i, '广告大片'],
  [/collection|系列/i, '系列发布'],
  [/met gala/i, 'Met Gala'],
  [/coachella/i, 'Coachella'],
];

// ----- 带实体信息的原始数据 -----
export interface AnnotatedTopic {
  topic: DBTrendingTopic;
  entities: EntitySet;
}

// ----- 融合后的事件组 -----
export interface FusedGroup {
  topics: AnnotatedTopic[];
  entities: EntitySet;
  topEntity: { name: string; type: EntityType };
  sources: Set<string>;
  sourceLabels: Set<string>;
  sourceIds: string[];
}

/** Step 1: 给每条数据标注实体 */
export function annotateTopics(topics: DBTrendingTopic[]): AnnotatedTopic[] {
  return topics.map(t => ({
    topic: t,
    entities: extractEntities([t.title_en, t.title_zh].filter(Boolean).join(' ')),
  }));
}

/** Step 2: 词重叠相似度 (简化版 Jaccard) */
function wordSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
  return overlap / Math.min(wordsA.size, wordsB.size);
}

/** Step 3: 判断两条是否属于同一事件 (PRD规则) */
function shouldMerge(a: AnnotatedTopic, b: AnnotatedTopic): boolean {
  const titleA = a.topic.title_en || a.topic.title_zh;
  const titleB = b.topic.title_en || b.topic.title_zh;

  // 规则1: 标题词重叠 > 80%
  if (wordSimilarity(titleA, titleB) > 0.8) return true;

  // 规则2: 共享实体 >= 2
  if (entityOverlap(a.entities, b.entities) >= 2) return true;

  // 规则3: 时间差<24h 且共享实体>=1
  const timeDiff = Math.abs(
    new Date(a.topic.created_at).getTime() - new Date(b.topic.created_at).getTime()
  );
  if (timeDiff < 24 * 60 * 60 * 1000 && entityOverlap(a.entities, b.entities) >= 1) {
    return true;
  }

  return false;
}

/** Step 4: 归并所有数据为事件组 */
export function mergeIntoGroups(annotated: AnnotatedTopic[]): FusedGroup[] {
  const groups: FusedGroup[] = [];

  for (const item of annotated) {
    let merged = false;

    for (const group of groups) {
      const shouldJoin = group.topics.some(t => shouldMerge(t, item));
      if (shouldJoin) {
        group.topics.push(item);
        group.entities = mergeEntities(group.entities, item.entities);
        group.sources.add(item.topic.source);
        group.sourceLabels.add(item.topic.source_label || item.topic.source);
        group.sourceIds.push(item.topic.id);
        group.topEntity = pickTopEntity(group.entities);
        merged = true;
        break;
      }
    }

    if (!merged) {
      groups.push({
        topics: [item],
        entities: { ...item.entities },
        topEntity: pickTopEntity(item.entities),
        sources: new Set([item.topic.source]),
        sourceLabels: new Set([item.topic.source_label || item.topic.source]),
        sourceIds: [item.topic.id],
      });
    }
  }

  return groups;
}

/** Step 5: 热度加权计算 (PRD: Google*0.35 + RSS*0.35 + Reddit*0.30) */
export function calculateScore(group: FusedGroup, allTopics: DBTrendingTopic[]): {
  score: number;
  rawScores: { google: number; rss: number; reddit: number };
} {
  // 先求各源的 min/max 用于归一化
  const bySource: Record<string, number[]> = { google: [], rss: [], reddit: [] };
  for (const t of allTopics) {
    if (bySource[t.source]) bySource[t.source].push(t.score);
  }

  function normalize(val: number, source: string): number {
    const vals = bySource[source];
    if (!vals || vals.length === 0) return 0;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max === min) return 50;
    return ((val - min) / (max - min)) * 100;
  }

  // 各源的最高分
  let googleRaw = 0, rssRaw = 0, redditRaw = 0;

  for (const at of group.topics) {
    const s = at.topic.source;
    const normalized = normalize(at.topic.score, s);
    // 考虑媒体权重
    const mediaWeight = at.topic.raw_data?.media_weight || 1.0;
    const weighted = normalized * mediaWeight;

    if (s === 'google') googleRaw = Math.max(googleRaw, weighted);
    if (s === 'rss') rssRaw = Math.max(rssRaw, weighted);
    if (s === 'reddit') redditRaw = Math.max(redditRaw, weighted);
  }

  // PRD 加权
  const W = { google: 0.35, rss: 0.35, reddit: 0.30 };
  const activeSources = [
    googleRaw > 0 ? 'google' : null,
    rssRaw > 0 ? 'rss' : null,
    redditRaw > 0 ? 'reddit' : null,
  ].filter(Boolean) as string[];

  // 如果某源缺失，按比例重分权重
  let totalW = activeSources.reduce((sum, s) => sum + (W as any)[s], 0);
  if (totalW === 0) totalW = 1;

  const score = Math.round(
    (googleRaw * W.google + rssRaw * W.rss + redditRaw * W.reddit) / totalW
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    rawScores: {
      google: Math.round(googleRaw),
      rss: Math.round(rssRaw),
      reddit: Math.round(redditRaw),
    },
  };
}

/** Step 6: 热度衰减 (PRD: exp(-0.1 * days)) */
export function applyDecay(score: number, createdAt: string): number {
  const daysDiff = (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000);
  const factor = Math.exp(-0.1 * daysDiff);
  return Math.round(score * factor);
}

/** Step 7: 生成中文情报标题 */
export function generateTitle(group: FusedGroup): { zh: string; en: string } {
  const { brands, people, events } = group.entities;
  const firstBrand = brands[0] || '';
  const firstPerson = people[0] || '';
  const firstEvent = events[0] || '';

  // 从原始标题中检测事件关键词
  const allText = group.topics.map(t => t.topic.title_en || '').join(' ');
  let eventZh = '';
  for (const [re, zh] of TERM_MAP) {
    if (re.test(allText)) { eventZh = zh; break; }
  }
  if (!eventZh && firstEvent) eventZh = firstEvent;

  // 情绪词
  const buzzwords = ['引发关注', '引发热议', '备受瞩目', '成为焦点', '持续升温'];
  const buzz = buzzwords[Math.floor(Math.random() * buzzwords.length)];

  // 模板选择
  let zh = '';
  if (firstPerson && firstBrand && eventZh) {
    zh = `${firstPerson} × ${firstBrand} ${eventZh}${buzz}`;
  } else if (firstBrand && eventZh) {
    zh = `${firstBrand} ${eventZh}${buzz}`;
  } else if (firstPerson && eventZh) {
    zh = `${firstPerson} ${eventZh}${buzz}`;
  } else if (firstBrand && firstPerson) {
    zh = `${firstPerson} 携手 ${firstBrand} ${buzz}`;
  } else if (brands.length >= 2) {
    zh = `${brands[0]} 与 ${brands[1]} 热度对比：本周谁更受关注`;
  } else if (firstBrand) {
    zh = `${firstBrand} ${eventZh || '最新动态'}${buzz}`;
  } else if (firstPerson) {
    zh = `${firstPerson} ${eventZh || '时尚动态'}${buzz}`;
  } else if (firstEvent) {
    zh = `${firstEvent} ${buzz}`;
  } else {
    // 兜底：用原始标题做简单翻译
    const raw = group.topics[0]?.topic.title_en || group.topics[0]?.topic.title_zh || '时尚热点';
    zh = raw.length > 40 ? raw.substring(0, 40) + '...' : raw;
  }

  const en = group.topEntity.name;
  return { zh, en };
}

/** Step 8: 生成标签 */
export function generateTags(group: FusedGroup): string[] {
  const tags: string[] = [];
  const allText = group.topics.map(t =>
    [t.topic.title_en, t.topic.title_zh].filter(Boolean).join(' ')
  ).join(' ');

  for (const [re, tag] of TAG_RULES) {
    if (re.test(allText) && !tags.includes(tag)) {
      tags.push(tag);
      if (tags.length >= 3) break;
    }
  }

  // 补充品牌/人物标签
  if (tags.length < 3) {
    for (const b of group.entities.brands) {
      if (tags.length >= 3) break;
      if (!tags.includes(b)) tags.push(b);
    }
  }

  return tags.slice(0, 3);
}
