import { UserRepositoryRead } from '../../../../../infraestructure/repository/user/user.repository.read';
import { UserRepositoryWrite } from '../../../../../infraestructure/repository/user/user.repository.write';
import { EDocumentType } from '../../../../../domain/user/entity/enums/EDocumentType';
import { validUserMock } from '../../../../__mocks__/user.mock';

describe('when finding user by document', () => {
  const userRepositoryRead = new UserRepositoryRead();
  const userRepositoryWrite = new UserRepositoryWrite();

  it('should find user by document value', async () => {
    const user = validUserMock({
      document: { type: EDocumentType.CPF, value: '98765432100' },
      passwordHash: 'hashed-password',
    });

    await userRepositoryWrite.createUser(user);
    const foundUser = await userRepositoryRead.findUserByDocument('98765432100');

    expect(foundUser).toMatchObject({
      email: user.email,
      document: { type: EDocumentType.CPF, value: '98765432100' },
    });
  });
});
