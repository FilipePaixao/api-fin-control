import { UserRepositoryWrite } from '../../../../../infraestructure/repository/user/user.repository.write';
import { UserModel } from '../../../../../infraestructure/db/mongo/models/user.model';
import { EUserVerificationStatus } from '../../../../../domain/user/entity/enums/EUserVerificationStatus';
import { validUserMock } from '../../../../__mocks__/user.mock';

const repositoryWrite = new UserRepositoryWrite();

describe('When we try to update a user by id', () => {
  it('should return the updated user', async () => {
    const userData = validUserMock();
    await UserModel.create(userData);

    const updated = await repositoryWrite.updateUserById(userData.id, {
      name: 'Updated Name',
    });

    expect(updated?.name).toBe('Updated Name');
    expect(updated?.email).toBe(userData.email);
  });

  it('should return null when the user does not exist', async () => {
    const updated = await repositoryWrite.updateUserById('nonexistent', {
      name: 'Updated',
    });
    expect(updated).toBeNull();
  });

  it('should replace profile while preserving existing nested fields when merged profile is sent', async () => {
    const userData = validUserMock({
      profile: {
        verificationStatus: EUserVerificationStatus.PENDING_ADDRESS,
      },
    });
    await UserModel.create(userData);

    const updated = await repositoryWrite.updateUserById(userData.id, {
      profile: {
        ...(userData.profile ?? {}),
        address: {
          zipCode: '01310100',
          street: 'Avenida Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '100',
        },
        verificationStatus: EUserVerificationStatus.PENDING_OCCUPATION,
      },
    });

    expect(updated?.profile?.address?.street).toBe('Avenida Paulista');
    expect(updated?.profile?.verificationStatus).toBe(
      EUserVerificationStatus.PENDING_OCCUPATION,
    );
  });
});
