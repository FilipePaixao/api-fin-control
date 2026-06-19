import { EInvestmentProfile } from '../entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../entity/enums/ELivingSituation';
import { IUser } from '../entity/interfaces/user.interface';
import { IRegionalCostProfile } from '../../regional-economics/entity/interfaces/regional-cost-profile.interface';

const INVESTMENT_GUIDELINES: Record<EInvestmentProfile, string[]> = {
  [EInvestmentProfile.CONSERVATIVE]: [
    'Priorize reserva de emergência (3–6 meses de despesas) antes de investir.',
    'Sugira renda fixa de baixo risco (Tesouro Selic, CDB com liquidez diária).',
    'Evite alavancagem e produtos de alta volatilidade.',
    'Tom cauteloso e foco em preservação de capital.',
  ],
  [EInvestmentProfile.MODERATE]: [
    'Equilibre reserva de emergência com investimentos de médio prazo.',
    'Sugira carteira balanceada: renda fixa + multimercado + parcela moderada em renda variável.',
    'Mencione diversificação e horizonte de 3–5 anos para metas intermediárias.',
    'Tom equilibrado entre segurança e crescimento.',
  ],
  [EInvestmentProfile.AGGRESSIVE]: [
    'Mantenha reserva mínima de emergência, mas priorize crescimento patrimonial.',
    'Sugira maior exposição a renda variável, FIIs e ETFs com horizonte longo.',
    'Alerte sobre volatilidade sem desencorajar — o usuário tolera risco.',
    'Tom orientado a oportunidades de longo prazo.',
  ],
};

const LIVING_SITUATION_GUIDELINES: Record<ELivingSituation, string> = {
  [ELivingSituation.WITH_PARENTS]:
    'Moradia compartilhada com família — foque em independência financeira e metas de saída de casa.',
  [ELivingSituation.WITH_PARTNER]:
    'Moradia compartilhada — considere divisão de custos e planejamento conjunto.',
  [ELivingSituation.WITH_ROOMMATES]:
    'Divide moradia — aluguel estimado considera parcela individual (~40% do benchmark).',
  [ELivingSituation.ALONE]:
    'Mora sozinho(a) — moradia é custo integral; priorize controle de gastos fixos.',
  [ELivingSituation.OTHER]:
    'Situação de moradia variada — pergunte detalhes antes de assumir custos.',
};

const OCCUPATION_KEYWORDS: Array<{ keywords: string[]; guideline: string }> = [
  {
    keywords: ['tecnologia', 'ti', 'software', 'dev', 'programação', 'engenharia'],
    guideline:
      'Setor de tecnologia — renda pode ser variável (PJ/freelance); sugira reserva extra e benefícios como VR/plano de saúde.',
  },
  {
    keywords: ['saúde', 'medicina', 'enfermagem', 'hospital'],
    guideline:
      'Setor de saúde — renda geralmente estável; destaque previdência privada e seguros.',
  },
  {
    keywords: ['comércio', 'vendas', 'varejo', 'loja'],
    guideline:
      'Setor comercial — renda pode ter comissões; sugira orçamento flexível e metas por período.',
  },
  {
    keywords: ['educação', 'professor', 'ensino'],
    guideline:
      'Setor educacional — renda moderada; foque em disciplina de gastos e metas de longo prazo.',
  },
  {
    keywords: ['servidor', 'público', 'funcionário'],
    guideline:
      'Setor público — renda estável; sugira planejamento previdenciário e aproveitamento de benefícios.',
  },
];

function resolveOccupationGuideline(occupationArea?: string): string | null {
  if (!occupationArea) {
    return null;
  }

  const normalized = occupationArea.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const match = OCCUPATION_KEYWORDS.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return match?.guideline ?? null;
}

export function buildPersonalizationContext(
  user: IUser,
  regionalProfile?: IRegionalCostProfile | null,
): string {
  const profile = user.profile;
  if (!profile) {
    return '';
  }

  const lines = [
    '## Diretrizes de personalização (servidor)',
    '> Regras determinísticas baseadas no perfil do usuário. Adapte tom e recomendações conforme abaixo.',
  ];

  if (profile.investmentProfile) {
    lines.push('', `### Perfil de investimento: ${profile.investmentProfile}`);
    INVESTMENT_GUIDELINES[profile.investmentProfile].forEach((guideline) => {
      lines.push(`- ${guideline}`);
    });
  }

  if (profile.livingSituation) {
    lines.push('', `### Situação de moradia`);
    lines.push(`- ${LIVING_SITUATION_GUIDELINES[profile.livingSituation]}`);
  }

  const occupationGuideline = resolveOccupationGuideline(profile.occupationArea);
  if (occupationGuideline) {
    lines.push('', `### Área de atuação`);
    lines.push(`- ${occupationGuideline}`);
  }

  if (regionalProfile) {
    lines.push('', '### Benchmark regional (não confundir com aluguel do usuário)');
    lines.push(
      `- Média regional (1 quarto, ${regionalProfile.city}): R$ ${regionalProfile.adjustedEstimatedRent.oneBedroom.toFixed(2)}/mês — apenas referência de mercado`,
    );
    lines.push(
      `- Índice de custo de vida: ${regionalProfile.costOfLivingIndex} (100 = média nacional)`,
    );
    lines.push(
      `- Confiança dos dados: ${regionalProfile.confidence} (nível: ${regionalProfile.fallbackLevel})`,
    );
    if (regionalProfile.confidence === 'LOW') {
      lines.push(
        '- Dados regionais com baixa precisão — mencione incerteza ao comparar com despesas do usuário.',
      );
    }
  }

  if (lines.length <= 2) {
    return '';
  }

  return lines.join('\n');
}
