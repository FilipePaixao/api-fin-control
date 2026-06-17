import { ConversationService } from '../../domain/agent/service/conversation.service';
import { ConversationRepositoryRead } from '../../infraestructure/repository/agent/conversation.repository.read';
import { ConversationRepositoryWrite } from '../../infraestructure/repository/agent/conversation.repository.write';
import { ChatMessageRepositoryRead } from '../../infraestructure/repository/agent/chat-message.repository.read';
import { ChatMessageRepositoryWrite } from '../../infraestructure/repository/agent/chat-message.repository.write';

export class ConversationServiceFactory {
  static create(): ConversationService {
    return new ConversationService({
      conversationRepositoryRead: new ConversationRepositoryRead(),
      conversationRepositoryWrite: new ConversationRepositoryWrite(),
      chatMessageRepositoryRead: new ChatMessageRepositoryRead(),
      chatMessageRepositoryWrite: new ChatMessageRepositoryWrite(),
    });
  }
}
