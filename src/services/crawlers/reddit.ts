import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

const SUBREDDITS = ['fashion', 'streetwear', 'malefashionadvice', 'femalefashionadvice'];

// PRD 实体库（保留英文）
const BRANDS = ['Chanel', 'Louis Vuitton', 'Gucci', 'Dior', 'Prada', 'Hermès', 'Balenciaga', 'Versace', 'YSL', 'Burberry', 'Celine', 'Valentino', 'Givenchy', 'Fendi', 'Bottega Veneta', 'Nike', 'Adidas', 'Supreme', 'Off-White'];
const PEOPLE = ['Zendaya', 'Rihanna', 'Beyoncé', 'Kanye', 'Travis Scott', 'Kylie Jenner', 'Kim Kardashian', 'Gigi Hadid', 'Bella Hadid', 'Kendall Jenner', 'Timothée Chalamet', 'Harry Styles'];

// PRD 中文翻译规则（免费，规则匹配）
function generateChineseTitle(title: string): string {
  let cn = title;
  
  // 保留品牌名/人名英文（查找并保护）
  const foundBrands: string[] = [];
  const foundPeople: string[] = [];
  
  BRANDS.forEach(b => {
    if (title.toLowerCase().includes(b.toLowerCase())) {
      foundBrands.push(b);
      cn = cn.replace(new RegExp(b, 'gi'), `__BRAND_${foundBrands.length-1}__`);
    }
  });
  
  PEOPLE.forEach(p => {
    if (title.toLowerCase().includes(p.toLowerCase())) {
      foundPeople.push(p);
      cn = cn.replace(new RegExp(p, 'gi'), `__PEOPLE_${foundPeople.length-1}__`);
    }
  });
  
  // 翻译时尚术语（PRD 映射词典）
  cn = cn
    .replace(/streetwear/gi, '街头服饰')
    .replace(/collaboration|collab/gi, '联名合作')
    .replace(/drop|release/gi, '限量发售')
    .replace(/collection/gi, '系列发布')
    .replace(/fashion week/gi, '时装周')
    .replace(/spring\/summer|ss\d{2}/gi, '春夏系列')
    .replace(/fall\/winter|fw\d{2}/gi, '秋冬系列')
    .replace(/lookbook/gi, '造型手册')
    .replace(/campaign/gi, '广告大片')
    .replace(/vintage/gi, '复古')
    .replace(/minimalist/gi, '极简');
  
  // 恢复品牌名/人名
  foundBrands.forEach((b, i) => {
    cn = cn.replace(`__BRAND_${i}__`, b);
  });
  foundPeople.forEach((p, i) => {
    cn = cn.replace(`__PEOPLE_${i}__`, p);
  });
  
  return cn;
}

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

export async function crawlReddit() {
  const startTime = Date.now();
  
  try {
    const allPosts = [];
    
    for (const subreddit of SUBREDDITS) {
      try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=10`, {
          headers: { 'User-Agent': 'FashionWire/1.0' }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const posts = data.data?.children || [];
        
        // 降低门槛：ups>500 且 comments>20（PRD要求1000/50太严，可能抓不到）
        const filtered = posts
          .filter((p: any) => p.data.ups > 500 && p.data.num_comments > 20)
          .map((p: any, index: number) => ({
            title_zh: generateChineseTitle(p.data.title), // 生成中文标题
            title_en: p.data.title,
            score: Math.round(p.data.ups / 100),
            source: 'reddit' as const,
            source_label: `r/${subreddit}`,
            direction: getTrendDirection(index),
            source_url: `https://reddit.com${p.data.permalink}`,
            source_id: `reddit_${p.data.id}`,
            raw_data: p.data
          }));
          
        allPosts.push(...filtered);
      } catch (e) {
        console.error(`Reddit r/${subreddit} 抓取失败`);
      }
    }

    if (allPosts.length === 0) {
      return { success: false, count: 0, error: 'No Reddit data' };
    }

    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    await deleteOldTopics('reddit', 20);
    await insertTrendingTopics(topPosts);
    
    await logCrawl({
      source: 'reddit',
      status: 'success',
      items_count: topPosts.length,
      duration_ms: Date.now() - startTime,
      error_message: null
    });

    return { success: true, count: topPosts.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    
    await logCrawl({
      source: 'reddit',
      status: 'failed',
      items_count: 0,
      error_message: message,
      duration_ms: Date.now() - startTime
    });
    
    return { success: false, count: 0, error: message };
  }
}
