import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Zona horaria del comercio ────────────────────────────────────────────────
export const AR_TZ = "America/Argentina/Buenos_Aires";

/**
 * Formatea un Date en la zona horaria de Buenos Aires.
 * Úsalo en lugar de `Intl.DateTimeFormat` sin `timeZone` para evitar que
 * Vercel (UTC) muestre fechas/horas 3 h adelantadas.
 */
export function fmtFechaAR(
  d: Date,
  opts: Omit<Intl.DateTimeFormatOptions, "timeZone"> = {
    dateStyle: "short",
    timeStyle: "short",
  },
): string {
  return new Intl.DateTimeFormat("es-AR", { ...opts, timeZone: AR_TZ }).format(d);
}

/**
 * Retorna un objeto con year/month/day del Date en zona AR.
 * Permite comparar "¿es hoy en Argentina?" sin depender de la TZ del server.
 */
export function toARDateParts(d: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: AR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

/** ¿Dos fechas son el mismo día en Argentina? */
export function isSameDayAR(a: Date, b: Date): boolean {
  const pa = toARDateParts(a);
  const pb = toARDateParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/** Formatea un número como moneda (ARS por defecto). */
export function formatCurrency(value: number | string, currency = "ARS") {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Formatea un porcentaje a partir de un número (12.5 -> "12,5%"). */
export function formatPercent(value: number | string, fractionDigits = 1) {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(n) ? n : 0) + "%";
}
