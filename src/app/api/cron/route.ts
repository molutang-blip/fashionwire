import { NextRequest, NextResponse } from 'next/server';
import { crawlAll } from '../../../services/crawlers';

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('CRON_SECRET not configured - allowing all requests');
    return true;
  }
  
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  const { searchParams } = new URL(request.url);
  if (searchParams.get('secret') === cronSecret) {
    return true;
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const useMock = searchParams.get('mock') === 'true';
    
    console.log(`[Cron] 开始执行数据抓取任务 (mock=${useMock})`);
    
    const results = await crawlAll();
    const duration = Date.now() - startTime;
    
    console.log(`[Cron] 抓取完成，耗时 ${duration}ms`, results);
    
    return NextResponse.json({
      success: true,
      duration_ms: duration,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Cron] 抓取任务失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        duration_ms: duration,
        error: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
