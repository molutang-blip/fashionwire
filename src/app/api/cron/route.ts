import { NextRequest, NextResponse } from 'next/server';
import { crawlAndFuse } from '../../../services/crawlers';

// Vercel Hobby 最大 60s；用 waitUntil 让响应先返回，后台继续完成全部工作
export const maxDuration = 60;

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured - allowing all requests');
    return true;
  }
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const { searchParams } = new URL(request.url);
  if (searchParams.get('key') === cronSecret) return true;
  if (searchParams.get('secret') === cronSecret) return true;

  return false;
}

async function runCrawlFuse(): Promise<{ success: boolean; duration_ms: number; results?: unknown; error?: string }> {
  const startTime = Date.now();
  try {
    console.log('[Cron] start: crawl → fuse');
    const results = await crawlAndFuse();
    const duration = Date.now() - startTime;
    console.log(`[Cron] done in ${duration}ms, fusion:`, JSON.stringify(results.fusion));
    return { success: true, duration_ms: duration, results };
  } catch (error) {
    const duration = Date.now() - startTime;
    const msg = error instanceof Error ? error.message : 'unknown error';
    console.error(`[Cron] failed (${duration}ms):`, msg);
    return { success: false, duration_ms: duration, error: msg };
  }
}

export async function GET(request: NextRequest) {
  return handler(request);
}
export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTs = new Date().toISOString();

  // waitUntil: 先返回 202，后台继续执行（突破 60s 响应限制）
  const ctx = (request as unknown as { waitUntil?: (p: Promise<unknown>) => void });
  if (typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(runCrawlFuse());
    return NextResponse.json(
      { success: true, message: 'accepted, running in background (60-120s)', accepted_at: startTs },
      { status: 202 }
    );
  }

  // 降级：本地 dev 直接等待
  const result = await runCrawlFuse();
  return NextResponse.json({ ...result, timestamp: startTs }, { status: result.success ? 200 : 500 });
}
