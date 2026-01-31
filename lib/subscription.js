import { getServerSession } from 'next-auth';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

export async function checkSubscription() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return { isSubscribed: false, user: null };
  }

  await connectMongo();

  const user = await User.findOne({ email: session.user.email });

  if (!user) {
    return { isSubscribed: false, user: null };
  }

  return {
    isSubscribed: user.subscriptionStatus === 'active',
    subscriptionStatus: user.subscriptionStatus,
    user,
  };
}
