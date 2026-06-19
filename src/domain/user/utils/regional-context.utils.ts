import { IRegionalCostProfile } from '../../regional-economics/entity/interfaces/regional-cost-profile.interface';

export function buildRegionalContext(
  regionalProfile: IRegionalCostProfile | null | undefined,
): string {
  if (!regionalProfile) {
    return '';
  }

  const lines = [
    '## Contexto regional (servidor)',
    '> **Benchmark regional** — média da região, NÃO é o aluguel nem a despesa de moradia deste usuário.',
    '> Para o valor real que o usuário paga, consulte `get_financial_summary` ou `list_expenses` (categoria HOUSING).',
    '> Para comparar despesa real vs. benchmark, use `get_regional_cost_profile`.',
    `- Localização: ${regionalProfile.neighborhood ? `${regionalProfile.neighborhood}, ` : ''}${regionalProfile.city}, ${regionalProfile.state}`,
    `- Fonte: ${regionalProfile.dataSource} | Período: ${regionalProfile.referencePeriod}`,
    `- Aluguel médio: R$ ${regionalProfile.rentPerM2.average.toFixed(2)}/m²`,
    `- Estimativa studio (35m²): R$ ${regionalProfile.estimatedRent.studio.toFixed(2)}/mês`,
    `- Estimativa 1 quarto (50m²): R$ ${regionalProfile.estimatedRent.oneBedroom.toFixed(2)}/mês`,
    `- Estimativa 2 quartos (70m²): R$ ${regionalProfile.estimatedRent.twoBedroom.toFixed(2)}/mês`,
    `- Ajuste por situação de moradia (fator ${regionalProfile.housingSituationFactor}):`,
    `  - 1 quarto ajustado: R$ ${regionalProfile.adjustedEstimatedRent.oneBedroom.toFixed(2)}/mês`,
    `- Índice de custo de vida: ${regionalProfile.costOfLivingIndex} (100 = média nacional)`,
    `- Multiplicadores: moradia ${regionalProfile.costBreakdown.housing}x, alimentação ${regionalProfile.costBreakdown.food}x, transporte ${regionalProfile.costBreakdown.transport}x`,
    `- Confiança: ${regionalProfile.confidence} (${regionalProfile.fallbackLevel})`,
    '- Use `get_regional_cost_profile` para comparar com despesas HOUSING reais do usuário.',
  ];

  return lines.join('\n');
}
