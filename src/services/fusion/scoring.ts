// =====================================================
// 归并算法 + 热度计算 + 中文标题生成 + 标签生成
// =====================================================

import type { DBTrendingTopic } from '@/domain/types';
import type { EntitySet, EntityType } from '@/domain/types';
import { extractEntities, entityOverlap, mergeEntities, pickTopEntity } from './entities';

// ----- 术语映射词典（大幅扩展） -----
const TERM_MAP: [RegExp, string][] = [
  // 时装周 & 秀场
  [/fashion week/gi, '时装周'],
  [/runway|catwalk/gi, '秀场'],
  [/haute couture/gi, '高级定制'],
  [/resort/gi, '度假系列'],
  [/ready[- ]to[- ]wear|RTW/gi, '成衣系列'],
  [/pre[- ]fall/gi, '早秋系列'],
  [/couture/gi, '高定'],
  // 系列 & 发布
  [/spring\/summer|spring summer|ss\d{2}/gi, '春夏系列'],
  [/fall\/winter|fall winter|fw\d{2}/gi, '秋冬系列'],
  [/collection/gi, '系列发布'],
  [/launch|release|drop\b/gi, '新品发售'],
  [/debut/gi, '首次亮相'],
  [/unveil|reveal/gi, '揭晓'],
  [/lookbook/gi, '造型手册'],
  [/campaign/gi, '广告大片'],
  // 合作 & 商业
  [/collaboration|collab\b/gi, '联名合作'],
  [/partnership/gi, '合作'],
  [/acquisition|acquire/gi, '收购'],
  [/merger/gi, '合并'],
  [/IPO|going public/gi, '上市'],
  [/revenue|sales|profit/gi, '业绩'],
  [/store|boutique|flagship/gi, '门店'],
  [/retail/gi, '零售'],
  [/e[- ]commerce|online shop/gi, '电商'],
  // 风格 & 趋势
  [/streetwear/gi, '街头服饰'],
  [/vintage/gi, '复古'],
  [/minimalist/gi, '极简风格'],
  [/sustainable|sustainability|eco[- ]friendly/gi, '可持续时尚'],
  [/luxury/gi, '奢侈品'],
  [/athleisure/gi, '运动休闲'],
  [/denim/gi, '牛仔'],
  [/sneaker/gi, '球鞋'],
  [/handbag|bag\b/gi, '手袋'],
  [/accessori/gi, '配饰'],
  [/jewelry|jewellery/gi, '珠宝'],
  [/watch|timepiece/gi, '腕表'],
  [/fragrance|perfume/gi, '香水'],
  [/beauty|makeup|cosmetic/gi, '美妆'],
  [/skincare/gi, '护肤'],
  // 人物 & 事件
  [/celebrity|celeb\b/gi, '名人'],
  [/influencer/gi, '博主'],
  [/model\b/gi, '模特'],
  [/designer/gi, '设计师'],
  [/creative director/gi, '创意总监'],
  [/ambassador/gi, '品牌大使'],
  [/red carpet/gi, '红毯'],
  [/award|gala/gi, '颁奖典礼'],
  [/exhibition|exhibit/gi, '展览'],
  [/interview/gi, '专访'],
  [/controversy|scandal/gi, '争议'],
  [/trend(?:ing|s)?\b/gi, '趋势'],
  [/viral/gi, '爆款'],
  [/sold out/gi, '售罄'],
  [/waitlist/gi, '排队抢购'],
  [/iconic/gi, '经典'],
  [/rebrand/gi, '品牌重塑'],
  [/logo/gi, '标识'],
  [/outfit|look\b|style/gi, '穿搭'],
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
  [/sneaker|球鞋/i, '球鞋'],
  [/luxury|奢侈/i, '奢侈品'],
  [/beauty|美妆|makeup/i, '美妆'],
  [/jewelry|珠宝/i, '珠宝'],
  [/bag|handbag|手袋/i, '手袋'],
  [/vintage|复古/i, '复古'],
  [/trend|趋势/i, '趋势'],
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

/** Step 7: 生成中文情报标题（基于正文内容，语义化生成） */
export function generateTitle(group: FusedGroup): { zh: string; en: string } {
  const { brands, people, events } = group.entities;
  const firstBrand = brands[0] || '';
  const firstPerson = people[0] || '';
  const firstEvent = events[0] || '';

  // 收集所有文本：标题 + 正文内容（raw_data.article_content）
  const allTitleText = group.topics.map(t =>
    [t.topic.title_en || '', t.topic.title_zh || ''].join(' ')
  ).join(' ');

  // 提取每条原始数据的正文内容（RSS的article_content）
  const allBodyText = group.topics
    .map(t => (t.topic.raw_data as any)?.article_content || '')
    .filter(Boolean)
    .join(' ');

  const allText = [allTitleText, allBodyText].join(' ');

  // --- 收集所有匹配到的中文术语 ---
  const matchedTerms: string[] = [];
  for (const [re, zh] of TERM_MAP) {
    re.lastIndex = 0;
    if (re.test(allText) && !matchedTerms.includes(zh)) {
      matchedTerms.push(zh);
      if (matchedTerms.length >= 4) break;
    }
  }
  const eventZh = matchedTerms[0] || '';

  // --- 从正文提取数字/业绩类信息（增加标题信息量）---
  const percentMatch = allBodyText.match(/(\d+(?:\.\d+)?)\s*%/);
  const percentStr = percentMatch ? `${percentMatch[1]}%` : '';

  const salesMatch = allBodyText.match(/\$[\d,.]+ (?:billion|million)/i);
  const salesStr = salesMatch
    ? salesMatch[0].replace('billion', '亿').replace('million', '百万')
    : '';

  // --- 检测语义场景（用于选择更精准的标题模板）---
  const isCollabContent =
    /collabo|collab|partner|team(?:ing)? up|joint|联名|合作/i.test(allText);
  const isFinancialContent =
    /revenue|sales|profit|earnings|quarterly|annual|业绩|财报|营收|下滑|增长/i.test(allText);
  const isLaunchContent =
    /launch|release|drop|unveil|debut|introduce|发布|发售|首发|亮相/i.test(allText);
  const isRunwayContent =
    /runway|show|collection|catwalk|走秀|大秀|系列/i.test(allText);
  const isControversyContent =
    /controversy|scandal|backlash|criticis|dispute|争议|丑闻|抵制/i.test(allText);
  const isBuyContent =
    /sold out|waitlist|buy|purchase|restock|售罄|补货|抢购/i.test(allText);
  const isAmbassadorContent =
    /ambassador|spokesperson|endorse|代言|品牌大使/i.test(allText);
  const isPriceContent =
    /price|cost|expensive|afford|cheap|定价|涨价|降价|溢价/i.test(allText);
  const isTrendContent =
    /trend|trendin|viral|popular|热门|爆款|流行/i.test(allText);
  const isRedcarpetContent =
    /red carpet|award|gala|oscars|grammy|cannes|红毯|颁奖|典礼/i.test(allText);

  // 情绪词（按场景选择）
  const buzzwords: string[] = [];
  if (isControversyContent) buzzwords.push('引发争议', '陷入风波', '掀起讨论');
  else if (isBuyContent) buzzwords.push('火速售罄', '引发抢购热潮', '一件难求');
  else if (isFinancialContent) buzzwords.push('最新业绩曝光', '财报引关注', '市场表现亮眼');
  else if (isLaunchContent) buzzwords.push('正式发布', '全球首发', '重磅上线');
  else if (isRunwayContent) buzzwords.push('惊艳亮相', '引领风潮', '成为焦点');
  else if (isAmbassadorContent) buzzwords.push('官宣代言', '品牌大使确认', '强强联合');
  else buzzwords.push('引发关注', '引发热议', '备受瞩目', '成为焦点', '持续升温');

  const buzz = buzzwords[Math.floor(Math.random() * buzzwords.length)];

  // =====================================================
  // 标题模板选择（优先级从高到低，语义化）
  // =====================================================
  let zh = '';

  // T1: 财务/业绩类（包含数字更有价值）
  if (isFinancialContent && firstBrand) {
    if (percentStr) {
      zh = `${firstBrand} 业绩${percentStr.startsWith('-') ? '下滑' : '增长'} ${percentStr}，${buzz}`;
    } else if (salesStr) {
      zh = `${firstBrand} ${salesStr} 营收数据引关注`;
    } else {
      zh = `${firstBrand} 最新业绩曝光，${buzz}`;
    }
  }
  // T2: 争议/危机类（最高关注度）
  else if (isControversyContent && firstBrand) {
    zh = `${firstBrand} ${eventZh || '品牌'}${buzz}`;
  }
  // T3: 代言类
  else if (isAmbassadorContent && firstPerson && firstBrand) {
    zh = `${firstPerson} 出任 ${firstBrand} 品牌大使，${buzz}`;
  }
  // T4: 联名类
  else if (isCollabContent && firstBrand && firstPerson) {
    zh = `${firstPerson} × ${firstBrand} 联名单品${buzz}`;
  } else if (isCollabContent && brands.length >= 2) {
    zh = `${brands[0]} × ${brands[1]} 联名${buzz}`;
  }
  // T5: 红毯/颁奖类（人物+事件）
  else if (isRedcarpetContent && firstPerson) {
    const eventName = firstEvent || '颁奖典礼';
    zh = `${firstPerson} 亮相${eventName}，${buzz}`;
  }
  // T6: 发售/发布类
  else if (isLaunchContent && firstBrand) {
    zh = `${firstBrand} ${eventZh || '新品'}正式发布，${buzz}`;
  }
  // T7: 秀场/系列类
  else if (isRunwayContent && firstBrand) {
    const season = /spring|summer|ss/i.test(allText) ? '春夏' : /fall|winter|fw/i.test(allText) ? '秋冬' : '';
    zh = `${firstBrand} ${season}${eventZh || '新系列'}${buzz}`;
  }
  // T8: 球鞋/潮品抢购
  else if (isBuyContent && firstBrand) {
    zh = `${firstBrand} 新品${buzz}`;
  }
  // T9: 趋势类
  else if (isTrendContent && firstBrand) {
    zh = `${firstBrand} ${eventZh || '话题'}持续升温，${buzz}`;
  }
  // T10: 人物+品牌（通用）
  else if (firstPerson && firstBrand && eventZh) {
    zh = `${firstPerson} 身着 ${firstBrand} ${eventZh}${buzz}`;
  } else if (firstPerson && firstBrand) {
    zh = `${firstPerson} 携手 ${firstBrand}，${buzz}`;
  }
  // T11: 仅品牌+事件类型
  else if (firstBrand && eventZh) {
    zh = `${firstBrand} ${eventZh}${buzz}`;
  }
  // T12: 仅人物+事件
  else if (firstPerson && firstEvent) {
    zh = `${firstPerson} ${firstEvent}${buzz}`;
  }
  // T13: 多品牌对比
  else if (brands.length >= 2) {
    zh = `${brands[0]} vs ${brands[1]}：本周谁更受时尚圈关注`;
  }
  // T14: 仅品牌
  else if (firstBrand) {
    zh = `${firstBrand} ${eventZh || matchedTerms[0] || '最新动态'}${buzz}`;
  }
  // T15: 仅人物
  else if (firstPerson) {
    zh = `${firstPerson} ${eventZh || matchedTerms[0] || '时尚动态'}${buzz}`;
  }
  // T16: 仅事件
  else if (firstEvent) {
    zh = `${firstEvent} ${buzz}`;
  }
  // T17: 有术语匹配
  else if (matchedTerms.length >= 2) {
    zh = `${matchedTerms[0]}｜${matchedTerms[1]} ${buzz}`;
  } else if (matchedTerms.length === 1) {
    zh = `时尚${matchedTerms[0]} ${buzz}`;
  }
  // T18: 终极兜底 — 直接用正文提炼
  else {
    zh = fallbackTitle(allText, buzz);
  }

  // 标题长度控制（不超过30字符）
  if (zh.length > 32) {
    zh = zh.substring(0, 30) + '…';
  }

  const en = group.topEntity.name;
  return { zh, en };
}

// ----- 兜底标题翻译词典 -----
const FALLBACK_DICT: [RegExp, string][] = [
  // 行业
  [/fashion/gi, '时尚'], [/industry/gi, '行业'], [/market/gi, '市场'],
  [/brand/gi, '品牌'], [/design(?:er)?/gi, '设计'], [/craft/gi, '工艺'],
  // 动态
  [/new|latest|newest/gi, '最新'], [/best|top/gi, '最佳'],
  [/how to|guide|tips/gi, '指南'], [/review/gi, '评测'],
  [/report/gi, '报告'], [/analysis/gi, '分析'], [/forecast|predict/gi, '预测'],
  [/announce/gi, '宣布'], [/confirm/gi, '确认'], [/plan/gi, '计划'],
  [/return|back/gi, '回归'], [/rise|grow/gi, '崛起'], [/fall|decline|drop/gi, '下滑'],
  [/change/gi, '变化'], [/transform/gi, '变革'], [/innovati/gi, '创新'],
  // 产品
  [/shoe|footwear/gi, '鞋履'], [/cloth|apparel|garment/gi, '服装'],
  [/dress/gi, '连衣裙'], [/suit/gi, '西装'], [/jacket|coat/gi, '外套'],
  [/shirt|tee|t-shirt/gi, '上衣'], [/pants|trouser/gi, '裤装'],
  [/sunglasses/gi, '太阳镜'], [/hat|cap\b/gi, '帽饰'],
  // 场景
  [/summer/gi, '夏季'], [/winter/gi, '冬季'], [/spring/gi, '春季'], [/fall|autumn/gi, '秋季'],
  [/wedding/gi, '婚礼'], [/party|night out/gi, '派对'], [/work|office/gi, '职场'],
  [/street/gi, '街头'], [/travel/gi, '旅行'], [/beach|vacation/gi, '度假'],
  // 其他高频
  [/price|cost/gi, '价格'], [/quality/gi, '品质'], [/color|colour/gi, '色彩'],
  [/black/gi, '黑色'], [/white/gi, '白色'], [/red\b/gi, '红色'],
  [/pink/gi, '粉色'], [/gold/gi, '金色'],
  [/men(?:'s)?/gi, '男装'], [/women(?:'s)?/gi, '女装'], [/kid|child/gi, '童装'],
  [/global/gi, '全球'], [/china|chinese/gi, '中国'], [/europe/gi, '欧洲'],
  [/american?/gi, '美国'], [/japan/gi, '日本'], [/korea/gi, '韩国'],
];

/** 兜底标题：从英文原文提取关键词生成中文短句 */
function fallbackTitle(text: string, buzz: string): string {
  // 先尝试用中文标题（如果有）
  if (/[\u4e00-\u9fff]/.test(text)) {
    // 已经有中文内容，提取中文部分
    const zhPart = text.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g)?.join('') || '';
    if (zhPart.length >= 4) {
      return zhPart.length > 30 ? zhPart.substring(0, 30) + '...' : zhPart;
    }
  }

  // 从英文中提取可翻译的词
  const translated: string[] = [];
  for (const [re, zh] of FALLBACK_DICT) {
    re.lastIndex = 0;
    if (re.test(text) && !translated.includes(zh)) {
      translated.push(zh);
      if (translated.length >= 4) break;
    }
  }

  if (translated.length >= 2) {
    return `${translated.join('·')} ${buzz}`;
  }

  if (translated.length === 1) {
    return `时尚${translated[0]}动态 ${buzz}`;
  }

  // 终极兜底：保留英文但缩短 + 加中文前缀
  const raw = text.split(/\s+/).slice(0, 8).join(' ');
  const short = raw.length > 35 ? raw.substring(0, 35) + '...' : raw;
  return `时尚热点｜${short}`;
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
