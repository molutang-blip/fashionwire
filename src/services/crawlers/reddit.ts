import { insertTrendingTopics, logCrawl, deleteOldTopics, type TrendDirection } from '@/lib/supabase';

const SUBREDDITS = [
  'fashion',
  'streetwear',
  'malefashionadvice',
  'femalefashionadvice',
  'sneakers',
  'handbags',
  'luxuryfashion',
];

function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

// -------------------------------------------------------
// Reddit OAuth2 token（client_credentials，无需用户登录）
// 环境变量：REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET
// 若未配置则降级使用公开 .json 接口
// -------------------------------------------------------
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getRedditToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  // 复用未过期的 token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  try {
    const creds = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'FashionWire/1.0 by FashionWireApp',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) {
      console.warn(`[Reddit] Token 获取失败 ${res.status}`);
      return null;
    }
    const json = await res.json();
    cachedToken = {
      token: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    console.log('[Reddit] OAuth token 获取成功');
    return cachedToken.token;
  } catch (e) {
    console.warn('[Reddit] Token 请求异常', e);
    return null;
  }
}

async function fetchSubreddit(subreddit: string, token: string | null): Promise<any[]> {
  // 优先使用 OAuth API，降级使用公开接口
  const baseUrl = token
    ? `https://oauth.reddit.com/r/${subreddit}/hot?limit=25`
    : `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;

  const headers: Record<string, string> = {
    'User-Agent': 'FashionWire/1.0 by FashionWireApp',
    'Accept': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // 最多重试2次
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 1500));

      const res = await fetch(baseUrl, { headers });

      if (res.status === 429) {
        console.warn(`[Reddit] r/${subreddit} 被限速(429)，等待后重试`);
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }
      if (res.status === 403) {
        console.warn(`[Reddit] r/${subreddit} 拒绝访问(403)，可能需要配置OAuth`);
        return [];
      }
      if (!res.ok) {
        console.warn(`[Reddit] r/${subreddit} 返回 ${res.status}`);
        return [];
      }

      const data = await res.json();
      return data.data?.children || [];
    } catch (e) {
      console.error(`[Reddit] r/${subreddit} 第${attempt + 1}次异常:`, e);
    }
  }
  return [];
}

export async function crawlReddit() {
  const startTime = Date.now();

  try {
    console.log('[Reddit] Starting...');

    // 尝试获取 OAuth token（有 token 则绕过反爬）
    const token = await getRedditToken();
    if (token) {
      console.log('[Reddit] 使用 OAuth API');
    } else {
      console.log('[Reddit] 未配置 OAuth，使用公开接口（可能受限）');
    }

    const allPosts: any[] = [];

    for (const subreddit of SUBREDDITS) {
      const posts = await fetchSubreddit(subreddit, token);

      const filtered = posts
        .filter((p: any) => p.data.ups > 50 && p.data.num_comments > 5)
        .map((p: any, index: number) => ({
          title_zh: p.data.title,
          title_en: p.data.title,
          score: Math.round(p.data.ups + p.data.num_comments * 10),
          source: 'reddit' as const,
          source_label: `r/${subreddit}`,
          direction: getTrendDirection(index),
          source_url: `https://reddit.com${p.data.permalink}`,
          source_id: `reddit_${p.data.id}`,
          raw_data: {
            ups: p.data.ups,
            num_comments: p.data.num_comments,
            subreddit,
            created_utc: p.data.created_utc,
            article_content: (p.data.selftext || '').substring(0, 300),
            flair: p.data.link_flair_text || '',
          },
        }));

      allPosts.push(...filtered);
      console.log(`[Reddit] r/${subreddit}: ${filtered.length} 条（共 ${posts.length} 原始帖）`);

      // 各 subreddit 之间间隔 500ms，避免触发限速
      await new Promise(r => setTimeout(r, 500));
    }

    if (allPosts.length === 0) {
      const msg = token
        ? '所有 subreddit 均无符合条件的帖子'
        : '无法访问 Reddit（未配置 OAuth，公开接口被封）';
      console.warn(`[Reddit] ${msg}`);
      await logCrawl({
        source: 'reddit', status: 'failed',
        items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
      });
      return { success: false, count: 0, error: msg };
    }

    const topPosts = allPosts.sort((a, b) => b.score - a.score).slice(0, 20);

    await deleteOldTopics('reddit', 60);
    await insertTrendingTopics(topPosts);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'reddit', status: 'success',
      items_count: topPosts.length, duration_ms: duration, error_message: null,
    });

    console.log(`[Reddit] 写入 ${topPosts.length} 条，耗时 ${duration}ms`);
    return { success: true, count: topPosts.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    await logCrawl({
      source: 'reddit', status: 'failed',
      items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
    });
    return { success: false, count: 0, error: msg };
  }
}


function getTrendDirection(index: number): TrendDirection {
  if (index < 3) return 'up';
  if (index > 7) return 'down';
  return 'flat';
}

export async function crawlReddit() {
  const startTime = Date.now();

  try {
    console.log('[Reddit] Starting...');
    const allPosts: any[] = [];

    for (const subreddit of SUBREDDITS) {
      try {
        // 增加每个subreddit的抓取量到25条，提高命中率
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
          {
            headers: {
              'User-Agent': 'FashionWire/1.0 (fashion intelligence platform)',
              'Accept': 'application/json',
            },
          }
        );
        if (!response.ok) {
          console.warn(`[Reddit] r/${subreddit} 返回 ${response.status}`);
          continue;
        }

        const data = await response.json();
        const posts = data.data?.children || [];

        const filtered = posts
          // 降低过滤阈值：ups>50 && comments>5，大幅扩大可用数据范围
          // PRD要求的 ups>1000 仅适用于详情页展示，首页抓取需要更宽松
          .filter((p: any) => p.data.ups > 50 && p.data.num_comments > 5)
          .map((p: any, index: number) => {
            // 提取帖子的 selftext（帖子正文）供标题生成使用
            const selftext = (p.data.selftext || '').substring(0, 300);

            return {
              title_zh: p.data.title,   // 原始标题，中文生成交给融合层
              title_en: p.data.title,
              score: Math.round(p.data.ups + p.data.num_comments * 10),
              source: 'reddit' as const,
              source_label: `r/${subreddit}`,
              direction: getTrendDirection(index),
              source_url: `https://reddit.com${p.data.permalink}`,
              source_id: `reddit_${p.data.id}`,
              raw_data: {
                ups: p.data.ups,
                num_comments: p.data.num_comments,
                subreddit,
                created_utc: p.data.created_utc,
                // 保存帖子正文内容，供融合层生成更有意义的中文标题
                article_content: selftext,
                // 保存 flair 标签（如 "Discussion", "Outfit", "Review" 等）
                flair: p.data.link_flair_text || '',
              },
            };
          });

        allPosts.push(...filtered);
        console.log(`[Reddit] r/${subreddit}: 获取 ${filtered.length} 条帖子`);
      } catch {
        console.error(`[Reddit] r/${subreddit} 抓取失败`);
      }
    }

    if (allPosts.length === 0) {
      console.warn('[Reddit] No posts found');
      return { success: false, count: 0, error: 'No Reddit data' };
    }

    // 按综合分数排序，取 Top 20（从之前的15增加到20）
    const topPosts = allPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // 保留数量从30增加到60，保留更多历史数据
    await deleteOldTopics('reddit', 60);
    await insertTrendingTopics(topPosts);

    const duration = Date.now() - startTime;
    await logCrawl({
      source: 'reddit', status: 'success',
      items_count: topPosts.length, duration_ms: duration, error_message: null,
    });

    console.log(`[Reddit] Fetched ${topPosts.length} posts from ${SUBREDDITS.length} subreddits`);
    return { success: true, count: topPosts.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知错误';
    await logCrawl({
      source: 'reddit', status: 'failed',
      items_count: 0, error_message: msg, duration_ms: Date.now() - startTime,
    });
    return { success: false, count: 0, error: msg };
  }
}
