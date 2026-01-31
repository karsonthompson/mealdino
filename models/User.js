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
    subscriptionStatus: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
