import mongoose from 'mongoose';

if (process.env.NODE_ENV === 'development') {
  delete mongoose.connection.models.AgentMessage;
}

const AgentMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    runId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentRun',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['system', 'user', 'assistant', 'tool'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

AgentMessageSchema.index({ runId: 1, createdAt: 1 });

export default mongoose.models.AgentMessage || mongoose.model('AgentMessage', AgentMessageSchema);
