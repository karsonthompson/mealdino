import { auth } from '@/auth';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

export async function checkSubscription() {
  const session = await auth();

  if (!session?.user?.email) {
    return { isSubscribed: false, user: null };
  }

  await connectMongo();

  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return { isSubscribed: false, user: null };
  }

  const activeStatuses = new Set(['active', 'trialing', 'past_due']);

  return {
    isSubscribed: activeStatuses.has(user.subscriptionStatus),
    subscriptionStatus: user.subscriptionStatus,
    user,
  };
}
