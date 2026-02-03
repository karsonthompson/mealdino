/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_PRICING_TABLE_ID: process.env.STRIPE_PRICING_TABLE_ID,
  },
};

export default nextConfig;
