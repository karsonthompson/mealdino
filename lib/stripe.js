import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

if (!stripeSecret) {
  throw new Error('Missing Stripe secret environment variable (set STRIPE_SECRET_KEY or STRIPE_SECRET)');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-04-10',
});

export default stripe;
