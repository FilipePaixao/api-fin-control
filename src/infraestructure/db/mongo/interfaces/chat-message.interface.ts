import { Types } from 'mongoose';
import { IChatMessage } from '../../../../domain/agent/entity/interfaces/chat-message.interface';

export interface IMChatMessage extends IChatMessage {
  _id: Types.ObjectId;
}
