import { IProposedAction } from '../../interfaces/agent.service.interface';
import { EChatMessageRole } from '../enums/EChatMessageRole';

export interface IChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: EChatMessageRole;
  content: string;
  proposedActions?: IProposedAction[];
  indexedForTraining?: boolean;
  createdAt: Date;
}

export interface IAppendChatMessageInput {
  conversationId: string;
  userId: string;
  role: EChatMessageRole;
  content: string;
  proposedActions?: IProposedAction[];
  indexedForTraining?: boolean;
}
