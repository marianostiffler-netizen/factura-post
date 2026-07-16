"use server";

import {
  getSerieDiariaRango,
  getSerieDiariaRangoMayorista,
  getKpisRango,
  getKpisRangoMayorista,
} from "@/lib/analytics";
import type { SerieDia, Kpis } from "@/lib/analytics";

/**
 * Server Action para obtener datos de ventas de un rango específico (minorista).
 * Usado por el componente de navegación temporal del gráfico.
 */
export async function getSerieDiariaRangoAction(
  fechaInicio: string,
  fechaFin: string,
): Promise<SerieDia[]> {
  return getSerieDiariaRango(fechaInicio, fechaFin);
}

/**
 * Server Action para obtener datos de ventas de un rango específico (mayorista).
 * Usado por el componente de navegación temporal del gráfico mayorista.
 */
export async function getSerieDiariaRangoMayoristaAction(
  fechaInicio: string,
  fechaFin: string,
): Promise<SerieDia[]> {
  return getSerieDiariaRangoMayorista(fechaInicio, fechaFin);
}

/**
 * Server Action para obtener KPIs de un rango específico (minorista).
 * Usado para mostrar totales que coinciden con el gráfico.
 */
export async function getKpisRangoAction(
  fechaInicio: string,
  fechaFin: string,
): Promise<Kpis> {
  return getKpisRango(fechaInicio, fechaFin);
}

/**
 * Server Action para obtener KPIs de un rango específico (mayorista).
 * Usado para mostrar totales que coinciden con el gráfico mayorista.
 */
export async function getKpisRangoMayoristaAction(
  fechaInicio: string,
  fechaFin: string,
): Promise<Kpis> {
  return getKpisRangoMayorista(fechaInicio, fechaFin);
}
