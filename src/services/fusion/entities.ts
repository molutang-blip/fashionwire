// =====================================================
// 实体库 + 实体提取逻辑
// =====================================================

import type { EntitySet, EntityType } from '@/domain/types';

/** 实体定义 */
interface EntityDef {
  name: string;
  type: EntityType;
  aliases: string[];
  weight: number;
}

// PRD 定义的实体库（硬编码，快速可靠）
export const ENTITY_DB: EntityDef[] = [
  // 品牌
  { name: 'Chanel', type: 'brand', aliases: ['CHANEL', '香奈儿'], weight: 1.2 },
  { name: 'Louis Vuitton', type: 'brand', aliases: ['LV', 'LOUIS VUITTON', '路易威登'], weight: 1.3 },
  { name: 'Gucci', type: 'brand', aliases: ['GUCCI', '古驰'], weight: 1.2 },
  { name: 'Dior', type: 'brand', aliases: ['DIOR', 'Christian Dior', '迪奥'], weight: 1.2 },
  { name: 'Prada', type: 'brand', aliases: ['PRADA', '普拉达'], weight: 1.1 },
  { name: 'Hermès', type: 'brand', aliases: ['Hermes', 'HERMES', '爱马仕'], weight: 1.3 },
  { name: 'Balenciaga', type: 'brand', aliases: ['BALENCIAGA', '巴黎世家'], weight: 1.0 },
  { name: 'Versace', type: 'brand', aliases: ['VERSACE', '范思哲'], weight: 1.0 },
  { name: 'YSL', type: 'brand', aliases: ['Saint Laurent', 'Yves Saint Laurent', '圣罗兰'], weight: 1.0 },
  { name: 'Burberry', type: 'brand', aliases: ['BURBERRY', '博柏利'], weight: 1.0 },
  { name: 'Celine', type: 'brand', aliases: ['CELINE', '赛琳'], weight: 1.0 },
  { name: 'Valentino', type: 'brand', aliases: ['VALENTINO', '华伦天奴'], weight: 1.0 },
  { name: 'Givenchy', type: 'brand', aliases: ['GIVENCHY', '纪梵希'], weight: 1.0 },
  { name: 'Fendi', type: 'brand', aliases: ['FENDI', '芬迪'], weight: 1.0 },
  { name: 'Bottega Veneta', type: 'brand', aliases: ['BV', 'BOTTEGA VENETA', '葆蝶家'], weight: 1.0 },
  { name: 'Nike', type: 'brand', aliases: ['NIKE', '耐克'], weight: 0.9 },
  { name: 'Adidas', type: 'brand', aliases: ['ADIDAS', '阿迪达斯'], weight: 0.9 },
  { name: 'Supreme', type: 'brand', aliases: ['SUPREME'], weight: 0.9 },
  { name: 'Off-White', type: 'brand', aliases: ['OFF-WHITE', 'Off White', 'OW'], weight: 0.9 },
  // 人物
  { name: 'Zendaya', type: 'person', aliases: ['赞达亚'], weight: 1.0 },
  { name: 'Rihanna', type: 'person', aliases: ['蕾哈娜'], weight: 1.0 },
  { name: 'Beyoncé', type: 'person', aliases: ['Beyonce', '碧昂丝'], weight: 1.0 },
  { name: 'Kanye', type: 'person', aliases: ['Kanye West', 'Ye', '侃爷'], weight: 1.0 },
  { name: 'Travis Scott', type: 'person', aliases: [], weight: 0.9 },
  { name: 'Kylie Jenner', type: 'person', aliases: ['凯莉·詹纳'], weight: 0.9 },
  { name: 'Kim Kardashian', type: 'person', aliases: ['Kim K', '金·卡戴珊'], weight: 1.0 },
  { name: 'Gigi Hadid', type: 'person', aliases: [], weight: 0.9 },
  { name: 'Bella Hadid', type: 'person', aliases: [], weight: 0.9 },
  { name: 'Kendall Jenner', type: 'person', aliases: [], weight: 0.9 },
  { name: 'Timothée Chalamet', type: 'person', aliases: ['Timothee Chalamet', '甜茶'], weight: 1.0 },
  { name: 'Harry Styles', type: 'person', aliases: [], weight: 0.9 },
  // 事件
  { name: 'Paris Fashion Week', type: 'event', aliases: ['PFW', '巴黎时装周'], weight: 1.3 },
  { name: 'Milan Fashion Week', type: 'event', aliases: ['MFW', '米兰时装周'], weight: 1.2 },
  { name: 'New York Fashion Week', type: 'event', aliases: ['NYFW', '纽约时装周'], weight: 1.2 },
  { name: 'London Fashion Week', type: 'event', aliases: ['LFW', '伦敦时装周'], weight: 1.1 },
  { name: 'Fashion Week', type: 'event', aliases: ['时装周'], weight: 1.0 },
  { name: 'Met Gala', type: 'event', aliases: ['Met Ball', '大都会'], weight: 1.3 },
  { name: 'Coachella', type: 'event', aliases: ['科切拉'], weight: 1.0 },
];

/** 从文本中提取实体 */
export function extractEntities(text: string): EntitySet {
  const brands: string[] = [];
  const people: string[] = [];
  const events: string[] = [];
  const lower = text.toLowerCase();

  for (const entity of ENTITY_DB) {
    const allNames = [entity.name, ...entity.aliases];
    const matched = allNames.some(n => lower.includes(n.toLowerCase()));
    if (!matched) continue;

    if (entity.type === 'brand' && !brands.includes(entity.name)) brands.push(entity.name);
    if (entity.type === 'person' && !people.includes(entity.name)) people.push(entity.name);
    if (entity.type === 'event' && !events.includes(entity.name)) events.push(entity.name);
  }

  return { brands, people, events };
}

/** 获取实体的权重 */
export function getEntityWeight(entityName: string): number {
  const e = ENTITY_DB.find(d =>
    d.name.toLowerCase() === entityName.toLowerCase() ||
    d.aliases.some(a => a.toLowerCase() === entityName.toLowerCase())
  );
  return e?.weight ?? 1.0;
}

/** 确定一组实体中最重要的（用于 top_entity） */
export function pickTopEntity(entities: EntitySet): { name: string; type: EntityType } {
  // 优先品牌 > 人物 > 事件
  if (entities.brands.length > 0) return { name: entities.brands[0], type: 'brand' };
  if (entities.people.length > 0) return { name: entities.people[0], type: 'person' };
  if (entities.events.length > 0) return { name: entities.events[0], type: 'event' };
  return { name: 'Unknown', type: 'event' };
}

/** 计算两组实体的重叠数 */
export function entityOverlap(a: EntitySet, b: EntitySet): number {
  const setA = new Set([...a.brands, ...a.people, ...a.events]);
  const setB = new Set([...b.brands, ...b.people, ...b.events]);
  let count = 0;
  for (const x of setA) { if (setB.has(x)) count++; }
  return count;
}

/** 合并两组实体（去重） */
export function mergeEntities(a: EntitySet, b: EntitySet): EntitySet {
  return {
    brands: [...new Set([...a.brands, ...b.brands])],
    people: [...new Set([...a.people, ...b.people])],
    events: [...new Set([...a.events, ...b.events])],
  };
}
