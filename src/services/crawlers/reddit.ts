import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

// -------------------------------------------------------
// Reddit 数据源 - 多策略并行，绕过IP封锁
//
// 策略优先级：
// 1. RSS Feed（r/{sub}/hot/.rss）           ← 最稳定，用现有rss-parser
// 2. JSON API（old.reddit.com/.json）       ← 子域名，封锁率更低
// 3. Pushshift API（第三方存档）             ← 无需认证，备用
// -------------------------------------------------------

// 精简为3个核心子版块（控制总请求时间在15s内）
const SUBREDDITS = [
  { name: 'fashion',    weight: 1.2 },
  { name: 'streetwear', weight: 1.1 },
  { name: 'sneakers',   weight: 0.9 },
];

const Parser = require('rss-parser');
const parser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'thumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

function extractScore(content: string): number {
  const match = content.match(/([\d,]+)\s+point/i);
  if (match) return parseInt(match[1].replace(/,/g, ''), 10);
  return 100;
}

function extractComments(content: string): number {
  const match = content.match(/([\d,]+)\s+comment/i);
  if (match) return parseInt(match[1].replace(/,/g, ''), 10);
  return 0;
}

function cleanContent(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 300);
}

// -------------------------------------------------------
// 策略1: RSS Feed（rss-parser，已有依赖，最轻量）
// 每个子版块设置 8 秒超时，防止单个阻塞整体
// -------------------------------------------------------
async function fetchViaRSS(): Promise<any[]> {
  const posts: any[] = [];

  for (const sub of SUBREDDITS) {
    try {
      const url = `https://www.reddit.com/r/${sub.name}/hot/.rss?limit=20`;

      // 带超时的 Promise 竞争，防止单个 RSS 请求卡住
      const feed = await Promise.race([
        parser.parseURL(url),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RSS timeout')), 8000)
        ),
      ]);

      const items = ((feed as any).items || []).map((item: any) => {
        const raw = item.contentEncoded || item.content || item.contentSnippet || '';
        const ups = extractScore(raw);
        const comments = extractComments(raw);
        return {
          title: item.title || '',
          link: item.link || item.id || '',
          ups,
          comments,
          snippet: cleanContent(raw),
          subreddit: sub.name,
          weight: sub.weight,
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
// 策略2: Reddit JSON API（old.reddit.com，封锁率更低）
// 精简为3个子版块，每个 8 秒超时
// -------------------------------------------------------
async function fetchViaSearch(): Promise<any[]> {
  const posts: any[] = [];

  const endpoints = [
    { url: 'https://old.reddit.com/r/fashion/top.json?t=week&limit=20', sub: 'fashion', weight: 1.2 },
    { url: 'https://old.reddit.com/r/streetwear/top.json?t=week&limit=15', sub: 'streetwear', weight: 1.1 },
    { url: 'https://old.reddit.com/r/sneakers/top.json?t=week&limit=10', sub: 'sneakers', weight: 0.9 },
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; FashionWire/1.0; +https://fashionwire.app)',
    'Accept': 'application/json',
  };

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(ep.url, { headers, signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(`[Reddit/JSON] r/${ep.sub} 返回 ${res.status}`);
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
          snippet: (p.data.selftext || p.data.url || '').substring(0, 300),
          subreddit: ep.sub,
          weight: ep.weight,
          combinedScore: (p.data.ups || 0) + (p.data.num_comments || 0) * 10,
        }))
        .filter((p: any) => p.ups > 10 || p.comments > 5);

      posts.push(...items);
      console.log(`[Reddit/JSON] r/${ep.sub}: ${items.length} 条`);
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.warn(`[Reddit/JSON] r/${ep.sub} 异常:`, e instanceof Error ? e.message : e);
    }
  }

  return posts;
}

// -------------------------------------------------------
// 策略3: Pushshift API（第三方Reddit存档，无IP限制）
// 注：Pushshift有时不稳定，作为最终备用
// -------------------------------------------------------
async function fetchViaPushshift(): Promise<any[]> {
  try {
    const subreddits = SUBREDDITS.map(s => s.name).join(',');
    const url = `https://api.pushshift.io/reddit/search/submission/?subreddit=${subreddits}&sort=score&size=20&q=fashion`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'FashionWire/1.0' },
    });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.data || []).map((p: any) => ({
      title: p.title || '',
      link: `https://reddit.com${p.permalink || ''}`,
      ups: p.score || 0,
      comments: p.num_comments || 0,
      snippet: (p.selftext || '').substring(0, 300),
      subreddit: p.subreddit,
      weight: 1.0,
      combinedScore: (p.score || 0) + (p.num_comments || 0) * 10,
    }));
  } catch {
    return [];
  }
}

// -------------------------------------------------------
// 主入口：两种策略并行，25秒总超时保护
// -------------------------------------------------------
export async function crawlReddit() {
  const startTime = Date.now();

  try {
    console.log('[Reddit] Starting with multi-strategy fallback...');

    // 先快速测试 Reddit 是否可访问
    const pingOk = await fetch('https://www.reddit.com/r/fashion/hot/.rss?limit=1', {
      headers: { 'User-Agent': 'FashionWire/1.0' },
      signal: AbortSignal.timeout(5000),
    }).then(r => {
      console.log(`[Reddit] 连通性测试: HTTP ${r.status}`);
      return r.ok || r.status === 429; // 429=限速但可达
    }).catch(e => {
      console.warn('[Reddit] 连通性测试失败:', e.message);
      return false;
    });

    if (!pingOk) {
      const msg = 'Reddit 网络不可达（Vercel IP 被全面封锁），跳过Reddit数据源';
      console.warn(`[Reddit] ${msg}`);
      await logCrawl({ source: 'reddit', status: 'failed', items_count: 0, error_message: msg, duration_ms: Date.now() - startTime });
      return { success: false, count: 0, error: msg };
    }

    // 两种策略并行，各自内部有 8s 超时，整体加 25s 保险
    const [rssResults, searchResults] = await Promise.race([
      Promise.all([
        fetchViaRSS().catch(() => []),
        fetchViaSearch().catch(() => []),
      ]),
      new Promise<[any[], any[]]>((_, reject) =>
        setTimeout(() => reject(new Error('Reddit整体超时（25s）')), 25000)
      ),
    ]);

    console.log(`[Reddit] RSS: ${rssResults.length}, JSON-API: ${searchResults.length}`);

    // 合并去重（以 link 为唯一键）
    const seen = new Set<string>();
    const allPosts: any[] = [];
    for (const post of [...rssResults, ...searchResults]) {
      const key = post.link || post.title;
      if (key && !seen.has(key)) {
        seen.add(key);
        allPosts.push(post);
      }
    }

    if (allPosts.length === 0) {
      console.log('[Reddit] RSS+JSON 均无结果，尝试 Pushshift...');
      const pushResults = await fetchViaPushshift().catch(() => []);
      allPosts.push(...pushResults);
    }

    if (allPosts.length === 0) {
      const msg = 'RSS、JSON API、Pushshift 三种策略均失败（Reddit 屏蔽了 Vercel IP）';
      console.warn(`[Reddit] ${msg}`);
      await logCrawl({
        source: 'reddit', status: 'failed',
        items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
      });
      return { success: false, count: 0, error: msg };
    }

    const topPosts = allPosts
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, 20);

    const topics = topPosts.map((item, index) => ({
      title_zh: item.title,
      title_en: item.title,
      score: Math.round(item.combinedScore),
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
        flair: '',
      },
    }));

    await deleteOldTopics('reddit', 60);
    await insertTrendingTopics(topics);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'reddit', status: 'success',
      items_count: topics.length, duration_ms: duration, error_message: null,
    });

    console.log(`[Reddit] 写入 ${topics.length} 条，耗时 ${duration}ms`);
    return { success: true, count: topics.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    console.error('[Reddit] Error:', msg);
    await logCrawl({
      source: 'reddit', status: 'failed',
      items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
    });
    return { success: false, count: 0, error: msg };
  }
}
