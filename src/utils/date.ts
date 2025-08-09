// Utilitários de data seguros para evitar problemas de fuso horário

/**
 * Faz o parse de uma data no formato YYYY-MM-DD de forma segura, utilizando meio-dia
 * para evitar mudanças de dia por fuso horário/DST.
 */
export function parseDateSafe(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date(NaN);
  const onlyDate = String(dateStr).split('T')[0];
  const [yearStr, monthStr, dayStr] = onlyDate.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Converte um objeto Date para YYYY-MM-DD em calendário local (sem horário).
 */
export function toISODateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Verifica se uma data (considerando apenas a parte de calendário) está no intervalo inclusivo.
 */
export function isDateWithin(date: Date, start: Date, end: Date): boolean {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return a >= s && a <= e;
}


