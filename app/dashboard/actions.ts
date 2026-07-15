"use server";

import { getSerieDiariaRango, getSerieDiariaRangoMayorista } from "@/lib/analytics";
import type { SerieDia } from "@/lib/analytics";

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
