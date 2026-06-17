import { Schema } from 'mongoose';
import { EChatMessageRole } from '../../../../domain/agent/entity/enums/EChatMessageRole';
import { IMChatMessage } from '../interfaces/chat-message.interface';

export const ChatMessageSchema = new Schema<IMChatMessage>(
  {
    id: { type: String, required: true, unique: true },
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: Object.values(EChatMessageRole),
      required: true,
    },
    content: { type: String, required: true },
    proposedActions: { type: Schema.Types.Mixed },
    indexedForTraining: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
ChatMessageSchema.index({ userId: 1, conversationId: 1 });
ChatMessageSchema.index({ indexedForTraining: 1, createdAt: 1 });
