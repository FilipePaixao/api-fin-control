export function reciprocalRankFusion(rankings: string[][], k = 60): string[] {
  const scores = new Map<string, number>();

  for (const ranking of rankings) {
    ranking.forEach((id, index) => {
      scores.set(id, (scores.get(id) || 0) + 1 / (k + index + 1));
    });
  }

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([id]) => id);
}
