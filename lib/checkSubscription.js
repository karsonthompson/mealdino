import { auth } from '@/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

/**
 * Check if the current authenticated user has an active subscription.
 * Returns { isActive, subscription } or throws if not authenticated.
 *
 * Usage:
 *   const { isActive, subscription } = await checkSubscription();
 *   if (!isActive) { // gate feature }
 */
export async function checkSubscription() {
  const session = await auth();

  if (!session?.user?.id) {
    return { isActive: false, subscription: null };
  }

  await dbConnect();

  const user = await User.findById(session.user.id).select(
    'subscriptionStatus subscriptionPlan subscriptionCurrentPeriodEnd stripeCustomerId'
  );

  if (!user) {
    return { isActive: false, subscription: null };
  }

  const isActive =
    user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

  // Also check if the period hasn't expired (belt + suspenders with Stripe webhooks)
  const periodValid =
    !user.subscriptionCurrentPeriodEnd ||
    new Date(user.subscriptionCurrentPeriodEnd) > new Date();

  return {
    isActive: isActive && periodValid,
    subscription: {
      status: user.subscriptionStatus,
      plan: user.subscriptionPlan,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      hasStripeCustomer: !!user.stripeCustomerId,
    },
  };
}
