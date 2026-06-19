import { reciprocalRankFusion } from '../../../../domain/expense-search/utils/reciprocal-rank-fusion.utils';

describe('When merging lexical and semantic rankings with reciprocal rank fusion', () => {
  it('Should prioritize documents present in both rankings', () => {
    const merged = reciprocalRankFusion([
      ['expense-1', 'expense-2', 'expense-3'],
      ['expense-2', 'expense-1', 'expense-4'],
    ]);

    expect(merged.slice(0, 2)).toEqual(expect.arrayContaining(['expense-1', 'expense-2']));
    expect(merged).toEqual(expect.arrayContaining(['expense-3', 'expense-4']));
  });
});

describe('When one ranking is empty', () => {
  it('Should return the non-empty ranking order', () => {
    const merged = reciprocalRankFusion([[], ['expense-1', 'expense-2']]);

    expect(merged).toEqual(['expense-1', 'expense-2']);
  });
});
