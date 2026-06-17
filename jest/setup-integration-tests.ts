import { bootstrapTest } from '../src/__tests__/testUtils';
import { Server } from '../src/domain/server/server';
import { ChatMessageModel } from '../src/infraestructure/db/mongo/models/chat-message.model';
import { ConversationModel } from '../src/infraestructure/db/mongo/models/conversation.model';
import { UserModel } from '../src/infraestructure/db/mongo/models/user.model';
import { MongooseDatabase } from './setup-db';

let dbInstance: MongooseDatabase;
export let app: Server;

beforeAll(async () => {
  const bootstrap = await bootstrapTest();
  dbInstance = bootstrap.dbInstance;
  app = bootstrap.app;
});

afterAll(async () => {
  await ChatMessageModel.deleteMany({});
  await ConversationModel.deleteMany({});
  await UserModel.deleteMany({});
  await dbInstance?.close();
});
