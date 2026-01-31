import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id).select(
      'subscriptionStatus subscriptionPlan subscriptionCurrentPeriodEnd stripeCustomerId'
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isActive =
      (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') &&
      (!user.subscriptionCurrentPeriodEnd ||
        new Date(user.subscriptionCurrentPeriodEnd) > new Date());

    return NextResponse.json({
      success: true,
      data: {
        isActive,
        status: user.subscriptionStatus || 'none',
        plan: user.subscriptionPlan || null,
        currentPeriodEnd: user.subscriptionCurrentPeriodEnd || null,
        hasStripeCustomer: !!user.stripeCustomerId,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
