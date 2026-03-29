export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  if (typeof amount !== 'number') return 'R0.00';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const symbol = currency === 'USD' ? '$' : 'R';
  return isNegative ? `${symbol}-${formatted}` : `${symbol}${formatted}`;
}

export function normalizeDate(date: unknown): Date {
  if (!date) return new Date(0);
  if (
    typeof date === 'object' &&
    date !== null &&
    'toDate' in date &&
    typeof (date as { toDate: () => Date }).toDate === 'function'
  ) {
    return (date as { toDate: () => Date }).toDate();
  }
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  if (date instanceof Date) return date;
  const fallback = new Date(date as number);
  if (!isNaN(fallback.getTime())) return fallback;
  return new Date(0);
}

export function formatDate(date: unknown, pattern: 'full' | 'short' | 'medium' = 'medium'): string {
  const d = normalizeDate(date);
  if (d.getTime() === 0) return '-';
  if (pattern === 'full') {
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  if (pattern === 'short') {
    return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' });
  }
  return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function groupDateLabel(date: unknown): string {
  const d = normalizeDate(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay() + (startOfToday.getDay() === 0 ? -6 : 1));
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfWeek.getDate() - 7);

  if (d >= startOfWeek) return 'THIS WEEK';
  if (d >= startOfLastWeek) return 'LAST WEEK';
  return 'OLDER';
}
