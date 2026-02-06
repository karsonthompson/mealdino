import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import stripe from '@/lib/stripe';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user already has an active subscription, redirect to portal instead
    if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
      return NextResponse.json(
        { error: 'Already subscribed. Use the billing portal to manage your subscription.' },
        { status: 400 }
      );
    }

    // Create or reuse Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    // Guard against stale customer IDs when switching Stripe mode.
    if (stripeCustomerId) {
      try {
        await stripe.customers.retrieve(stripeCustomerId);
      } catch (error) {
        if (error?.code === 'resource_missing' || /No such customer/i.test(error?.message || '')) {
          stripeCustomerId = null;
        } else {
          throw error;
        }
      }
    }

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name || undefined,
        metadata: {
          userId: session.user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID to user
      await User.findByIdAndUpdate(session.user.id, {
        stripeCustomerId: customer.id,
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Checkout Session for $3/week subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'MealDino Pro',
              description: 'Weekly meal planning subscription — unlimited recipes, meal plans, and collections',
            },
            unit_amount: 300, // $3.00 in cents
            recurring: {
              interval: 'week',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
