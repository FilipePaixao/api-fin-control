import { model } from 'mongoose';
import { IMConversation } from '../interfaces/conversation.interface';
import { ConversationSchema } from '../schema/conversation.schema';

export const ConversationModel = model<IMConversation>('Conversation', ConversationSchema);
