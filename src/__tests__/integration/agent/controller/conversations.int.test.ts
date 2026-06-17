import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EChatMessageRole } from '../../../../domain/agent/entity/enums/EChatMessageRole';
import { ChatMessageModel } from '../../../../infraestructure/db/mongo/models/chat-message.model';
import { ConversationModel } from '../../../../infraestructure/db/mongo/models/conversation.model';
import { createAuthenticatedUser } from '../../helpers/auth.helper';

describe('When listing conversations with authenticated user', () => {
  it('Should return user conversations ordered by lastMessageAt', async () => {
    const { user, token } = await createAuthenticatedUser();
    const now = new Date();

    await ConversationModel.create({
      id: 'conv-list-1',
      userId: user.id,
      title: 'Primeira',
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const response = await supertest(app.app)
      .get('/api/agent/conversations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 'conv-list-1',
      userId: user.id,
      title: 'Primeira',
    });
  });
});

describe('When creating a conversation with authenticated user', () => {
  it('Should persist empty conversation', async () => {
    const { user, token } = await createAuthenticatedUser();

    const response = await supertest(app.app)
      .post('/api/agent/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Meu chat' });

    const persistedConversation = await ConversationModel.findOne({ id: response.body.id });

    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject({
      userId: user.id,
      title: 'Meu chat',
    });
    expect(persistedConversation).not.toBeNull();
  });
});

describe('When getting conversation with messages', () => {
  it('Should return conversation and message history', async () => {
    const { user, token } = await createAuthenticatedUser();
    const now = new Date();

    await ConversationModel.create({
      id: 'conv-detail-1',
      userId: user.id,
      title: 'Detalhe',
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ChatMessageModel.create({
      id: 'msg-1',
      conversationId: 'conv-detail-1',
      userId: user.id,
      role: EChatMessageRole.USER,
      content: 'Olá',
      createdAt: now,
    });

    const response = await supertest(app.app)
      .get('/api/agent/conversations/conv-detail-1')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.messages).toHaveLength(1);
    expect(response.body.messages[0].content).toBe('Olá');
  });
});

describe('When accessing another user conversation', () => {
  it('Should return 404', async () => {
    const owner = await createAuthenticatedUser();
    const other = await createAuthenticatedUser({ email: 'other@example.com' });
    const now = new Date();

    await ConversationModel.create({
      id: 'conv-private-1',
      userId: owner.user.id,
      title: 'Privada',
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const response = await supertest(app.app)
      .get('/api/agent/conversations/conv-private-1')
      .set('Authorization', `Bearer ${other.token}`);

    expect(response.statusCode).toBe(404);
  });
});

describe('When deleting a conversation', () => {
  it('Should remove conversation and messages', async () => {
    const { user, token } = await createAuthenticatedUser();
    const now = new Date();

    await ConversationModel.create({
      id: 'conv-delete-1',
      userId: user.id,
      title: 'Apagar',
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ChatMessageModel.create({
      id: 'msg-delete-1',
      conversationId: 'conv-delete-1',
      userId: user.id,
      role: EChatMessageRole.USER,
      content: 'Teste',
      createdAt: now,
    });

    const response = await supertest(app.app)
      .delete('/api/agent/conversations/conv-delete-1')
      .set('Authorization', `Bearer ${token}`);

    const persistedConversation = await ConversationModel.findOne({ id: 'conv-delete-1' });
    const persistedMessage = await ChatMessageModel.findOne({ id: 'msg-delete-1' });

    expect(response.statusCode).toBe(204);
    expect(persistedConversation).toBeNull();
    expect(persistedMessage).toBeNull();
  });
});
