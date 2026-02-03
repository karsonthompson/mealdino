import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    image: String,

    // Stripe fields
    stripeCustomerId: String,
    subscriptionId: String,
    hasAccess: {
      type: Boolean,
      default: false,
    },
    subscriptionStatus: {
      type: String,
      enum: [
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'incomplete',
        'incomplete_expired',
        'paused',
        null,
      ],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
