export function normalizeTransactionName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function namesLookSimilar(a: string, b: string): boolean {
  const left = normalizeTransactionName(a);
  const right = normalizeTransactionName(b);
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  return left.includes(right) || right.includes(left);
}

const INVOICE_PAYMENT_REGEX =
  /pagam?ento\s+(da\s+)?fatura|pagto\s+fat|fatura\s+(do\s+)?cart[aã]o|cartao\s+credito.*pag/i;

export function isInvoicePaymentDescription(name: string): boolean {
  return INVOICE_PAYMENT_REGEX.test(name);
}

export function chunkText(text: string, chunkSize = 12000, overlap = 400): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) {
      break;
    }
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function referenceMonthFromIsoDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function datesWithinOneDay(a: string, b: string): boolean {
  const left = parseIsoDate(a);
  const right = parseIsoDate(b);
  if (!left || !right) {
    return false;
  }
  const diffMs = Math.abs(left.getTime() - right.getTime());
  return diffMs <= 24 * 60 * 60 * 1000;
}

export function looksLikePdf(buffer: Buffer): boolean {
  if (buffer.length < 5) {
    return false;
  }
  return buffer.subarray(0, 5).toString('utf8') === '%PDF-';
}

const BR_MONTHS: Record<string, number> = {
  JAN: 1,
  FEV: 2,
  MAR: 3,
  ABR: 4,
  MAI: 5,
  JUN: 6,
  JUL: 7,
  AGO: 8,
  SET: 9,
  OUT: 10,
  NOV: 11,
  DEZ: 12,
};

const BR_AMOUNT_REGEX = /([−\-]?)\s*R\$\s*([\d.]+),(\d{2})/;

/** Linha típica Nubank: `21 AGO •••• 7353 Mercado X R$ 19,58` */
const BR_INVOICE_LINE_REGEX =
  /^(\d{2})\s+(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)\s+(?:••••\s+\d{4}\s+)?(.+?)\s+([−\-]?\s*R\$\s*[\d.]+,\d{2})\s*$/gim;

export type StructuredInvoiceLine = {
  name: string;
  amount: number;
  date: string;
  suggestedSkip: boolean;
};

export function parseBrMoney(raw: string): number | null {
  const match = raw.replace(/\u2212/g, '-').match(BR_AMOUNT_REGEX);
  if (!match) {
    return null;
  }
  const sign = match[1] === '-' ? -1 : 1;
  const whole = match[2].replace(/\./g, '');
  const cents = match[3];
  const value = Number(`${whole}.${cents}`);
  if (!Number.isFinite(value)) {
    return null;
  }
  return sign * value;
}

export function inferInvoiceAnchor(text: string): { year: number; month: number } {
  const fatura = text.match(/FATURA\s+\d{1,2}\s+([A-Z]{3})\s+(\d{4})/i);
  if (fatura) {
    const month = BR_MONTHS[fatura[1].toUpperCase()] ?? 12;
    return { year: Number(fatura[2]), month };
  }
  const vencimento = text.match(/vencimento:\s*\d{1,2}\s+([A-Z]{3})\s+(\d{4})/i);
  if (vencimento) {
    const month = BR_MONTHS[vencimento[1].toUpperCase()] ?? 12;
    return { year: Number(vencimento[2]), month };
  }
  return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
}

/** Se o mês da linha for depois do mês da fatura (ex.: DEZ numa fatura de JAN), usa ano anterior. */
export function resolveInvoiceLineYear(
  lineMonth: number,
  anchor: { year: number; month: number },
): number {
  if (lineMonth > anchor.month) {
    return anchor.year - 1;
  }
  return anchor.year;
}

export function brDayMonthToIso(day: number, monthAbbr: string, year: number): string | null {
  const month = BR_MONTHS[monthAbbr.toUpperCase()];
  if (!month || day < 1 || day > 31) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Extrai lançamentos de faturas BR (ex.: Nubank) sem LLM.
 * Ignora totais de cabeçalho e pagamentos (valores negativos / "Pagamento").
 */
export function extractStructuredInvoiceLines(text: string): StructuredInvoiceLine[] {
  const anchor = inferInvoiceAnchor(text);
  const lines: StructuredInvoiceLine[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(BR_INVOICE_LINE_REGEX)) {
    const day = Number(match[1]);
    const monthAbbr = match[2];
    const monthNum = BR_MONTHS[monthAbbr.toUpperCase()];
    let name = match[3].replace(/\s+/g, ' ').trim();
    const amountRaw = match[4];
    const amountSigned = parseBrMoney(amountRaw);
    const year = monthNum
      ? resolveInvoiceLineYear(monthNum, anchor)
      : anchor.year;
    const date = brDayMonthToIso(day, monthAbbr, year);

    if (amountSigned === null || !date || !name) {
      continue;
    }

    // Cabeçalho tipo "Filipe … R$ 5.211,85" sem descrição de compra
    if (/^filipe\b/i.test(name) && name.split(' ').length <= 5) {
      continue;
    }

    const isPayment =
      amountSigned < 0 ||
      /^pagamento\b/i.test(name) ||
      /^estorno\b/i.test(name);

    const amount = Math.abs(amountSigned);
    if (!(amount > 0)) {
      continue;
    }

    const key = `${date}|${normalizeTransactionName(name)}|${amount.toFixed(2)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    lines.push({
      name,
      amount,
      date,
      suggestedSkip: isPayment || isInvoicePaymentDescription(name),
    });
  }

  return lines;
}

const CATEGORY_RULES: Array<{ category: string; pattern: RegExp }> = [
  { category: 'FOOD', pattern: /ifood|ifd\*|mercado|super|assa[ií]|condor|outback|lanchonete|restaur|burger|gula|matuto|barbear|betel/i },
  { category: 'TRANSPORT', pattern: /uber|posto|combust|nutag|rcar|transport|tag\b|estacion/i },
  { category: 'SUBSCRIPTIONS', pattern: /crunchyroll|linkedin|tiktok|claro|ampernet|loovi|nucel|seguro|plano|assinat|netflix|spotify|vindi/i },
  { category: 'ENTERTAINMENT', pattern: /cinema|steam|playstation|xbox|evento/i },
  { category: 'EDUCATION', pattern: /rockfeller|curso|escola|udemy|alura/i },
  { category: 'HEALTH', pattern: /farmac|drog|hospital|clinica|dent/i },
  { category: 'HOUSING', pattern: /condom|aluguel|energia|agua|internet|telecom/i },
];

export function guessExpenseCategory(name: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(name)) {
      return rule.category;
    }
  }
  return 'OTHER';
}
