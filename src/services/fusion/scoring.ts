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

/** Step 5: 热度加权计算 (Reddit 封锁期间: Google*0.40 + RSS*0.60) */
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

  // 权重从环境变量读取，方便不重部署直接调参
  // 默认值：Reddit 封锁期间 Google 40% + RSS 60%
  const wGoogle = parseFloat(process.env.SCORE_WEIGHT_GOOGLE || '0.40');
  const wRss    = parseFloat(process.env.SCORE_WEIGHT_RSS    || '0.60');
  const wReddit = parseFloat(process.env.SCORE_WEIGHT_REDDIT || '0.00');
  const BASE_W = { google: wGoogle, rss: wRss, reddit: wReddit };

  let weightedSum = 0;
  let activeWeightTotal = 0;

  if (googleRaw > 0) { weightedSum += googleRaw * BASE_W.google; activeWeightTotal += BASE_W.google; }
  if (rssRaw > 0)    { weightedSum += rssRaw * BASE_W.rss;       activeWeightTotal += BASE_W.rss; }
  if (redditRaw > 0) { weightedSum += redditRaw * BASE_W.reddit; activeWeightTotal += BASE_W.reddit; }

  // 如果没有任何数据源有分，退回到平均值 0
  const score = activeWeightTotal > 0
    ? Math.round(weightedSum / activeWeightTotal)
    : 0;

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

  // =====================================================
  // 收集所有文本：标题 + 正文内容（raw_data.article_content）
  // =====================================================
  const allTitles = group.topics.map(t =>
    [t.topic.title_en || '', t.topic.title_zh || ''].join(' ')
  ).join(' ');

  // 提取每条原始数据的正文内容（RSS的article_content / Google snippet / Reddit snippet）
  const bodyParts = group.topics
    .map(t => (t.topic.raw_data as any)?.article_content || '')
    .filter(Boolean);

  const allBodyText = bodyParts.join(' ');
  const allText = [allTitles, allBodyText].join(' ');

  // =====================================================
  // 从正文提取具体信息（增加标题信息量）
  // =====================================================
  // 百分比（业绩变化）
  const percentMatch = allBodyText.match(/(\-?\d+(?:\.\d+)?)\s*(?:percent|%)/i)
    || allTitles.match(/(\-?\d+(?:\.\d+)?)\s*(?:percent|%)/i);
  const percentStr = percentMatch ? `${percentMatch[1]}%` : '';

  // 金额（销售额/融资额）
  const moneyMatch = allText.match(/\$([\d,.]+)\s*(billion|million|trillion)/i);
  const moneyStr = moneyMatch
    ? `$${moneyMatch[1]}${moneyMatch[2] === 'billion' ? '亿' : moneyMatch[2] === 'trillion' ? '万亿' : '百万'}`
    : '';

  // 季节词
  const seasonStr = /spring|summer|ss\d{2}/i.test(allText) ? '春夏' :
    /fall|winter|fw\d{2}|autumn/i.test(allText) ? '秋冬' :
    /resort|cruise/i.test(allText) ? '度假' :
    /pre.?fall/i.test(allText) ? '早秋' : '';

  // =====================================================
  // 语义场景检测（用于选择精准标题模板）
  // =====================================================
  const isCollabContent = /collabo|collab\b|partner(?:ship)?|team(?:ing)?\s*up|joint\s*(?:venture|collection)|×|联名|合作/i.test(allText);
  const isFinancialContent = /revenue|sales\s*(?:rose|fell|grew|declined|up|down)|profit|earnings|quarterly|annual report|fiscal|净利|营收|业绩|财报|下滑|增长|亏损/i.test(allText);
  const isLaunchContent = /(?:officially\s*)?launch(?:es|ed)?|new\s+(?:collection|product|line|shoe|bag)|unveil|debut|introduces?|release[sd]?|drops?\b|发布|发售|首发|亮相|上市/i.test(allText);
  const isRunwayContent = /runway\s*show|(?:spring|fall|haute)\s*(?:couture|collection)|fashion\s*week\s*show|catwalk|走秀|大秀|发布秀/i.test(allText);
  const isControversyContent = /controversy|controversial|scandal|backlash|criticis(?:m|ed)|accusation|dispute|ban|protest|boycott|争议|丑闻|抵制|风波|指控/i.test(allText);
  const isBuyContent = /sold\s*out|waitlist|resell|resale|restock|limited(?:\s*edition)?|instant\s*sellout|售罄|补货|抢购|限量|秒售空/i.test(allText);
  const isAmbassadorContent = /brand\s*ambassador|global\s*ambassador|spokesperson|endorsement|officially\s*named|代言|品牌大使|官宣/i.test(allText);
  const isPriceContent = /price\s*(?:increase|hike|raise|cut)|cost\s*(?:rise|drop)|tariff|afford|expensive|overpriced|涨价|降价|定价|关税/i.test(allText);
  const isTrendContent = /(?:trend(?:ing)?|viral|going\s*viral|takes?\s*over|dominate[sd]?|surge[sd]?)\b/i.test(allText);
  const isRedcarpetContent = /red\s*carpet|(?:oscar|grammy|met\s*gala|cannes|golden\s*globe|bafta|emmy)[s\s]/i.test(allText);
  const isLeadershipContent = /(?:new\s*)?(?:CEO|creative\s*director|chief|appoint(?:ed|s)?|named\s*(?:as|new)|(?:steps?\s*(?:down|aside))|(?:exit|depart|resign|leave))\b/i.test(allText);
  const isStoreContent = /(?:new\s*)?(?:flagship|store|boutique|(?:open(?:ing|s|ed)?)|(?:pop.?up)|(?:retail\s*(?:expansion|location)))/i.test(allText);
  const isCelebrityStyleContent = /(?:wears?|spotted\s*in|dressed\s*in|outfitted\s*in|styled\s*by|street\s*style|airport\s*(?:look|style|fashion))\b/i.test(allText);

  // =====================================================
  // 从正文中提取核心动作短语（增加标题可读性）
  // =====================================================
  function extractCoreAction(): string {
    // 尝试从英文正文提取最有信息量的短句（名词+动词组合）
    const sentenceMatches = allBodyText.match(/[A-Z][^.!?]*(?:launch|release|partner|collab|appoint|name|open|close|debut|announce|unveil|sign|sold|surge|rise|fall|drop|expand|acquire)[^.!?]*[.!?]/gi);
    if (sentenceMatches && sentenceMatches.length > 0) {
      // 取最短的一句（最精炼）
      const shortest = sentenceMatches.sort((a, b) => a.length - b.length)[0];
      return shortest.substring(0, 120);
    }
    return '';
  }

  // =====================================================
  // 从正文提取关键短语（替代无意义的兜底 buzz 词）
  // =====================================================
  function extractKeyPhrase(): string {
    // 优先从正文第一句话提取有意义的中文短语
    const sentences = allBodyText.split(/[.!?]/);
    for (const s of sentences) {
      const trimmed = s.trim();
      if (trimmed.length < 15 || trimmed.length > 120) continue;
      let translated = trimmed;
      for (const [re, zh_] of TERM_MAP) {
        re.lastIndex = 0;
        translated = translated.replace(re, zh_);
      }
      const zhChunks = translated.match(/[\u4e00-\u9fff]{3,}/g);
      if (zhChunks && zhChunks.join('').length >= 4) {
        return zhChunks.slice(0, 2).join('').substring(0, 14);
      }
    }
    // 退而求其次：用标题术语翻译
    let translatedTitle = allTitles;
    for (const [re, zh_] of TERM_MAP) {
      re.lastIndex = 0;
      translatedTitle = translatedTitle.replace(re, zh_);
    }
    const zhParts = translatedTitle.match(/[\u4e00-\u9fff]{2,}/g);
    if (zhParts && zhParts.join('').length >= 4) {
      return zhParts.slice(0, 2).join('').substring(0, 14);
    }
    return '';
  }

  const keyPhrase = extractKeyPhrase();

  // 提取颁奖典礼名
  const awardMatch2 = allText.match(/\b(Met Gala|Oscar|Grammy|Cannes|Golden Globe|BAFTA|Emmy|CFDA)\b/i);
  const awardName = awardMatch2 ? awardMatch2[1] : '';

  // =====================================================
  // 情绪词 / 行动词（按语义场景精准选择，兜底用正文短语）
  // =====================================================
  let buzz = '';
  if (isControversyContent) {
    buzz = ['引发争议', '陷入风波', '掀起轩然大波', '遭遇强烈批评'][Math.floor(Math.random() * 4)];
  } else if (isBuyContent) {
    buzz = ['火速售罄', '引发抢购', '一件难求', '限量秒空'][Math.floor(Math.random() * 4)];
  } else if (isFinancialContent) {
    buzz = percentStr.startsWith('-') ? '业绩下滑引关注' : '业绩亮眼';
  } else if (isLaunchContent) {
    buzz = ['正式发布', '重磅登场', '全球首发', '惊喜亮相'][Math.floor(Math.random() * 4)];
  } else if (isRunwayContent) {
    buzz = ['大秀震撼呈现', '秀场惊艳全场', '引领本季风潮'][Math.floor(Math.random() * 3)];
  } else if (isAmbassadorContent) {
    buzz = ['官宣代言', '正式成为品牌大使', '强势出击'][Math.floor(Math.random() * 3)];
  } else if (isPriceContent) {
    buzz = ['价格调整引热议', '涨价消息曝光', '定价策略成焦点'][Math.floor(Math.random() * 3)];
  } else if (isLeadershipContent) {
    buzz = ['人事变动引关注', '管理层迎来变化'][Math.floor(Math.random() * 2)];
  } else if (isTrendContent) {
    buzz = ['持续引爆时尚圈', '成为本周最热话题', '席卷全网'][Math.floor(Math.random() * 3)];
  } else if (isRedcarpetContent) {
    buzz = awardName ? `${awardName}造型成焦点` : '红毯造型成焦点';
  } else {
    // 兜底：用从正文提取的关键短语，没有则留空（避免"备受关注"类废话）
    buzz = keyPhrase;
  }

  // =====================================================
  // 标题模板选择（18级优先级，语义精准化）
  // =====================================================
  let zh = '';

  // T1: 财务/业绩类（数字最有信息量，优先级最高）
  if (isFinancialContent && firstBrand) {
    if (percentStr) {
      const dir = parseFloat(percentStr) < 0 ? '下滑' : '增长';
      zh = `${firstBrand} 季度业绩${dir} ${percentStr}`;
    } else if (moneyStr) {
      zh = `${firstBrand} 营收达 ${moneyStr}，${buzz}`;
    } else {
      // 尝试从正文提取更多细节
      const revenueDetail = allBodyText.match(/(?:revenue|sales|profit)\s+(?:rose|fell|grew|declined|increased|decreased)\s+(?:by\s+)?(\d+(?:\.\d+)?%?)/i);
      if (revenueDetail) {
        zh = `${firstBrand} 最新财报：${revenueDetail[0].substring(0, 40)}`;
        zh = `${firstBrand} 最新业绩曝光，${buzz}`;
      } else {
        zh = `${firstBrand} 最新业绩曝光，${buzz}`;
      }
    }
  }
  // T2: 争议/危机类（吸引点击最强）
  else if (isControversyContent) {
    if (firstBrand && firstPerson) {
      zh = `${firstPerson} 与 ${firstBrand} ${buzz}`;
    } else if (firstBrand) {
      const topic = isAmbassadorContent ? '代言争议' : isPriceContent ? '定价风波' : '品牌事件';
      zh = `${firstBrand} ${topic}${buzz}`;
    } else if (firstPerson) {
      zh = `${firstPerson} ${buzz}`;
    } else {
      zh = `时尚圈${buzz}`;
    }
  }
  // T3: 人事/高管变动类
  else if (isLeadershipContent && firstBrand) {
    const roleMatch = allText.match(/(?:CEO|creative\s*director|chief\s*\w+|president|chairman)/i);
    const role = roleMatch ? roleMatch[0] : '高管';
    zh = firstPerson
      ? `${firstBrand} ${role} ${firstPerson}${buzz}`
      : `${firstBrand} ${role}${buzz}`;
  }
  // T4: 代言类
  else if (isAmbassadorContent && firstPerson && firstBrand) {
    zh = `${firstPerson} × ${firstBrand}：${buzz}`;
  } else if (isAmbassadorContent && firstBrand) {
    zh = `${firstBrand} 全新品牌大使${buzz}`;
  }
  // T5: 联名合作类（品牌×品牌 or 人物×品牌）
  else if (isCollabContent && firstBrand && firstPerson) {
    zh = `${firstPerson} × ${firstBrand} 联名系列${buzz}`;
  } else if (isCollabContent && brands.length >= 2) {
    zh = `${brands[0]} × ${brands[1]} 联名${buzz}`;
  } else if (isCollabContent && firstBrand) {
    zh = `${firstBrand} 全新联名${buzz}`;
  }
  // T6: 红毯/颁奖典礼类
  else if (isRedcarpetContent && firstPerson) {
    const eventName = firstEvent || (allText.match(/(?:Oscar|Grammy|Met Gala|Cannes|Golden Globe)[s\s]*/i)?.[0]?.trim()) || '颁奖典礼';
    zh = `${firstPerson} ${eventName}${buzz}`;
  }
  // T7: 名人穿搭/街拍类
  else if (isCelebrityStyleContent && firstPerson && firstBrand) {
    zh = `${firstPerson} 上身 ${firstBrand}，${buzz}`;
  } else if (isCelebrityStyleContent && firstPerson) {
    zh = `${firstPerson} 最新穿搭${buzz}`;
  }
  // T8: 新品发售/发布类（带季节词更具体）
  else if (isLaunchContent && firstBrand) {
    if (seasonStr) {
      zh = `${firstBrand} ${seasonStr}新品${buzz}`;
    } else {
      const productType = /shoe|sneaker|footwear/i.test(allText) ? '新款球鞋' :
        /bag|handbag/i.test(allText) ? '新款手袋' :
        /fragrance|perfume/i.test(allText) ? '全新香水' :
        /jewelry|jewellery/i.test(allText) ? '珠宝新作' : '新品';
      zh = `${firstBrand} ${productType}${buzz}`;
    }
  }
  // T9: 秀场/系列类
  else if (isRunwayContent && firstBrand) {
    const season = seasonStr || '';
    zh = `${firstBrand} ${season}${firstEvent || '大秀'}${buzz}`;
  }
  // T10: 价格/关税类
  else if (isPriceContent && firstBrand) {
    zh = `${firstBrand} ${buzz}`;
  }
  // T11: 售罄/抢购类
  else if (isBuyContent && firstBrand) {
    zh = `${firstBrand} 限量新品${buzz}`;
  }
  // T12: 门店开业/扩张类
  else if (isStoreContent && firstBrand) {
    const cityMatch = allText.match(/(?:in|at|opens?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const city = cityMatch ? cityMatch[1] : '';
    zh = city
      ? `${firstBrand} ${city}旗舰店${buzz}`
      : `${firstBrand} 门店扩张${buzz}`;
  }
  // T13: 趋势/热度类
  else if (isTrendContent && firstBrand) {
    zh = `${firstBrand} ${seasonStr ? seasonStr + '趋势' : '话题'}${buzz}`;
  }
  // T14: 人物+品牌（通用关联）
  else if (firstPerson && firstBrand) {
    const connector = isLaunchContent ? '携手发布新品' : isCollabContent ? '联名系列正式发布' :
      isAmbassadorContent ? '官宣代言合作' :
      keyPhrase ? keyPhrase : '最新动态曝光';
    zh = `${firstPerson} × ${firstBrand} ${connector}`;
  }
  // T15: 仅品牌+事件词（用匹配到的最准确事件词）
  else if (firstBrand) {
    // 优先选择最具体的术语（避免"动态"、"趋势"这种模糊词）
    const specificTerms = ['春夏系列', '秋冬系列', '高级定制', '联名合作', '新品发售',
      '广告大片', '系列发布', '球鞋', '手袋', '配饰', '香水', '珠宝', '度假系列'];
    let bestTerm = '';
    for (const [re, zh_] of TERM_MAP) {
      re.lastIndex = 0;
      if (re.test(allText) && specificTerms.includes(zh_)) {
        bestTerm = zh_;
        break;
      }
    }
    if (bestTerm) {
      zh = keyPhrase
        ? `${firstBrand} ${bestTerm}：${keyPhrase}`
        : `${firstBrand} ${bestTerm}${buzz}`;
    } else if (keyPhrase) {
      zh = `${firstBrand}：${keyPhrase}`;
    } else {
      // 没有正文短语时，直接用英文原标题核心词翻译
      zh = buildFallbackFromContent(allTitles, allBodyText, firstBrand);
    }
  }
  // T16: 仅人物
  else if (firstPerson) {
    const termForPerson = isRunwayContent ? '大秀造型' :
      isRedcarpetContent ? (awardName ? `${awardName}红毯` : '红毯造型') :
      isCelebrityStyleContent ? '最新穿搭' :
      isAmbassadorContent ? '品牌代言' :
      keyPhrase || '';
    zh = termForPerson
      ? `${firstPerson} ${termForPerson}`
      : buildFallbackFromContent(allTitles, allBodyText, firstPerson);
  }
  // T17: 仅事件
  else if (firstEvent) {
    zh = `${firstEvent}：${buzz}`;
  }
  // T18: 终极兜底 — 从正文句子提炼
  else {
    zh = buildFallbackFromContent(allTitles, allBodyText);
  }

  // 标题长度控制（不超过32字符）
  if (zh.length > 32) {
    zh = zh.substring(0, 30) + '…';
  }

  const en = group.topEntity.name;
  return { zh, en };
}

/**
 * 终极兜底：从英文标题/正文提炼有意义的中文短句
 * entityHint: 已知的实体名（品牌/人名），优先放在标题开头
 */
function buildFallbackFromContent(titles: string, body: string, entityHint: string = ''): string {
  // 策略1：尝试翻译英文标题中的核心动词短语（最直接）
  let translatedTitle = titles;
  for (const [re, zh] of TERM_MAP) {
    re.lastIndex = 0;
    translatedTitle = translatedTitle.replace(re, zh);
  }

  // 提取翻译后的中文词片段（至少2个汉字连续）
  const zhChunks = translatedTitle.match(/[\u4e00-\u9fff]{2,}/g) || [];
  const meaningfulChunks = zhChunks.filter(c =>
    // 过滤掉单独出现的连接词
    !['和', '与', '的', '在', '是', '了', '将', '于'].includes(c)
  );

  if (meaningfulChunks.length >= 2) {
    const core = meaningfulChunks.slice(0, 3).join('·').substring(0, 20);
    return entityHint ? `${entityHint}：${core}` : core;
  }
  if (meaningfulChunks.length === 1 && meaningfulChunks[0].length >= 4) {
    return entityHint
      ? `${entityHint} ${meaningfulChunks[0]}`
      : `时尚｜${meaningfulChunks[0]}`;
  }

  // 策略2：从正文第一句话翻译
  const firstSentence = body.split(/[.!?]/)[0]?.trim() || '';
  if (firstSentence.length > 10 && firstSentence.length < 120) {
    let translated = firstSentence;
    for (const [re, zh] of TERM_MAP) {
      re.lastIndex = 0;
      translated = translated.replace(re, zh);
    }
    const parts = translated.match(/[\u4e00-\u9fff]{2,}/g);
    if (parts && parts.join('').length >= 6) {
      const summary = parts.slice(0, 3).join('').substring(0, 16);
      return entityHint ? `${entityHint}：${summary}` : summary;
    }
  }

  // 策略3：找正文中的大写专有名词 + 中文术语组合
  const capitalWords = titles.split(/[\s\-–—:,|]+/)
    .filter(w => /^[A-Z][a-z]{2,}/.test(w) && w.length >= 4 && w !== entityHint);
  if (capitalWords.length > 0 && entityHint) {
    // 用 TERM_MAP 翻译这些词
    for (const w of capitalWords.slice(0, 2)) {
      let wTranslated = w;
      for (const [re, zh] of TERM_MAP) {
        re.lastIndex = 0;
        wTranslated = wTranslated.replace(re, zh);
      }
      const zhMatch = wTranslated.match(/[\u4e00-\u9fff]{2,}/);
      if (zhMatch) {
        return `${entityHint} ${zhMatch[0]}`;
      }
    }
    return `${entityHint} × ${capitalWords[0]}`;
  }

  // 策略4：截取英文标题前7个词 + 实体提示
  const shortTitle = titles.split(/\s+/).slice(0, 7).join(' ').substring(0, 40);
  return entityHint
    ? `${entityHint}｜${shortTitle}`
    : `时尚热点｜${shortTitle.substring(0, 28)}`;
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
