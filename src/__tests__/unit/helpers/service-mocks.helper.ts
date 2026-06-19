import { IUserRepositoryRead } from '../../../domain/user/repository/user.repository.read';
import { IUserRepositoryWrite } from '../../../domain/user/repository/user.repository.write';
import { IExpenseRepositoryRead } from '../../../domain/expense/repository/expense.repository.read';
import { IExpenseRepositoryWrite } from '../../../domain/expense/repository/expense.repository.write';
import { IRefreshTokenRepositoryRead } from '../../../domain/auth/repository/refresh-token.repository.read';
import { IRefreshTokenRepositoryWrite } from '../../../domain/auth/repository/refresh-token.repository.write';
import { IPasswordHasher } from '../../../domain/auth/interfaces/password-hasher.interface';
import { IAuthTokenProvider } from '../../../domain/auth/interfaces/auth-token-provider.interface';
import { IEmbeddingProvider } from '../../../domain/rag/interfaces/embedding-provider.interface';
import { IVectorStoreRepository } from '../../../domain/rag/repository/vector-store.repository';

export function createUserRepositoryReadMock(
  override: Partial<IUserRepositoryRead> = {},
): IUserRepositoryRead {
  return {
    findUserByEmail: jest.fn(),
    findUserByEmailWithPasswordHash: jest.fn(),
    findUserById: jest.fn(),
    findUserByDocument: jest.fn(),
    listUsers: jest.fn(),
    ...override,
  };
}

export function createUserRepositoryWriteMock(
  override: Partial<IUserRepositoryWrite> = {},
): IUserRepositoryWrite {
  return {
    createUser: jest.fn(),
    updateUserById: jest.fn(),
    deleteUserById: jest.fn(),
    ...override,
  };
}

export function createExpenseRepositoryReadMock(
  override: Partial<IExpenseRepositoryRead> = {},
): IExpenseRepositoryRead {
  return {
    findExpenseById: jest.fn(),
    findExpensesByIds: jest.fn(),
    listExpenses: jest.fn(),
    ...override,
  };
}

export function createExpenseRepositoryWriteMock(
  override: Partial<IExpenseRepositoryWrite> = {},
): IExpenseRepositoryWrite {
  return {
    createExpense: jest.fn(),
    updateExpenseById: jest.fn(),
    deleteExpenseById: jest.fn(),
    ...override,
  };
}

export function createRefreshTokenRepositoryReadMock(
  override: Partial<IRefreshTokenRepositoryRead> = {},
): IRefreshTokenRepositoryRead {
  return {
    findByTokenHash: jest.fn(),
    ...override,
  };
}

export function createRefreshTokenRepositoryWriteMock(
  override: Partial<IRefreshTokenRepositoryWrite> = {},
): IRefreshTokenRepositoryWrite {
  return {
    createRefreshToken: jest.fn(),
    revokeById: jest.fn(),
    ...override,
  };
}

export function createPasswordHasherMock(
  override: Partial<IPasswordHasher> = {},
): IPasswordHasher {
  return {
    hash: jest.fn(),
    compare: jest.fn(),
    ...override,
  };
}

export function createAuthTokenProviderMock(
  override: Partial<IAuthTokenProvider> = {},
): IAuthTokenProvider {
  return {
    generateAccessToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    generateRefreshTokenValue: jest.fn(),
    getRefreshTokenExpiresAt: jest.fn(),
    ...override,
  };
}

export function createEmbeddingProviderMock(
  override: Partial<IEmbeddingProvider> = {},
): IEmbeddingProvider {
  return {
    embed: jest.fn(),
    ...override,
  };
}

export function createVectorStoreRepositoryMock(
  override: Partial<IVectorStoreRepository> = {},
): IVectorStoreRepository {
  return {
    upsert: jest.fn(),
    search: jest.fn(),
    deleteBySource: jest.fn(),
    ...override,
  };
}
