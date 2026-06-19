export const REFERENCE_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export const DEFAULT_REFERENCE_TIMEZONE = 'America/Sao_Paulo';

export function normalizeReferenceMonth(value?: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed || !REFERENCE_MONTH_REGEX.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

export function getCurrentReferenceMonth(
  timezone = DEFAULT_REFERENCE_TIMEZONE,
  now = new Date(),
): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;

  if (!year || !month) {
    throw new Error(`Unable to resolve reference month for timezone ${timezone}`);
  }

  return `${year}-${month}`;
}

export function formatReferenceDateInTimezone(
  timezone = DEFAULT_REFERENCE_TIMEZONE,
  now = new Date(),
): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);
}

export function resolveReferenceMonth(raw?: unknown): string {
  const normalized =
    typeof raw === 'string' ? normalizeReferenceMonth(raw) : undefined;

  return normalized ?? getCurrentReferenceMonth();
}
