import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// -------------------------------------------------------
// Reddit 数据源 - 官方 OAuth2 API（最可靠，不会被封）
//
// 申请方式：https://www.reddit.com/prefs/apps
// 选择 "script" 类型，获取 CLIENT_ID 和 CLIENT_SECRET
//
// 需要配置环境变量：
//   REDDIT_CLIENT_ID     = 你的 client id
//   REDDIT_CLIENT_SECRET = 你的 client secret
//
// 降级策略（OAuth 未配置时）：
//   RSS Feed → old.reddit.com JSON API
// -------------------------------------------------------

const SUBREDDITS = [
  { name: 'fashion',              weight: 1.2 },
  { name: 'streetwear',           weight: 1.1 },
  { name: 'malefashionadvice',    weight: 1.0 },
  { name: 'femalefashionadvice',  weight: 1.0 },
  { name: 'sneakers',             weight: 0.9 },
  { name: 'handbags',             weight: 0.9 },
  { name: 'luxuryfashion',        weight: 1.0 },
];

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

function cleanContent(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

// -------------------------------------------------------
// 获取 Reddit OAuth2 Access Token
// 使用 client_credentials 流程（无需用户登录）
// -------------------------------------------------------
async function getRedditAccessToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('[Reddit/OAuth] 未配置 REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET，跳过 OAuth');
    return null;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'FashionWire/1.0 by fashionwire_app',
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[Reddit/OAuth] Token 请求失败: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    console.log('[Reddit/OAuth] 成功获取 Access Token');
    return data.access_token || null;
  } catch (e) {
    console.warn('[Reddit/OAuth] Token 获取异常:', e instanceof Error ? e.message : e);
    return null;
  }
}

// -------------------------------------------------------
// 策略1（主）: 官方 OAuth API
// 使用 oauth.reddit.com，有官方额度，不会被封
// -------------------------------------------------------
async function fetchViaOAuth(token: string): Promise<any[]> {
  const posts: any[] = [];

  for (const sub of SUBREDDITS) {
    try {
      const url = `https://oauth.reddit.com/r/${sub.name}/top?t=week&limit=25`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'FashionWire/1.0 by fashionwire_app',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        console.warn(`[Reddit/OAuth] r/${sub.name} 返回 ${res.status}`);
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
          // 正文内容（selftext）+ 文章标题作为 article_content
          snippet: ((p.data.selftext || '') + ' ' + (p.data.title || '')).substring(0, 500),
          subreddit: sub.name,
          weight: sub.weight,
          flair: p.data.link_flair_text || '',
          combinedScore: (p.data.ups || 0) + (p.data.num_comments || 0) * 10,
        }))
        .filter((p: any) => p.ups > 20 || p.comments > 10);

      posts.push(...items);
      console.log(`[Reddit/OAuth] r/${sub.name}: ${items.length} 条`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.warn(`[Reddit/OAuth] r/${sub.name} 异常:`, e instanceof Error ? e.message : e);
    }
  }

  return posts;
}

// -------------------------------------------------------
// 策略2（降级）: RSS Feed（OAuth 未配置时使用）
// -------------------------------------------------------
const Parser = require('rss-parser');
const parser = new Parser({
  customFields: { item: [['content:encoded', 'contentEncoded']] },
});

async function fetchViaRSS(): Promise<any[]> {
  const posts: any[] = [];
  // 降级只抓3个版块，控制时间
  const fallbackSubs = SUBREDDITS.slice(0, 3);

  for (const sub of fallbackSubs) {
    try {
      const url = `https://www.reddit.com/r/${sub.name}/hot/.rss?limit=20`;
      const feed = await Promise.race([
        parser.parseURL(url),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RSS timeout')), 8000)
        ),
      ]);

      const items = ((feed as any).items || []).map((item: any) => {
        const raw = item.contentEncoded || item.content || item.contentSnippet || '';
        const upsMatch = raw.match(/([\d,]+)\s+point/i);
        const cmtMatch = raw.match(/([\d,]+)\s+comment/i);
        const ups = upsMatch ? parseInt(upsMatch[1].replace(/,/g, ''), 10) : 50;
        const comments = cmtMatch ? parseInt(cmtMatch[1].replace(/,/g, ''), 10) : 0;
        return {
          title: item.title || '',
          link: item.link || '',
          ups,
          comments,
          snippet: cleanContent(raw),
          subreddit: sub.name,
          weight: sub.weight,
          flair: '',
          combinedScore: ups + comments * 10,
        };
      }).filter((p: any) => p.ups > 10 || p.combinedScore > 50);

      posts.push(...items);
      console.log(`[Reddit/RSS] r/${sub.name}: ${items.length} 条`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.warn(`[Reddit/RSS] r/${sub.name} 失败:`, e instanceof Error ? e.message : e);
    }
  }

  return posts;
}

// -------------------------------------------------------
// 主入口
// -------------------------------------------------------
export async function crawlReddit() {
  const startTime = Date.now();

  try {
    console.log('[Reddit] 开始抓取...');

    let allPosts: any[] = [];
    let strategy = '';

    // 优先使用 OAuth API
    const token = await getRedditAccessToken();

    if (token) {
      strategy = 'OAuth';
      allPosts = await fetchViaOAuth(token);
      console.log(`[Reddit/OAuth] 共获取 ${allPosts.length} 条帖子`);
    } else {
      // 降级到 RSS
      strategy = 'RSS';
      console.log('[Reddit] 使用 RSS 降级方案（未配置 OAuth）');
      allPosts = await fetchViaRSS();
      console.log(`[Reddit/RSS] 共获取 ${allPosts.length} 条帖子`);
    }

    if (allPosts.length === 0) {
      const msg = token
        ? 'OAuth API 返回空数据（Reddit 可能暂时限速）'
        : 'RSS 降级也失败（Vercel IP 被 Reddit 封锁）。请配置 REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET';
      console.warn(`[Reddit] ${msg}`);
      await logCrawl({ source: 'reddit', status: 'failed', items_count: 0, error_message: msg, duration_ms: Date.now() - startTime });
      return { success: false, count: 0, error: msg };
    }

    // 去重 + 排序 + 取 Top 20
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
