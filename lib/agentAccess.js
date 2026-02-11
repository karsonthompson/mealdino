import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function checkAgentAccess(userId) {
  if (!userId) {
    return { allowed: false, reason: 'Authentication required' };
  }

  await dbConnect();
  const user = await User.findById(userId).select('subscriptionStatus subscriptionCurrentPeriodEnd');

  if (!user) {
    return { allowed: false, reason: 'User not found' };
  }

  const isActive = user.subscriptionStatus === 'active';
  const periodValid =
    !user.subscriptionCurrentPeriodEnd ||
    new Date(user.subscriptionCurrentPeriodEnd) > new Date();

  if (!isActive || !periodValid) {
    return { allowed: false, reason: 'Active subscription required' };
  }

  return { allowed: true, reason: null };
}
