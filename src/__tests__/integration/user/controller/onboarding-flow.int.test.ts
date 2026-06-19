import supertest from 'supertest';
import { app } from '../../../../../jest/setup-integration-tests';
import { EDocumentType } from '../../../../domain/user/entity/enums/EDocumentType';
import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { EUserVerificationStatus } from '../../../../domain/user/entity/enums/EUserVerificationStatus';
import { EAgentActionType } from '../../../../domain/agent/entity/enums/EAgentActionType';
import { EErrorCode } from '../../../../domain/common/errors/enums/EErrorCode';

const buildRegisterPayload = () => ({
  name: 'Onboarding User',
  email: `onboarding.user.${Date.now()}@email.com`,
  password: 'StrongPassword123',
  document: {
    type: EDocumentType.CPF,
    value: String(Date.now()).slice(-11).padStart(11, '0'),
  },
  age: 28,
});

describe('when completing profile onboarding flow', () => {
  it('should expose onboarding status and block financial agent until completion', async () => {
    const registerPayload = buildRegisterPayload();
    const registerResponse = await supertest(app.app)
      .post('/api/auth/register')
      .send(registerPayload);

    expect(registerResponse.statusCode).toBe(201);
    const accessToken = registerResponse.body.accessToken;

    const onboardingStatus = await supertest(app.app)
      .get('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(onboardingStatus.statusCode).toBe(200);
    expect(onboardingStatus.body.completed).toBe(false);
    expect(onboardingStatus.body.verificationStatus).toBe(
      EUserVerificationStatus.PENDING_ADDRESS,
    );
    expect(onboardingStatus.body.currentField).toBe('address');
    expect(onboardingStatus.body.missingFields).toEqual(
      expect.arrayContaining([
        'address',
        'occupationArea',
        'investmentProfile',
        'livingSituation',
      ]),
    );
    expect(onboardingStatus.body.onboardingConversationId).toEqual(expect.any(String));

    const blockedAgentChat = await supertest(app.app)
      .post('/api/agent/chat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ message: 'Qual meu saldo?' });

    expect(blockedAgentChat.statusCode).toBe(403);

    const addressResponse = await supertest(app.app)
      .put('/api/users/me/profile/address')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        zipCode: '01310100',
        street: 'Avenida Paulista',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        number: '100',
      });

    expect(addressResponse.statusCode).toBe(200);

    const afterAddressStatus = await supertest(app.app)
      .get('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(afterAddressStatus.body.verificationStatus).toBe(
      EUserVerificationStatus.PENDING_OCCUPATION,
    );
    expect(afterAddressStatus.body.currentField).toBe('occupationArea');

    const blockedBulkUpdate = await supertest(app.app)
      .post('/api/agent/onboarding/actions/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: EAgentActionType.UPDATE_PROFILE,
        payload: {
          occupationArea: 'Tecnologia',
          investmentProfile: EInvestmentProfile.MODERATE,
        },
      });

    expect(blockedBulkUpdate.statusCode).toBe(400);

    const updateOccupationAction = await supertest(app.app)
      .post('/api/agent/onboarding/actions/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: EAgentActionType.UPDATE_PROFILE,
        payload: {
          occupationArea: 'Tecnologia',
        },
      });

    expect(updateOccupationAction.statusCode).toBe(200);

    const updateInvestmentAction = await supertest(app.app)
      .post('/api/agent/onboarding/actions/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: EAgentActionType.UPDATE_PROFILE,
        payload: {
          investmentProfile: EInvestmentProfile.MODERATE,
        },
      });

    expect(updateInvestmentAction.statusCode).toBe(200);

    const updateLivingSituationAction = await supertest(app.app)
      .post('/api/agent/onboarding/actions/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: EAgentActionType.UPDATE_PROFILE,
        payload: {
          livingSituation: ELivingSituation.WITH_PARENTS,
        },
      });

    expect(updateLivingSituationAction.statusCode).toBe(200);

    const profileStatus = await supertest(app.app)
      .get('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(profileStatus.body.verificationStatus).toBe(
      EUserVerificationStatus.READY_TO_COMPLETE,
    );
    expect(profileStatus.body.missingFields).toEqual([]);

    const blockedEarlyCompletion = await supertest(app.app)
      .post('/api/agent/onboarding/actions/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: EAgentActionType.UPDATE_PROFILE,
        payload: {
          occupationArea: 'Outra área',
        },
      });

    expect(blockedEarlyCompletion.statusCode).toBe(400);
    expect(blockedEarlyCompletion.body.code).toBe(EErrorCode.ONBOARDING_INVALID_STATE);

    const completeOnboardingAction = await supertest(app.app)
      .post('/api/agent/onboarding/actions/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: EAgentActionType.COMPLETE_ONBOARDING,
        payload: {},
      });

    expect(completeOnboardingAction.statusCode).toBe(200);
    expect(completeOnboardingAction.body.data.completed).toBe(true);
    expect(completeOnboardingAction.body.data.verificationStatus).toBe(
      EUserVerificationStatus.COMPLETED,
    );

    const finalStatus = await supertest(app.app)
      .get('/api/users/me/onboarding')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(finalStatus.body.completed).toBe(true);
    expect(finalStatus.body.verificationStatus).toBe(EUserVerificationStatus.COMPLETED);
    expect(finalStatus.body.missingFields).toEqual([]);
  });
});
