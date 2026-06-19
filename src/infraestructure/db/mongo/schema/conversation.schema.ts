import { Schema } from 'mongoose';
import { EConversationType } from '../../../../domain/agent/entity/enums/EConversationType';
import { IMConversation } from '../interfaces/conversation.interface';

export const ConversationSchema = new Schema<IMConversation>(
  {
    id: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'Nova conversa' },
    type: {
      type: String,
      enum: Object.values(EConversationType),
      required: true,
      default: EConversationType.GENERAL,
    },
    lastMessageAt: { type: Date, required: true },
  },
  { timestamps: true },
);

ConversationSchema.index({ userId: 1, lastMessageAt: -1 });
ConversationSchema.index({ userId: 1, type: 1 });
