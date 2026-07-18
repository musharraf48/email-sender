import { NextRequest, NextResponse } from 'next/server';
import { checkInboxReplies } from '@/lib/check-replies';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');

  // If credentials are provided, they must match
  if (authHeader || querySecret) {
    return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
  }

  // Allow manual / UI triggers without secret (personal app)
  return true;
};

async function handleCheck(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkInboxReplies();
    return NextResponse.json({
      success: true,
      message:
        result.matched > 0
          ? `Found ${result.matched} new reply(ies)`
          : 'No new replies found',
      ...result,
    });
  } catch (error: unknown) {
    console.error('Check replies error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check replies';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCheck(request);
}

export async function POST(request: NextRequest) {
  return handleCheck(request);
}
