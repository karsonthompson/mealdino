import mongoose from 'mongoose';

const IngredientPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    normalizedName: {
      type: String,
      required: true,
      index: true
    },
    aisle: {
      type: String,
      required: true,
      default: 'Other'
    }
  },
  {
    timestamps: true
  }
);

IngredientPreferenceSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });

export default mongoose.models.IngredientPreference || mongoose.model('IngredientPreference', IngredientPreferenceSchema);
