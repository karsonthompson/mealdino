import mongoose from 'mongoose';

if (process.env.NODE_ENV === 'development') {
  delete mongoose.connection.models.AgentProfile;
}

const AgentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true
    },
    medicalDisclaimerAcceptedAt: {
      type: Date,
      default: null
    },
    optimizationGoal: {
      type: String,
      default: ''
    },
    strictness: {
      type: String,
      enum: ['flexible', 'balanced', 'strict'],
      default: 'balanced'
    },
    hardConstraints: {
      type: [String],
      default: []
    },
    softPreferences: {
      type: [String],
      default: []
    },
    nutritionTargets: {
      source: {
        type: String,
        enum: ['user', 'estimated', 'none'],
        default: 'none'
      },
      calories: { type: Number, default: null },
      protein: { type: Number, default: null },
      carbs: { type: Number, default: null },
      fat: { type: Number, default: null }
    },
    profileMetrics: {
      heightCm: { type: Number, default: null },
      weightKg: { type: Number, default: null },
      age: { type: Number, default: null },
      sex: {
        type: String,
        enum: ['female', 'male', 'other', 'unspecified'],
        default: 'unspecified'
      },
      activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active', 'unspecified'],
        default: 'unspecified'
      }
    },
    budget: {
      enabled: { type: Boolean, default: false },
      weeklyAmount: { type: Number, default: null },
      currency: { type: String, default: 'USD' }
    },
    planPreferences: {
      allowGeneratedRecipes: { type: Boolean, default: true },
      includeGlobalRecipes: { type: Boolean, default: true },
      includeUserRecipes: { type: Boolean, default: true },
      avoidRepeatMeals: { type: Boolean, default: true },
      leftoversPreference: {
        type: String,
        enum: ['none', 'light', 'moderate', 'heavy'],
        default: 'moderate'
      },
      batchCookingPreference: {
        type: String,
        enum: ['none', 'light', 'moderate', 'heavy'],
        default: 'moderate'
      },
      maxCookTimeMinutes: { type: Number, default: null }
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.AgentProfile || mongoose.model('AgentProfile', AgentProfileSchema);
