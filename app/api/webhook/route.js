import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: '2023-10-16',
});

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: 'Missing webhook config' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const { data, type } = event;
    console.log('Stripe webhook received:', type);

    await connectMongo();

    if (type === 'checkout.session.completed') {
      const checkoutSession = data.object;
      const userId =
        checkoutSession.metadata?.userId || checkoutSession.client_reference_id;
      const email =
        checkoutSession.metadata?.userEmail ||
        checkoutSession.customer_details?.email ||
        checkoutSession.customer_email;
      const update = {
        stripeCustomerId: checkoutSession.customer,
        subscriptionId: checkoutSession.subscription,
        hasAccess: true,
      };

      if (checkoutSession.subscription) {
        const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription);
        update.subscriptionStatus = subscription.status;
      } else {
        update.subscriptionStatus = 'active';
      }

      let updatedUser = null;
      if (userId && /^[a-fA-F0-9]{24}$/.test(userId)) {
        updatedUser = await User.findByIdAndUpdate(userId, update);
      }
      if (!updatedUser && email) {
        updatedUser = await User.findOneAndUpdate({ email }, update);
      }
      if (!updatedUser) {
        console.warn(
          'Stripe webhook: user not found for checkout.session.completed',
          { userId, email }
        );
      }
    } else if (type === 'customer.subscription.updated') {
      const subscription = data.object;
      await User.findOneAndUpdate(
        { stripeCustomerId: subscription.customer },
        {
          hasAccess: subscription.status === 'active' || subscription.status === 'trialing',
          subscriptionStatus: subscription.status,
          subscriptionId: subscription.id,
        }
      );
    } else if (type === 'customer.subscription.deleted') {
      const subscription = data.object;
      const user = await User.findOne({ stripeCustomerId: subscription.customer });
      if (user) {
        user.hasAccess = false;
        user.subscriptionStatus = 'canceled';
        await user.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
  }
}
