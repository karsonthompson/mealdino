import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // NextAuth fields (managed by the adapter)
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    emailVerified: { type: Date },
    image: { type: String },

    // Stripe/customer fields (superset for legacy + current flows)
    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionId: {
      type: String,
      default: null,
    },
    hasAccess: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused', 'none', null],
      default: null,
    },
    subscriptionPlan: {
      type: String,
      default: null,
    },
    subscriptionCurrentPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    // Important: use the same collection NextAuth uses
    collection: 'users',
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
