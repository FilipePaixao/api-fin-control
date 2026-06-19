import { EInvestmentProfile } from '../../user/entity/enums/EInvestmentProfile';
import { ELivingSituation } from '../../user/entity/enums/ELivingSituation';
import { IUser } from '../../user/entity/interfaces/user.interface';

const INVESTMENT_PROFILE_LABELS: Record<EInvestmentProfile, string> = {
  [EInvestmentProfile.CONSERVATIVE]: 'Conservador',
  [EInvestmentProfile.MODERATE]: 'Moderado',
  [EInvestmentProfile.AGGRESSIVE]: 'Agressivo',
};

const LIVING_SITUATION_LABELS: Record<ELivingSituation, string> = {
  [ELivingSituation.ALONE]: 'Mora sozinho(a)',
  [ELivingSituation.WITH_PARENTS]: 'Mora com os pais',
  [ELivingSituation.WITH_PARTNER]: 'Mora com cônjuge/parceiro(a)',
  [ELivingSituation.WITH_ROOMMATES]: 'Divide moradia com outras pessoas',
  [ELivingSituation.OTHER]: 'Outra situação de moradia',
};

export function buildUserProfileContext(user: IUser): string {
  const profile = user.profile;
  if (!profile) {
    return '';
  }

  const lines = [
    '## Perfil do usuário (servidor)',
    '> Apenas dados cadastrados pelo usuário. Para aluguel/despesas reais, use ferramentas de leitura — não assuma valores do benchmark regional.',
    `- Nome: ${user.name}`,
  ];

  if (user.age !== undefined) {
    lines.push(`- Idade: ${user.age}`);
  }
  if (profile.occupationArea) {
    lines.push(`- Área de atuação: ${profile.occupationArea}`);
  }
  if (profile.investmentProfile) {
    lines.push(
      `- Perfil de investimento: ${INVESTMENT_PROFILE_LABELS[profile.investmentProfile]}`,
    );
  }
  if (profile.livingSituation) {
    lines.push(`- Moradia: ${LIVING_SITUATION_LABELS[profile.livingSituation]}`);
  }
  if (profile.address?.neighborhood) {
    lines.push(`- Bairro: ${profile.address.neighborhood}`);
  }
  if (profile.address?.city && profile.address.state) {
    lines.push(`- Localização: ${profile.address.city}, ${profile.address.state}`);
  }
  if (user.salary?.amount) {
    lines.push(`- Renda mensal: R$ ${user.salary.amount.toFixed(2)}`);
  }

  if (lines.length === 1) {
    return '';
  }

  return lines.join('\n');
}
