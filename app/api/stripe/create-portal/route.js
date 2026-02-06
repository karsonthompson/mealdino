import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import stripe from '@/lib/stripe';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

function resolveAppUrl(request) {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (fromEnv) {
    return fromEnv.replace(/\/+$/, '');
  }

  const fromNext = request?.nextUrl?.origin;
  if (fromNext) {
    return fromNext.replace(/\/+$/, '');
  }

  const proto = request?.headers?.get('x-forwarded-proto') || 'https';
  const host = request?.headers?.get('x-forwarded-host') || request?.headers?.get('host');
  if (host) {
    return `${proto}://${host}`.replace(/\/+$/, '');
  }

  return 'http://localhost:3000';
}

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
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Validate existing customer ID for the current key/mode.
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

    // Recover from subscription record when customer id is stale/outdated.
    if (!stripeCustomerId && user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        stripeCustomerId = typeof subscription?.customer === 'string' ? subscription.customer : null;
        if (stripeCustomerId) {
          user.stripeCustomerId = stripeCustomerId;
          await user.save();
        }
      } catch (error) {
        if (!(error?.code === 'resource_missing')) {
          throw error;
        }
      }
    }

    // Recover gracefully if DB missed the customer id but Stripe has one for this email.
    if (!stripeCustomerId && session.user.email) {
      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 1
      });

      stripeCustomerId = customers.data[0]?.id || null;
      if (stripeCustomerId) {
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing customer found for this environment. Ensure production uses the matching Stripe mode (live vs test).' },
        { status: 400 }
      );
    }

    const appUrl = resolveAppUrl(request);

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/pricing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    const message = error?.message || 'Failed to create billing portal session';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
