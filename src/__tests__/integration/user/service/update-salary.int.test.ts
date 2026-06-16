import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { UserModel } from '../../../../infraestructure/db/mongo/models/user.model';
import { ErrorCatalog } from '../../../../infraestructure/i18n/error-catalog';
import { validUserMock } from '../../../__mocks__/user.mock';

const userService = UserServiceFactory.create();

describe('When updating salary with valid BRL payload', () => {
  it('Should persist and return updated salary', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const salary = await userService.updateSalary(userData.id, {
      amount: 6500,
      currency: ECurrency.BRL,
      paymentDay: 10,
      source: 'Main job',
    });

    expect(salary).toMatchObject({
      amount: 6500,
      currency: ECurrency.BRL,
      paymentDay: 10,
      source: 'Main job',
    });
  });
});

describe('When updating salary with invalid amount', () => {
  it('Should reject with FIELD_INVALID', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    await expect(
      userService.updateSalary(userData.id, {
        amount: 0,
        currency: ECurrency.BRL,
      }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.FIELD_INVALID,
    });
    expect(ErrorCatalog[EErrorCode.FIELD_INVALID]).toBeDefined();
  });
});
