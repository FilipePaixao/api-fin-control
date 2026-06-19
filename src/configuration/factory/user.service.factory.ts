import { UserService } from '../../domain/user/service/user.service';
import { UserRepositoryRead } from '../../infraestructure/repository/user/user.repository.read';
import { UserRepositoryWrite } from '../../infraestructure/repository/user/user.repository.write';
import { ConversationServiceFactory } from './conversation.service.factory';

export class UserServiceFactory {
  static create() {
    const repoRead = new UserRepositoryRead();
    const repoWrite = new UserRepositoryWrite();

    return new UserService({
      userRepositoryRead: repoRead,
      userRepositoryWrite: repoWrite,
      conversationService: ConversationServiceFactory.create(),
    });
  }
}
