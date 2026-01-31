import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// Disable body parsing — Stripe needs the raw body to verify the signature
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  await dbConnect();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling event ${event.type}:`, error);
    // Return 200 anyway so Stripe doesn't retry — log the error for debugging
    return NextResponse.json({ received: true, error: error.message });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session) {
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription;
  const customerId = session.customer;

  if (!userId || !subscriptionId) {
    console.error('Missing userId or subscriptionId in checkout session:', session.id);
    return;
  }

  // Fetch the full subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await User.findByIdAndUpdate(userId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    subscriptionStatus: subscription.status,
    subscriptionPlan: 'pro_weekly',
    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  console.log(`Subscription activated for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }

  const updateData = {
    subscriptionStatus: subscription.status,
    stripeSubscriptionId: subscription.id,
    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };

  // If subscription was canceled but still active until period end
  if (subscription.cancel_at_period_end) {
    updateData.subscriptionStatus = 'canceled';
  }

  await User.findByIdAndUpdate(user._id, updateData);
  console.log(`Subscription updated for user ${user._id}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) {
    console.error('No user found for Stripe customer:', customerId);
    return;
  }

  await User.findByIdAndUpdate(user._id, {
    subscriptionStatus: 'none',
    stripeSubscriptionId: null,
    subscriptionPlan: null,
    subscriptionCurrentPeriodEnd: null,
  });

  console.log(`Subscription deleted for user ${user._id}`);
}

async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return; // One-time payment, not a subscription

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  // Fetch fresh subscription data
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await User.findByIdAndUpdate(user._id, {
    subscriptionStatus: 'active',
    subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
  });

  console.log(`Payment succeeded for user ${user._id}`);
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const user = await User.findOne({ stripeCustomerId: customerId });
  if (!user) return;

  await User.findByIdAndUpdate(user._id, {
    subscriptionStatus: 'past_due',
  });

  console.log(`Payment failed for user ${user._id}`);
}
