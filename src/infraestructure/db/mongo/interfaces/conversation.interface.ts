import { Types } from 'mongoose';
import { IConversation } from '../../../../domain/agent/entity/interfaces/conversation.interface';

export interface IMConversation extends IConversation {
  _id: Types.ObjectId;
}
