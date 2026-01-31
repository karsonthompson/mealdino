import { NextResponse } from 'next/server';
import { checkSubscription } from '@/lib/subscription';

export async function GET(req) {
  try {
    const { isSubscribed, subscriptionStatus } = await checkSubscription();

    return NextResponse.json({
      isSubscribed,
      subscriptionStatus: subscriptionStatus || 'none',
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json({ error: 'Failed to check subscription' }, { status: 500 });
  }
}
