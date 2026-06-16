import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { UserService } from '../../../../domain/user/service/user.service';
import { validUserMock } from '../../../__mocks__/user.mock';

describe('when updating user salary in UserService', () => {
  it('should update salary with BRL currency', async () => {
    const user = validUserMock();
    const userRepositoryRead = {
      findUserById: jest.fn().mockResolvedValue(user),
    };
    const userRepositoryWrite = {
      updateUserById: jest.fn().mockResolvedValue({
        ...user,
        salary: {
          amount: 5500,
          currency: ECurrency.BRL,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    };

    const service = new UserService({
      userRepositoryRead: userRepositoryRead as any,
      userRepositoryWrite: userRepositoryWrite as any,
    });

    const salary = await service.updateSalary(user.id, {
      amount: 5500,
      currency: ECurrency.BRL,
    });

    expect(salary.amount).toBe(5500);
    expect(salary.currency).toBe(ECurrency.BRL);
    expect(userRepositoryWrite.updateUserById).toHaveBeenCalledTimes(1);
  });

  it('should throw field invalid when currency is not BRL', async () => {
    const user = validUserMock();
    const userRepositoryRead = {
      findUserById: jest.fn().mockResolvedValue(user),
    };
    const userRepositoryWrite = {
      updateUserById: jest.fn(),
    };

    const service = new UserService({
      userRepositoryRead: userRepositoryRead as any,
      userRepositoryWrite: userRepositoryWrite as any,
    });

    await expect(
      service.updateSalary(user.id, {
        amount: 5500,
        currency: 'USD' as ECurrency,
      }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
  });
});
