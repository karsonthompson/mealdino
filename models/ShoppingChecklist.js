import mongoose from 'mongoose';

const ShoppingChecklistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    signature: {
      type: String,
      required: true,
      index: true
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    },
    includeMeals: {
      type: Boolean,
      default: true
    },
    includeCookingSessions: {
      type: Boolean,
      default: true
    },
    checkedKeys: {
      type: [String],
      default: []
    },
    manualItems: {
      type: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, min: 0, default: 0 },
        unit: { type: String, default: '' },
        aisle: { type: String, default: 'Other' }
      }],
      default: []
    }
  },
  {
    timestamps: true
  }
);

ShoppingChecklistSchema.index({ userId: 1, signature: 1 }, { unique: true });

export default mongoose.models.ShoppingChecklist || mongoose.model('ShoppingChecklist', ShoppingChecklistSchema);
