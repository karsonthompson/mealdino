import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import connectMongo from '@/lib/mongodb';

const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectMongo();
  const User = mongoose.models.User || mongoose.model('User');

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await User.findOneAndUpdate(
          { email: session.customer_email },
          {
            stripeCustomerId: session.customer,
            subscriptionStatus: 'active',
            subscriptionId: session.subscription,
          }
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await User.findOneAndUpdate(
          { stripeCustomerId: subscription.customer },
          { subscriptionStatus: subscription.status }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await User.findOneAndUpdate(
          { stripeCustomerId: subscription.customer },
          { subscriptionStatus: 'canceled' }
        );
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
