import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    // NextAuth fields (managed by the adapter)
    name: { type: String },
    email: { type: String, unique: true, sparse: true },
    emailVerified: { type: Date },
    image: { type: String },

    // Stripe subscription fields
    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'none'],
      default: 'none',
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
