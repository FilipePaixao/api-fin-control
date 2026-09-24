import { EExpenseCategory } from '../../../../domain/expense/entity/enums/EExpenseCategory';
import {
  buildExpenseSearchTerms,
  isFuelMerchant,
} from '../../../../domain/expense-search/utils/expense-search-enrichment.utils';

describe('When detecting fuel merchants', () => {
  it('Should match posto and gasolina names', () => {
    expect(isFuelMerchant('Auto Posto Pelanda')).toBe(true);
    expect(isFuelMerchant('Shell Centro')).toBe(true);
    expect(isFuelMerchant('Ipiranga BR 116')).toBe(true);
    expect(isFuelMerchant('Compra gasolina')).toBe(true);
  });

  it('Should not match unrelated transport merchants', () => {
    expect(isFuelMerchant('Uber Trip')).toBe(false);
    expect(isFuelMerchant('99 Pop')).toBe(false);
    expect(isFuelMerchant('Estacionamento Shopping')).toBe(false);
  });
});

describe('When building expense search terms', () => {
  it('Should include fuel terms for posto merchants', () => {
    const terms = buildExpenseSearchTerms({
      name: 'Auto Posto Pelanda',
      category: EExpenseCategory.TRANSPORT,
    });

    expect(terms).toContain('gasolina');
    expect(terms).toContain('combustivel');
    expect(terms).toContain('posto');
    expect(terms).toContain('transporte');
  });

  it('Should include transport aliases but not fuel terms for Uber', () => {
    const terms = buildExpenseSearchTerms({
      name: 'Uber Trip',
      category: EExpenseCategory.TRANSPORT,
    });

    expect(terms).toContain('transporte');
    expect(terms).toContain('uber');
    expect(terms).not.toContain('gasolina');
    expect(terms).not.toContain('combustivel');
  });

  it('Should detect fuel from description', () => {
    const terms = buildExpenseSearchTerms({
      name: 'Pagamento cartão',
      description: 'Abastecimento combustível',
      category: EExpenseCategory.TRANSPORT,
    });

    expect(terms).toContain('gasolina');
  });
});
