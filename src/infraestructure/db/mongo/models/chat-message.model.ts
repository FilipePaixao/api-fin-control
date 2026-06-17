import { model } from 'mongoose';
import { IMChatMessage } from '../interfaces/chat-message.interface';
import { ChatMessageSchema } from '../schema/chat-message.schema';

export const ChatMessageModel = model<IMChatMessage>('ChatMessage', ChatMessageSchema);
