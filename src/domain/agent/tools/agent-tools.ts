import { ILlmToolDefinition } from '../interfaces/llm-provider.interface';

export const AGENT_TOOLS: ILlmToolDefinition[] = [
  {
    name: 'get_financial_summary',
    description:
      'Obtém resumo financeiro do usuário: renda, despesas totais, saldo, comprometimento e totais por status.',
    parameters: {
      type: 'object',
      properties: {
        referenceMonth: {
          type: 'string',
          description: 'Mês de referência no formato AAAA-MM (opcional, padrão mês atual)',
        },
      },
    },
  },
  {
    name: 'list_expenses',
    description: 'Lista despesas do usuário com filtros opcionais.',
    parameters: {
      type: 'object',
      properties: {
        referenceMonth: { type: 'string', description: 'Filtro AAAA-MM' },
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
    name: 'propose_create_expense',
    description:
      'Propõe cadastro de uma nova despesa. NÃO persiste — aguarda confirmação do usuário. Use quando tiver name, amount, category e referenceMonth.',
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
        referenceMonth: { type: 'string', description: 'AAAA-MM' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['PENDING', 'PAID', 'OVERDUE'] },
        dueDate: { type: 'string', description: 'Data ISO ou AAAA-MM-DD' },
      },
      required: ['name', 'amount', 'category', 'referenceMonth'],
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
