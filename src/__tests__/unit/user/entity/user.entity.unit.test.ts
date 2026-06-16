import { Types } from 'mongoose';
import { EDocumentType } from '../../../domain/user/entity/enums/EDocumentType';
import { ECurrency } from '../../../domain/user/entity/enums/ECurrency';
import {
  RegisterUserServiceEntity,
  UserServiceEntity,
} from '../../../domain/user/entity/user.entity';

describe('when validating user entity', () => {
  const baseUser = {
    id: new Types.ObjectId().toHexString(),
    name: 'Filipe Paixão',
    email: 'filipe@email.com',
    createdAt: new Date(),
  };

  it('should create a valid user with required fields', () => {
    const user = new UserServiceEntity(baseUser);
    expect(user.name).toBe('Filipe Paixão');
    expect(user.email).toBe('filipe@email.com');
  });

  it('should reject invalid email', () => {
    expect(
      () => new UserServiceEntity({ ...baseUser, email: 'invalid' }),
    ).toThrow(/valid email/);
  });

  it('should validate CPF document', () => {
    expect(() =>
      UserServiceEntity.validateDocument({
        type: EDocumentType.CPF,
        value: '12345678901',
      }),
    ).not.toThrow();
  });

  it('should reject invalid CPF length', () => {
    expect(() =>
      UserServiceEntity.validateDocument({
        type: EDocumentType.CPF,
        value: '123',
      }),
    ).toThrow(/11 digits/);
  });

  it('should validate CNPJ document', () => {
    expect(() =>
      UserServiceEntity.validateDocument({
        type: EDocumentType.CNPJ,
        value: '12345678901234',
      }),
    ).not.toThrow();
  });

  it('should validate salary with ECurrency.BRL', () => {
    expect(() =>
      UserServiceEntity.validateSalary({
        amount: 5000,
        currency: ECurrency.BRL,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).not.toThrow();
  });

  it('should reject salary with non-positive amount', () => {
    expect(() =>
      UserServiceEntity.validateSalary({
        amount: 0,
        currency: ECurrency.BRL,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(/greater than zero/);
  });
});

describe('when validating register user entity', () => {
  it('should validate strong password and document', () => {
    const entity = new RegisterUserServiceEntity({
      name: 'Filipe Paixão',
      email: 'filipe@email.com',
      password: 'StrongPassword123',
      passwordHash: 'hashed',
      document: { type: EDocumentType.CPF, value: '12345678901' },
      age: 25,
    });
    expect(entity.email).toBe('filipe@email.com');
  });

  it('should reject weak password', () => {
    expect(() =>
      RegisterUserServiceEntity.validateRegisterInput({
        name: 'Filipe',
        email: 'filipe@email.com',
        password: 'weak',
        document: { type: EDocumentType.CPF, value: '12345678901' },
      }),
    ).toThrow(/Password must be at least 8 characters/);
  });
});
