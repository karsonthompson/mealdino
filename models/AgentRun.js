import mongoose from 'mongoose';

if (process.env.NODE_ENV === 'development') {
  delete mongoose.connection.models.AgentRun;
}

const AgentRunSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentProfile',
      default: null
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'applied', 'failed'],
      default: 'draft',
      index: true
    },
    model: {
      type: String,
      default: 'gpt-4o-mini'
    },
    dateRange: {
      start: { type: String, required: true },
      end: { type: String, required: true }
    },
    overwriteExistingDays: {
      type: Boolean,
      default: true
    },
    inputSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    outputDraft: {
      mealPlanDays: { type: mongoose.Schema.Types.Mixed, default: [] },
      shoppingList: { type: mongoose.Schema.Types.Mixed, default: null },
      cookingSchedule: { type: mongoose.Schema.Types.Mixed, default: null },
      createdRecipes: { type: mongoose.Schema.Types.Mixed, default: [] },
      recipeCatalog: { type: mongoose.Schema.Types.Mixed, default: [] },
      validation: { type: mongoose.Schema.Types.Mixed, default: null },
      toolTrace: { type: mongoose.Schema.Types.Mixed, default: [] }
    },
    summary: {
      whyThisPlan: { type: String, default: '' },
      unmetConstraints: { type: [String], default: [] },
      notes: { type: [String], default: [] }
    },
    errorMessage: {
      type: String,
      default: ''
    },
    approvedAt: {
      type: Date,
      default: null
    },
    appliedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

AgentRunSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.AgentRun || mongoose.model('AgentRun', AgentRunSchema);
