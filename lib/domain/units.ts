/**
 * Every linear dimension in Lares is an integer count of millimetres, and every
 * price is an integer count of Australian cents. Floating point never enters the
 * domain model, so geometry comparisons are exact.
 */
export type Mm = number;
export type Cents = number;

export const MM_PER_METRE = 1000;

export function metresToMm(metres: number): Mm {
  return Math.round(metres * MM_PER_METRE);
}

export function mmToMetres(mm: Mm): number {
  return mm / MM_PER_METRE;
}

export function formatMm(mm: Mm): string {
  return `${mm}mm`;
}

export function formatMetres(mm: Mm): string {
  return `${(mm / MM_PER_METRE).toFixed(2)}m`;
}

export function dollarsToCents(dollars: number): Cents {
  return Math.round(dollars * 100);
}

export function formatAud(cents: Cents): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
