import { EConversationType } from '../enums/EConversationType';

export interface IConversation {
  id: string;
  userId: string;
  title: string;
  type: EConversationType;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date;
}

export interface ICreateConversationInput {
  title?: string;
  type?: EConversationType;
}
