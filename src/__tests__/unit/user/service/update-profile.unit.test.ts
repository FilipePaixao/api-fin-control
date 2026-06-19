import { UserService } from '../../../../domain/user/service/user.service';
import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { EUserVerificationStatus } from '../../../../domain/user/entity/enums/EUserVerificationStatus';
import {
  createUserRepositoryReadMock,
  createUserRepositoryWriteMock,
} from '../../helpers/service-mocks.helper';

describe('When updating profile in UserService with repository mocks', () => {
  it('Should forward merged profile and advance verification status', async () => {
    const existingUser = {
      id: 'user-1',
      name: 'User',
      email: 'user@email.com',
      createdAt: new Date(),
      profile: {
        verificationStatus: EUserVerificationStatus.PENDING_OCCUPATION,
        address: {
          zipCode: '01310100',
          street: 'Av Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '100',
        },
      },
    };

    const userRepositoryWrite = createUserRepositoryWriteMock({
      updateUserById: jest.fn().mockImplementation((_id, data) =>
        Promise.resolve({
          ...existingUser,
          ...data,
        }),
      ),
    });

    const userService = new UserService({
      userRepositoryRead: createUserRepositoryReadMock({
        findUserById: jest.fn().mockResolvedValue(existingUser),
      }),
      userRepositoryWrite,
    });

    const profile = await userService.updateProfile('user-1', {
      occupationArea: 'Tecnologia',
    });

    expect(userRepositoryWrite.updateUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        profile: expect.objectContaining({
          occupationArea: 'Tecnologia',
          verificationStatus: EUserVerificationStatus.PENDING_INVESTMENT_PROFILE,
        }),
      }),
    );
    expect(profile?.occupationArea).toBe('Tecnologia');
    expect(profile?.verificationStatus).toBe(
      EUserVerificationStatus.PENDING_INVESTMENT_PROFILE,
    );
  });
});
