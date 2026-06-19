import { ILlmToolDefinition } from '../interfaces/llm-provider.interface';
import { DEFAULT_REFERENCE_TIMEZONE } from '../../common/utils/reference-month';

export const AGENT_TOOLS: ILlmToolDefinition[] = [
  {
    name: 'get_financial_summary',
    description:
      'Obtém resumo financeiro do usuário: renda, despesas totais, saldo, comprometimento e totais por status. Se o usuário não citar mês, omita referenceMonth — o servidor usa o mês atual.',
    parameters: {
      type: 'object',
      properties: {
        referenceMonth: {
          type: 'string',
          description:
            'Mês de referência no formato AAAA-MM (opcional; se omitido ou inválido, o servidor usa o mês atual em ' +
            `${DEFAULT_REFERENCE_TIMEZONE})`,
        },
      },
    },
  },
  {
    name: 'list_expenses',
    description:
      'Lista despesas do usuário com filtros opcionais. Se o usuário não citar mês, omita referenceMonth — o servidor usa o mês atual.',
    parameters: {
      type: 'object',
      properties: {
        referenceMonth: {
          type: 'string',
          description:
            'Filtro AAAA-MM (opcional; se omitido ou inválido, o servidor usa o mês atual em ' +
            `${DEFAULT_REFERENCE_TIMEZONE})`,
        },
        category: {
          type: 'string',
          enum: [
            'HOUSING',
            'FOOD',
            'TRANSPORT',
            'HEALTH',
            'EDUCATION',
            'ENTERTAINMENT',
            'SUBSCRIPTIONS',
            'DEBT',
            'INVESTMENT',
            'OTHER',
          ],
        },
        status: {
          type: 'string',
          enum: ['PENDING', 'PAID', 'OVERDUE'],
        },
      },
    },
  },
  {
    name: 'get_regional_cost_profile',
    description:
      'Obtém benchmark de aluguel e custo de vida da região do usuário com base no CEP cadastrado. ' +
      'Inclui comparação com despesas HOUSING do mês atual, se existirem. ' +
      'Use para perguntas sobre aluguel médio, custo de vida regional ou se o usuário paga caro/barato.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'propose_create_expense',
    description:
      'Propõe cadastro de uma nova despesa. NÃO persiste — aguarda confirmação do usuário na interface. ' +
      'Use quando tiver name, amount e category — proponha direto, sem pedir confirmação no chat. ' +
      'Se o usuário não citar mês, omita referenceMonth — o servidor usa o mês atual.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome da despesa' },
        amount: { type: 'number', description: 'Valor em reais' },
        category: {
          type: 'string',
          enum: [
            'HOUSING',
            'FOOD',
            'TRANSPORT',
            'HEALTH',
            'EDUCATION',
            'ENTERTAINMENT',
            'SUBSCRIPTIONS',
            'DEBT',
            'INVESTMENT',
            'OTHER',
          ],
        },
        referenceMonth: {
          type: 'string',
          description:
            'Mês de referência AAAA-MM (opcional; se omitido ou inválido, o servidor usa o mês atual em ' +
            `${DEFAULT_REFERENCE_TIMEZONE})`,
        },
        description: { type: 'string' },
        status: { type: 'string', enum: ['PENDING', 'PAID', 'OVERDUE'] },
        dueDate: { type: 'string', description: 'Data ISO ou AAAA-MM-DD' },
      },
      required: ['name', 'amount', 'category'],
    },
  },
  {
    name: 'propose_update_salary',
    description:
      'Propõe atualização da renda mensal. NÃO persiste — aguarda confirmação. Use quando tiver amount.',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Valor mensal em reais' },
        paymentDay: { type: 'number', description: 'Dia do pagamento 1-31' },
        source: { type: 'string', description: 'Fonte da renda' },
      },
      required: ['amount'],
    },
  },
];
