import {
  formatReferenceDateInTimezone,
  getCurrentReferenceMonth,
  normalizeReferenceMonth,
  REFERENCE_MONTH_REGEX,
  resolveReferenceMonth,
} from '../../../../domain/common/utils/reference-month';

describe('When normalizing reference month', () => {
  it('Should trim and accept valid YYYY-MM values', () => {
    expect(normalizeReferenceMonth(' 2026-06 ')).toBe('2026-06');
  });

  it('Should return undefined for invalid values', () => {
    expect(normalizeReferenceMonth('invalid')).toBeUndefined();
    expect(normalizeReferenceMonth('06-2026')).toBeUndefined();
    expect(normalizeReferenceMonth('')).toBeUndefined();
  });
});

describe('When resolving current reference month', () => {
  it('Should format month using timezone', () => {
    const referenceMonth = getCurrentReferenceMonth(
      'America/Sao_Paulo',
      new Date('2026-06-17T15:00:00.000Z'),
    );

    expect(referenceMonth).toBe('2026-06');
  });

  it('Should roll to previous month before midnight in Sao Paulo', () => {
    const referenceMonth = getCurrentReferenceMonth(
      'America/Sao_Paulo',
      new Date('2026-06-01T02:30:00.000Z'),
    );

    expect(referenceMonth).toBe('2026-05');
  });
});

describe('When resolving reference month from tool input', () => {
  it('Should fallback to current month when input is omitted', () => {
    const referenceMonth = resolveReferenceMonth(undefined);

    expect(referenceMonth).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
  });

  it('Should keep explicit valid month', () => {
    expect(resolveReferenceMonth('2025-11')).toBe('2025-11');
  });

  it('Should fallback to current month when input is invalid', () => {
    const referenceMonth = resolveReferenceMonth('bad-month');

    expect(referenceMonth).toMatch(REFERENCE_MONTH_REGEX);
  });
});

describe('When formatting reference date in timezone', () => {
  it('Should format today date in pt-BR for timezone', () => {
    const formattedDate = formatReferenceDateInTimezone(
      'America/Sao_Paulo',
      new Date('2026-06-17T15:00:00.000Z'),
    );

    expect(formattedDate).toBe('17/06/2026');
  });
});
