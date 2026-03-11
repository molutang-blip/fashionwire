import { NextRequest, NextResponse } from 'next/server';
import { runFusion } from '../../../services/fusion';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const { searchParams } = new URL(request.url);
    const valid =
      authHeader === `Bearer ${cronSecret}` ||
      searchParams.get('secret') === cronSecret;
    if (!valid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  try {
    console.log('[FusionAPI] 仅执行融合...');
    const result = await runFusion();
    const duration = Date.now() - startTime;
    return NextResponse.json({ success: true, duration_ms: duration, result });
  } catch (error) {
    const duration = Date.now() - startTime;
    return NextResponse.json(
      { success: false, duration_ms: duration, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
