import { EInvestmentProfile } from '../../../../domain/user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../../../domain/user/entity/enums/ELivingSituation';
import { ERegionalConfidence } from '../../../../domain/regional-economics/entity/enums/ERegionalConfidence';
import { ERegionalDataSource } from '../../../../domain/regional-economics/entity/enums/ERegionalDataSource';
import { ERegionalFallbackLevel } from '../../../../domain/regional-economics/entity/enums/ERegionalFallbackLevel';
import { buildPersonalizationContext } from '../../../../domain/user/utils/user-personalization-context.utils';

describe('When building personalization context for the agent', () => {
  it('Should include investment and occupation guidelines', () => {
    const context = buildPersonalizationContext(
      {
        id: 'user-1',
        name: 'Filipe',
        email: 'filipe@email.com',
        createdAt: new Date(),
        profile: {
          occupationArea: 'Tecnologia',
          investmentProfile: EInvestmentProfile.CONSERVATIVE,
          livingSituation: ELivingSituation.ALONE,
        },
      },
      {
        zipCode: '01310100',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        dataSource: ERegionalDataSource.FIPE_ZAP,
        referencePeriod: '2026-03',
        rentPerM2: { average: 63.63 },
        estimatedRent: { studio: 2227, oneBedroom: 3181, twoBedroom: 4454 },
        costOfLivingIndex: 142,
        costBreakdown: { housing: 1.42, food: 1.18, transport: 1.25 },
        confidence: ERegionalConfidence.MEDIUM,
        fallbackLevel: ERegionalFallbackLevel.CITY,
        housingSituationFactor: 1,
        adjustedEstimatedRent: { studio: 2227, oneBedroom: 3181, twoBedroom: 4454 },
      },
    );

    expect(context).toContain('Diretrizes de personalização');
    expect(context).toContain('renda fixa de baixo risco');
    expect(context).toContain('Setor de tecnologia');
    expect(context).toContain('Benchmark regional');
    expect(context).toContain('apenas referência de mercado');
  });
});
