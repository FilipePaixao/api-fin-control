import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { ECurrency } from '../../../../domain/user/entity/enums/ECurrency';
import { buildUserProfileContext } from '../../../../domain/user/utils/user-profile-context.utils';

describe('When building user profile context for the agent', () => {
  it('Should include profile summary without full address details', () => {
    const context = buildUserProfileContext({
      id: 'user-1',
      name: 'Filipe',
      email: 'filipe@email.com',
      age: 25,
      createdAt: new Date(),
      profile: {
        occupationArea: 'Tecnologia',
        investmentProfile: EInvestmentProfile.MODERATE,
        livingSituation: ELivingSituation.WITH_PARENTS,
        address: {
          zipCode: '01310100',
          street: 'Av Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '1578',
        },
      },
    });

    expect(context).toContain('Nome: Filipe');
    expect(context).toContain('Área de atuação: Tecnologia');
    expect(context).toContain('Perfil de investimento: Moderado');
    expect(context).toContain('Moradia: Mora com os pais');
    expect(context).toContain('Bairro: Bela Vista');
    expect(context).toContain('Localização: São Paulo, SP');
    expect(context).not.toContain('01310100');
    expect(context).not.toContain('1578');
  });

  it('Should include salary without regional benchmark as user housing cost', () => {
    const context = buildUserProfileContext({
      id: 'user-1',
      name: 'Filipe',
      email: 'filipe@email.com',
      age: 25,
      salary: {
        amount: 5000,
        currency: ECurrency.BRL,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      profile: {
        occupationArea: 'Tecnologia',
        investmentProfile: EInvestmentProfile.MODERATE,
        livingSituation: ELivingSituation.ALONE,
        address: {
          zipCode: '01310100',
          street: 'Av Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          number: '1578',
        },
      },
    });

    expect(context).toContain('Renda mensal: R$ 5000.00');
    expect(context).toContain('ferramentas de leitura');
    expect(context).not.toContain('Comprometimento');
    expect(context).not.toContain('63.63%');
    expect(context).not.toContain('3181');
  });
});
