import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// -------------------------------------------------------
// Reddit 数据源
//
// 方案A（主）: 官方 OAuth2 API
//   配置 REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET 后自动启用
//   申请：https://www.reddit.com/prefs/apps → script 类型
//
// 方案B（自动降级）: Reddit JSON API + 模拟浏览器头
//   无需任何配置，直接可用
//   通过伪装成普通浏览器请求绕过基础封锁
// -------------------------------------------------------

const SUBREDDITS = [
  { name: 'fashion',             weight: 1.2 },
  { name: 'streetwear',         weight: 1.1 },
  { name: 'malefashionadvice',  weight: 1.0 },
  { name: 'femalefashionadvice',weight: 1.0 },
  { name: 'sneakers',           weight: 0.9 },
  { name: 'handbags',           weight: 0.9 },
];

// 爬虫层方向仅作初始占位，真实方向由融合层基于历史分数计算
function getTrendDirection(_index: number): TrendDirection {
  return 'flat';
}

// -------------------------------------------------------
// 获取 Reddit OAuth2 Token（可选，配了就用）
// -------------------------------------------------------
async function getOAuthToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'FashionWire/1.0 by fashionwire_app',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    console.log('[Reddit] OAuth token 获取成功');
    return data.access_token || null;
  } catch {
    return null;
  }
}

// -------------------------------------------------------
// 方案A: 官方 OAuth API（配置了 key 时使用）
// -------------------------------------------------------
async function fetchViaOAuth(token: string): Promise<any[]> {
  const posts: any[] = [];
  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://oauth.reddit.com/r/${sub.name}/top?t=week&limit=25`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'FashionWire/1.0 by fashionwire_app',
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const items = (data?.data?.children || []).map((p: any) => ({
        title: p.data.title || '',
        link: `https://reddit.com${p.data.permalink}`,
        ups: p.data.ups || 0,
        comments: p.data.num_comments || 0,
        snippet: ((p.data.selftext || '') + ' ' + (p.data.title || '')).substring(0, 500),
        subreddit: sub.name,
        weight: sub.weight,
        flair: p.data.link_flair_text || '',
        combinedScore: (p.data.ups || 0) + (p.data.num_comments || 0) * 10,
      })).filter((p: any) => p.ups > 20 || p.comments > 10);
      posts.push(...items);
      console.log(`[Reddit/OAuth] r/${sub.name}: ${items.length} 条`);
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.warn(`[Reddit/OAuth] r/${sub.name}:`, e instanceof Error ? e.message : e);
    }
  }
  return posts;
}

// -------------------------------------------------------
// 方案B: 无认证 JSON API，模拟浏览器 Header
// Reddit 对真实浏览器请求不封锁，Vercel 被封是因为 User-Agent 暴露
// 用完整浏览器 UA + Accept 头模拟正常访问
// -------------------------------------------------------
async function fetchViaPublicAPI(): Promise<any[]> {
  const posts: any[] = [];

  // 模拟真实 Chrome 浏览器请求头
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.reddit.com/',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  };

  // 只抓前3个核心版块（控制时间）
  const coreSubs = SUBREDDITS.slice(0, 3);

  for (const sub of coreSubs) {
    try {
      // 用 www.reddit.com + .json 后缀，加浏览器头
      const url = `https://www.reddit.com/r/${sub.name}/top.json?t=week&limit=25&raw_json=1`;
      const res = await fetch(url, {
        headers: browserHeaders,
        signal: AbortSignal.timeout(10000),
      });

      if (res.status === 429) {
        console.warn(`[Reddit/Public] r/${sub.name} 被限速(429)，等待后跳过`);
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      if (!res.ok) {
        console.warn(`[Reddit/Public] r/${sub.name} HTTP ${res.status}`);
        continue;
      }

      const data = await res.json();
      const children = data?.data?.children || [];

      const items = children
        .map((p: any) => ({
          title: p.data.title || '',
          link: `https://reddit.com${p.data.permalink}`,
          ups: p.data.ups || 0,
          comments: p.data.num_comments || 0,
          snippet: ((p.data.selftext || '') + ' ' + (p.data.title || '')).substring(0, 500),
          subreddit: sub.name,
          weight: sub.weight,
          flair: p.data.link_flair_text || '',
          combinedScore: (p.data.ups || 0) + (p.data.num_comments || 0) * 10,
        }))
        .filter((p: any) => p.ups > 10 || p.comments > 5);

      posts.push(...items);
      console.log(`[Reddit/Public] r/${sub.name}: ${items.length} 条 (HTTP ${res.status})`);
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.warn(`[Reddit/Public] r/${sub.name}:`, e instanceof Error ? e.message : e);
    }
  }
  return posts;
}

// -------------------------------------------------------
// 方案C: RSS Feed（最后备用）
// -------------------------------------------------------
async function fetchViaRSS(): Promise<any[]> {
  const posts: any[] = [];
  const Parser = require('rss-parser');
  const parser = new Parser({
    customFields: { item: [['content:encoded', 'contentEncoded']] },
  });

  for (const sub of SUBREDDITS.slice(0, 3)) {
    try {
      const url = `https://www.reddit.com/r/${sub.name}/hot/.rss?limit=20`;
      const feed = await Promise.race([
        parser.parseURL(url),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RSS timeout')), 8000)
        ),
      ]);
      const items = ((feed as any).items || []).map((item: any) => {
        const raw = item.contentEncoded || item.content || '';
        const upsMatch = raw.match(/([\d,]+)\s+point/i);
        const cmtMatch = raw.match(/([\d,]+)\s+comment/i);
        const ups = upsMatch ? parseInt(upsMatch[1].replace(/,/g, ''), 10) : 50;
        const comments = cmtMatch ? parseInt(cmtMatch[1].replace(/,/g, ''), 10) : 0;
        return {
          title: item.title || '',
          link: item.link || '',
          ups, comments,
          snippet: raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').substring(0, 300),
          subreddit: sub.name,
          weight: sub.weight,
          flair: '',
          combinedScore: ups + comments * 10,
        };
      }).filter((p: any) => p.combinedScore > 50);
      posts.push(...items);
      console.log(`[Reddit/RSS] r/${sub.name}: ${items.length} 条`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.warn(`[Reddit/RSS] r/${sub.name}:`, e instanceof Error ? e.message : e);
    }
  }
  return posts;
}

// -------------------------------------------------------
// 主入口：依次尝试三种方案
// -------------------------------------------------------
export async function crawlReddit() {
  const startTime = Date.now();
  try {
    console.log('[Reddit] 开始，自动选择最优方案...');

    let allPosts: any[] = [];
    let strategy = '';

    // 方案A: OAuth（配了 key 才跑）
    const token = await getOAuthToken();
    if (token) {
      strategy = 'OAuth';
      allPosts = await fetchViaOAuth(token);
    }

    // 方案B: 公开 JSON API + 浏览器头（主要降级方案）
    if (allPosts.length === 0) {
      strategy = 'PublicAPI';
      console.log('[Reddit] 尝试公开 JSON API（浏览器头模拟）...');
      allPosts = await fetchViaPublicAPI();
    }

    // 方案C: RSS（最终兜底）
    if (allPosts.length === 0) {
      strategy = 'RSS';
      console.log('[Reddit] 尝试 RSS 兜底...');
      allPosts = await fetchViaRSS();
    }

    if (allPosts.length === 0) {
      const msg = 'Reddit 三种方案均失败（Vercel IP 被完全封锁）。建议配置 REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET';
      await logCrawl({ source: 'reddit', status: 'failed', items_count: 0, error_message: msg, duration_ms: Date.now() - startTime });
      return { success: false, count: 0, error: msg };
    }

    // 去重 + 排序 + Top 20
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const p of allPosts) {
      const key = p.link || p.title;
      if (key && !seen.has(key)) { seen.add(key); unique.push(p); }
    }
    const topPosts = unique.sort((a, b) => b.combinedScore - a.combinedScore).slice(0, 20);

    const topics = topPosts.map((item, index) => ({
      title_zh: item.title,
      title_en: item.title,
      score: Math.min(100, Math.round(item.combinedScore / 100)),
      source: 'reddit' as const,
      source_label: `r/${item.subreddit}`,
      direction: getTrendDirection(index),
      source_url: item.link,
      source_id: `reddit_${Buffer.from(item.link || item.title).toString('base64').substring(0, 24)}`,
      raw_data: {
        ups: item.ups,
        num_comments: item.comments,
        subreddit: item.subreddit,
        weight: item.weight,
        article_content: item.snippet,
        flair: item.flair || '',
        strategy,
      },
    }));

    await deleteOldTopics('reddit', 60);
    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;
    await logCrawl({ source: 'reddit', status: 'success', items_count: topics.length, duration_ms: duration, error_message: null });
    console.log(`[Reddit] ✅ 写入 ${topics.length} 条（策略: ${strategy}），耗时 ${duration}ms`);
    return { success: true, count: topics.length };

  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    console.error('[Reddit] 异常:', msg);
    await logCrawl({ source: 'reddit', status: 'failed', items_count: 0, error_message: msg, duration_ms: Date.now() - startTime });
    return { success: false, count: 0, error: msg };
  }
}
