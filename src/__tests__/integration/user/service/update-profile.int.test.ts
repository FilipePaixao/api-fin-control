import { UserServiceFactory } from '../../../../configuration/factory/user.service.factory';
import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { EDocumentType } from '../../../../domain/user/entity/enums/EDocumentType';
import { EUserVerificationStatus } from '../../../../domain/user/entity/enums/EUserVerificationStatus';
import { AuthServiceFactory } from '../../../../configuration/factory/auth.service.factory';
import { getOnboardingMissingFields } from '../../../../domain/user/utils/user-profile.utils';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';

const authService = AuthServiceFactory.create();
const userService = UserServiceFactory.create();

describe('When updating user profile fields in UserService', () => {
  it('Should persist profile fields step by step after address is saved', async () => {
    const registered = await authService.registerUser({
      name: 'Profile Persist User',
      email: `profile.persist.${Date.now()}@email.com`,
      password: 'StrongPassword123',
      document: { type: EDocumentType.CPF, value: `${Date.now()}`.slice(-11).padStart(11, '0') },
    });

    await userService.updateProfileAddress(registered.user.id, {
      zipCode: '01310100',
      street: 'Avenida Paulista',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      number: '100',
    });

    const userAfterAddress = await userService.getUserById(registered.user.id);
    expect(userAfterAddress.profile?.verificationStatus).toBe(
      EUserVerificationStatus.PENDING_OCCUPATION,
    );

    await userService.updateProfile(registered.user.id, {
      occupationArea: 'Tecnologia',
    });
    await userService.updateProfile(registered.user.id, {
      investmentProfile: EInvestmentProfile.MODERATE,
    });
    const updatedProfile = await userService.updateProfile(registered.user.id, {
      livingSituation: ELivingSituation.WITH_PARENTS,
    });

    expect(updatedProfile?.occupationArea).toBe('Tecnologia');
    expect(updatedProfile?.verificationStatus).toBe(
      EUserVerificationStatus.READY_TO_COMPLETE,
    );

    const user = await userService.getUserById(registered.user.id);

    expect(getOnboardingMissingFields(user.profile)).toEqual([]);
    expect(user.profile?.occupationArea).toBe('Tecnologia');
  });

  it('Should reject profile updates outside the current verification status', async () => {
    const registered = await authService.registerUser({
      name: 'Profile Guard User',
      email: `profile.guard.${Date.now()}@email.com`,
      password: 'StrongPassword123',
      document: { type: EDocumentType.CPF, value: `${Date.now()}1`.slice(-11).padStart(11, '0') },
    });

    await expect(
      userService.updateProfile(registered.user.id, {
        investmentProfile: EInvestmentProfile.MODERATE,
      }),
    ).rejects.toMatchObject({
      status: 400,
      errorCode: EErrorCode.ONBOARDING_INVALID_STATE,
    });
  });
});
