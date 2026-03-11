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
  // ===== 品牌 (60+) =====
  // 顶级奢侈品
  { name: 'Chanel', type: 'brand', aliases: ['CHANEL', '香奈儿'], weight: 1.2 },
  { name: 'Louis Vuitton', type: 'brand', aliases: ['LV', 'LOUIS VUITTON', '路易威登'], weight: 1.3 },
  { name: 'Gucci', type: 'brand', aliases: ['GUCCI', '古驰'], weight: 1.2 },
  { name: 'Dior', type: 'brand', aliases: ['DIOR', 'Christian Dior', '迪奥'], weight: 1.2 },
  { name: 'Prada', type: 'brand', aliases: ['PRADA', '普拉达'], weight: 1.1 },
  { name: 'Miu Miu', type: 'brand', aliases: ['MIU MIU', '缪缪'], weight: 1.1 },
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
  { name: 'Loewe', type: 'brand', aliases: ['LOEWE', '罗意威'], weight: 1.0 },
  { name: 'Alexander McQueen', type: 'brand', aliases: ['McQueen', 'ALEXANDER MCQUEEN', '麦昆'], weight: 1.0 },
  { name: 'Tom Ford', type: 'brand', aliases: ['TOM FORD', '汤姆·福特'], weight: 1.0 },
  { name: 'Dolce & Gabbana', type: 'brand', aliases: ['D&G', 'Dolce Gabbana', 'DOLCE & GABBANA', '杜嘉班纳'], weight: 1.0 },
  { name: 'Armani', type: 'brand', aliases: ['Giorgio Armani', 'Emporio Armani', 'ARMANI', '阿玛尼'], weight: 1.0 },
  { name: 'Ralph Lauren', type: 'brand', aliases: ['RALPH LAUREN', '拉夫·劳伦'], weight: 0.9 },
  { name: 'Calvin Klein', type: 'brand', aliases: ['CK', 'CALVIN KLEIN', '卡尔文·克莱恩'], weight: 0.9 },
  { name: 'Marc Jacobs', type: 'brand', aliases: ['MARC JACOBS', '马克·雅各布斯'], weight: 0.9 },
  { name: 'Coach', type: 'brand', aliases: ['COACH', '蔻驰'], weight: 0.9 },
  { name: 'Michael Kors', type: 'brand', aliases: ['MICHAEL KORS', 'MK', '迈克·科尔斯'], weight: 0.9 },
  { name: 'Tiffany', type: 'brand', aliases: ['Tiffany & Co', 'TIFFANY', '蒂芙尼'], weight: 1.0 },
  { name: 'Cartier', type: 'brand', aliases: ['CARTIER', '卡地亚'], weight: 1.1 },
  { name: 'Rolex', type: 'brand', aliases: ['ROLEX', '劳力士'], weight: 1.0 },
  { name: 'Omega', type: 'brand', aliases: ['OMEGA', '欧米茄'], weight: 0.9 },
  // 时尚集团
  { name: 'LVMH', type: 'brand', aliases: ['路威酩轩'], weight: 1.2 },
  { name: 'Kering', type: 'brand', aliases: ['开云集团'], weight: 1.1 },
  { name: 'Capri Holdings', type: 'brand', aliases: ['Capri', 'CAPRI'], weight: 0.9 },
  { name: 'Tapestry', type: 'brand', aliases: ['TAPESTRY'], weight: 0.9 },
  { name: 'Richemont', type: 'brand', aliases: ['历峰集团'], weight: 1.0 },
  // 潮流 & 运动
  { name: 'Nike', type: 'brand', aliases: ['NIKE', '耐克'], weight: 0.9 },
  { name: 'Adidas', type: 'brand', aliases: ['ADIDAS', '阿迪达斯'], weight: 0.9 },
  { name: 'New Balance', type: 'brand', aliases: ['NB', 'NEW BALANCE', '新百伦'], weight: 0.8 },
  { name: 'Puma', type: 'brand', aliases: ['PUMA', '彪马'], weight: 0.8 },
  { name: 'Supreme', type: 'brand', aliases: ['SUPREME'], weight: 0.9 },
  { name: 'Off-White', type: 'brand', aliases: ['OFF-WHITE', 'Off White', 'OW'], weight: 0.9 },
  { name: 'Stüssy', type: 'brand', aliases: ['Stussy', 'STUSSY'], weight: 0.8 },
  { name: 'Fear of God', type: 'brand', aliases: ['FOG', 'FEAR OF GOD'], weight: 0.8 },
  { name: 'Comme des Garçons', type: 'brand', aliases: ['CDG', 'Comme des Garcons', '川久保玲'], weight: 0.9 },
  // 快时尚 & 新锐
  { name: 'Zara', type: 'brand', aliases: ['ZARA'], weight: 0.8 },
  { name: 'H&M', type: 'brand', aliases: ['HM', 'H and M'], weight: 0.8 },
  { name: 'Uniqlo', type: 'brand', aliases: ['UNIQLO', '优衣库'], weight: 0.8 },
  { name: 'Shein', type: 'brand', aliases: ['SHEIN', '希音'], weight: 0.8 },
  { name: 'Temu', type: 'brand', aliases: ['TEMU', '拼多多跨境'], weight: 0.7 },
  // 美妆 & 香水
  { name: 'Chanel Beauty', type: 'brand', aliases: ['Chanel Beauté'], weight: 0.9 },
  { name: 'Dior Beauty', type: 'brand', aliases: ['Dior Beauté'], weight: 0.9 },
  { name: 'Estée Lauder', type: 'brand', aliases: ['Estee Lauder', '雅诗兰黛'], weight: 0.9 },
  { name: "L'Oréal", type: 'brand', aliases: ['LOreal', "L'Oreal", '欧莱雅'], weight: 0.9 },
  { name: 'Sephora', type: 'brand', aliases: ['SEPHORA', '丝芙兰'], weight: 0.8 },
  // 鞋履 & 配饰
  { name: 'Jimmy Choo', type: 'brand', aliases: ['JIMMY CHOO', '周仰杰'], weight: 1.0 },
  { name: 'Manolo Blahnik', type: 'brand', aliases: ['MANOLO BLAHNIK'], weight: 0.9 },
  { name: 'Christian Louboutin', type: 'brand', aliases: ['Louboutin', '红底鞋'], weight: 1.0 },
  { name: 'Birkenstock', type: 'brand', aliases: ['BIRKENSTOCK', '勃肯'], weight: 0.8 },
  { name: 'Converse', type: 'brand', aliases: ['CONVERSE', '匡威'], weight: 0.8 },
  { name: 'Vans', type: 'brand', aliases: ['VANS', '万斯'], weight: 0.8 },
  // 其他重要品牌
  { name: 'Moncler', type: 'brand', aliases: ['MONCLER', '盟可睐'], weight: 1.0 },
  { name: 'Max Mara', type: 'brand', aliases: ['MAX MARA', '麦丝玛拉'], weight: 0.9 },
  { name: 'Acne Studios', type: 'brand', aliases: ['ACNE STUDIOS'], weight: 0.9 },
  { name: 'Isabel Marant', type: 'brand', aliases: ['ISABEL MARANT'], weight: 0.9 },
  { name: 'Jacquemus', type: 'brand', aliases: ['JACQUEMUS'], weight: 0.9 },
  { name: 'The Row', type: 'brand', aliases: ['THE ROW'], weight: 0.9 },
  { name: 'Thom Browne', type: 'brand', aliases: ['THOM BROWNE'], weight: 0.9 },
  { name: 'Rick Owens', type: 'brand', aliases: ['RICK OWENS'], weight: 0.9 },
  { name: 'Maison Margiela', type: 'brand', aliases: ['Margiela', 'MAISON MARGIELA', 'Martin Margiela', 'MMM'], weight: 1.0 },
  { name: 'Balmain', type: 'brand', aliases: ['BALMAIN', '巴尔曼'], weight: 0.9 },
  { name: 'Oscar de la Renta', type: 'brand', aliases: ['OSCAR DE LA RENTA'], weight: 0.9 },
  { name: 'Carolina Herrera', type: 'brand', aliases: ['CAROLINA HERRERA'], weight: 0.9 },
  { name: 'Vivienne Westwood', type: 'brand', aliases: ['VIVIENNE WESTWOOD', '西太后'], weight: 0.9 },
  { name: 'Stella McCartney', type: 'brand', aliases: ['STELLA MCCARTNEY'], weight: 0.9 },
  { name: 'Brunello Cucinelli', type: 'brand', aliases: ['BRUNELLO CUCINELLI'], weight: 0.9 },
  { name: 'Loro Piana', type: 'brand', aliases: ['LORO PIANA', '诺悠翩雅'], weight: 1.0 },
  { name: 'Alaïa', type: 'brand', aliases: ['Alaia', 'ALAIA', 'ALAÏA'], weight: 0.9 },
  { name: 'Swarovski', type: 'brand', aliases: ['SWAROVSKI', '施华洛世奇'], weight: 0.8 },
  { name: 'Pandora', type: 'brand', aliases: ['PANDORA', '潘多拉'], weight: 0.8 },
  { name: 'Van Cleef', type: 'brand', aliases: ['Van Cleef & Arpels', 'VCA', '梵克雅宝'], weight: 1.0 },
  { name: 'Bulgari', type: 'brand', aliases: ['BVLGARI', 'BULGARI', '宝格丽'], weight: 1.0 },

  // ===== 人物 (30+) =====
  // 明星 & 偶像
  { name: 'Zendaya', type: 'person', aliases: ['赞达亚'], weight: 1.0 },
  { name: 'Rihanna', type: 'person', aliases: ['蕾哈娜', 'Fenty'], weight: 1.0 },
  { name: 'Beyoncé', type: 'person', aliases: ['Beyonce', '碧昂丝'], weight: 1.0 },
  { name: 'Kanye', type: 'person', aliases: ['Kanye West', 'Ye', '侃爷'], weight: 1.0 },
  { name: 'Travis Scott', type: 'person', aliases: ['特拉维斯·斯科特'], weight: 0.9 },
  { name: 'Kylie Jenner', type: 'person', aliases: ['凯莉·詹纳'], weight: 0.9 },
  { name: 'Kim Kardashian', type: 'person', aliases: ['Kim K', '金·卡戴珊'], weight: 1.0 },
  { name: 'Gigi Hadid', type: 'person', aliases: ['吉吉·哈迪德'], weight: 0.9 },
  { name: 'Bella Hadid', type: 'person', aliases: ['贝拉·哈迪德'], weight: 0.9 },
  { name: 'Kendall Jenner', type: 'person', aliases: ['肯达尔·詹纳'], weight: 0.9 },
  { name: 'Timothée Chalamet', type: 'person', aliases: ['Timothee Chalamet', '甜茶'], weight: 1.0 },
  { name: 'Harry Styles', type: 'person', aliases: ['哈里·斯泰尔斯'], weight: 0.9 },
  { name: 'Taylor Swift', type: 'person', aliases: ['泰勒·斯威夫特', '霉霉'], weight: 1.0 },
  { name: 'Lady Gaga', type: 'person', aliases: ['Gaga', '嘎嘎'], weight: 1.0 },
  { name: 'Hailey Bieber', type: 'person', aliases: ['Hailey Baldwin', '海莉·比伯'], weight: 0.9 },
  { name: 'Dua Lipa', type: 'person', aliases: ['杜阿·利帕'], weight: 0.9 },
  { name: 'Billie Eilish', type: 'person', aliases: ['碧梨'], weight: 0.9 },
  { name: 'Bad Bunny', type: 'person', aliases: [], weight: 0.8 },
  { name: 'A$AP Rocky', type: 'person', aliases: ['ASAP Rocky'], weight: 0.9 },
  { name: 'Pharrell', type: 'person', aliases: ['Pharrell Williams', '菲董'], weight: 1.0 },
  // 设计师 & 行业人物
  { name: 'Virgil Abloh', type: 'person', aliases: ['Virgil'], weight: 1.0 },
  { name: 'Karl Lagerfeld', type: 'person', aliases: ['老佛爷', 'Lagerfeld'], weight: 1.0 },
  { name: 'Alessandro Michele', type: 'person', aliases: [], weight: 0.9 },
  { name: 'Demna', type: 'person', aliases: ['Demna Gvasalia'], weight: 0.9 },
  { name: 'Miuccia Prada', type: 'person', aliases: ['Miuccia'], weight: 1.0 },
  { name: 'Raf Simons', type: 'person', aliases: [], weight: 0.9 },
  { name: 'Jonathan Anderson', type: 'person', aliases: ['JW Anderson'], weight: 0.9 },
  { name: 'Daniel Lee', type: 'person', aliases: [], weight: 0.9 },
  { name: 'Matthieu Blazy', type: 'person', aliases: [], weight: 0.9 },
  { name: 'John Idol', type: 'person', aliases: [], weight: 0.8 },
  { name: 'Bernard Arnault', type: 'person', aliases: ['阿尔诺', 'LVMH CEO'], weight: 1.1 },
  { name: 'François-Henri Pinault', type: 'person', aliases: ['Pinault', 'Kering CEO'], weight: 1.0 },
  { name: 'Anna Wintour', type: 'person', aliases: ['Wintour', '安娜·温图尔'], weight: 1.0 },
  { name: 'Edward Enninful', type: 'person', aliases: ['Enninful'], weight: 0.9 },

  // ===== 事件 (15+) =====
  { name: 'Paris Fashion Week', type: 'event', aliases: ['PFW', '巴黎时装周'], weight: 1.3 },
  { name: 'Milan Fashion Week', type: 'event', aliases: ['MFW', '米兰时装周'], weight: 1.2 },
  { name: 'New York Fashion Week', type: 'event', aliases: ['NYFW', '纽约时装周'], weight: 1.2 },
  { name: 'London Fashion Week', type: 'event', aliases: ['LFW', '伦敦时装周'], weight: 1.1 },
  { name: 'Fashion Week', type: 'event', aliases: ['时装周'], weight: 1.0 },
  { name: 'Met Gala', type: 'event', aliases: ['Met Ball', '大都会'], weight: 1.3 },
  { name: 'Coachella', type: 'event', aliases: ['科切拉'], weight: 1.0 },
  { name: 'Oscars', type: 'event', aliases: ['Academy Awards', '奥斯卡'], weight: 1.0 },
  { name: 'Grammy', type: 'event', aliases: ['Grammys', 'Grammy Awards', '格莱美'], weight: 0.9 },
  { name: 'Golden Globes', type: 'event', aliases: ['金球奖'], weight: 0.9 },
  { name: 'CFDA', type: 'event', aliases: ['CFDA Awards', 'CFDA Fashion Awards'], weight: 0.9 },
  { name: 'British Fashion Awards', type: 'event', aliases: ['BFA'], weight: 0.9 },
  { name: 'Haute Couture Week', type: 'event', aliases: ['Couture Week', '高定周'], weight: 1.2 },
  { name: 'Art Basel', type: 'event', aliases: ['巴塞尔艺术展'], weight: 0.9 },
  { name: 'Cannes', type: 'event', aliases: ['Cannes Film Festival', '戛纳'], weight: 1.0 },
  { name: 'Super Bowl', type: 'event', aliases: ['超级碗'], weight: 0.8 },
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
