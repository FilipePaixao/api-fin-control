import { ERegionalConfidence } from '../../../../domain/regional-economics/entity/enums/ERegionalConfidence';
import { ERegionalDataSource } from '../../../../domain/regional-economics/entity/enums/ERegionalDataSource';
import { ERegionalFallbackLevel } from '../../../../domain/regional-economics/entity/enums/ERegionalFallbackLevel';
import { buildRegionalContext } from '../../../../domain/user/utils/regional-context.utils';

describe('When building regional context for the agent', () => {
  it('Should return empty string when regional profile is missing', () => {
    expect(buildRegionalContext(null)).toBe('');
    expect(buildRegionalContext(undefined)).toBe('');
  });

  it('Should include regional benchmarks and confidence level', () => {
    const context = buildRegionalContext({
      zipCode: '01310100',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      dataSource: ERegionalDataSource.FIPE_ZAP,
      referencePeriod: '2026-03',
      rentPerM2: { average: 63.63 },
      estimatedRent: { studio: 2227.05, oneBedroom: 3181.5, twoBedroom: 4454.1 },
      costOfLivingIndex: 142,
      costBreakdown: { housing: 1.42, food: 1.18, transport: 1.25 },
      confidence: ERegionalConfidence.MEDIUM,
      fallbackLevel: ERegionalFallbackLevel.CITY,
      housingSituationFactor: 1,
      adjustedEstimatedRent: { studio: 2227.05, oneBedroom: 3181.5, twoBedroom: 4454.1 },
    });

    expect(context).toContain('Benchmark regional');
    expect(context).toContain('NÃO é o aluguel');
    expect(context).toContain('Bela Vista, São Paulo, SP');
    expect(context).toContain('R$ 63.63/m²');
    expect(context).toContain('Índice de custo de vida: 142');
    expect(context).toContain('get_regional_cost_profile');
  });
});
