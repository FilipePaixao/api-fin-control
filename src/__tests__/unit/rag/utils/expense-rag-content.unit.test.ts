import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import { EPaymentMethod } from '../../../../domain/expense/entity/enums/EPaymentMethod';
import { EExpenseStatus } from '../../../../domain/expense/entity/enums/EExpenseStatus';
import { buildExpenseRagContent } from '../../../../domain/rag/utils/expense-rag-content.utils';

describe('When building expense RAG content', () => {
  it('Should format searchable text in pt-BR with optional fields', () => {
    const content = buildExpenseRagContent({
      id: 'expense-1',
      userId: 'user-1',
      name: 'Netflix',
      description: 'Plano premium',
      amount: 55.9,
      category: EExpenseCategory.SUBSCRIPTIONS,
      paymentMethod: EPaymentMethod.CREDIT_CARD,
      status: EExpenseStatus.PENDING,
      dueDate: new Date('2026-06-15T12:00:00.000Z'),
      referenceMonth: '2026-06',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(content).toContain('Despesa: Netflix');
    expect(content).toContain('Descrição: Plano premium');
    expect(content).toContain('Categoria: Assinaturas');
    expect(content).toContain('Status: Pendente');
    expect(content).toContain('Mês de referência: 2026-06');
    expect(content).toContain('Vencimento: 2026-06-15');
    expect(content).toContain('Forma de pagamento: Cartão de crédito');
  });
});
