import { ILlmToolDefinition } from '../../agent/interfaces/llm-provider.interface';

export const EXTRACT_TRANSACTIONS_TOOL: ILlmToolDefinition = {
  name: 'extract_transactions',
  description:
    'Extrai lançamentos financeiros do texto do PDF. Chame uma vez por pedaço de texto com todas as linhas encontradas.',
  parameters: {
    type: 'object',
    required: ['transactions'],
    properties: {
      transactions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['kind', 'name', 'amount', 'date', 'category'],
          properties: {
            kind: { type: 'string', enum: ['EXPENSE', 'INCOME'] },
            name: { type: 'string' },
            amount: { type: 'number' },
            date: { type: 'string', description: 'AAAA-MM-DD' },
            category: { type: 'string' },
            paymentMethod: {
              type: 'string',
              enum: [
                'CREDIT_CARD',
                'DEBIT_CARD',
                'PIX',
                'CASH',
                'BANK_SLIP',
                'BANK_TRANSFER',
                'OTHER',
              ],
            },
            confidence: { type: 'number' },
            suggestedSkip: { type: 'boolean' },
          },
        },
      },
    },
  },
};
