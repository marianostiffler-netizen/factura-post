import { desc, eq } from "drizzle-orm";
import { toARDateParts } from "@/lib/utils";

import { db } from "@/db";
import {
  saleItems,
  saleItemsMayorista,
  sales,
  salesMayorista,
} from "@/db/schema";
import type { MetodoPago } from "@/db/schema";

export type SaleRow = {
  id: string;
  fecha: Date;
  total: string;
  totalCosto: string;
  totalGanancia: string;
  metodoPago: MetodoPago;
  clienteNombre: string | null;
  clienteApellido: string | null;
  clienteDireccion: string | null;
  diaEntrega: string | null;
};

export type SaleItemRow = {
  id: string;
  nombreSnapshot: string;
  cantidad: number;
  precioUnitarioSnapshot: string;
  costoUnitarioSnapshot: string;
  subtotal: string;
};

export const METODO_LABEL: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  qr: "QR",
  otro: "Otro",
};

/** Últimas ventas (cabecera), más recientes primero. */
export async function getSales(limit = 100): Promise<SaleRow[]> {
  return db
    .select({
      id: sales.id,
      fecha: sales.fecha,
      total: sales.total,
      totalCosto: sales.totalCosto,
      totalGanancia: sales.totalGanancia,
      metodoPago: sales.metodoPago,
      clienteNombre: sales.clienteNombre,
      clienteApellido: sales.clienteApellido,
      clienteDireccion: sales.clienteDireccion,
      diaEntrega: sales.diaEntrega,
    })
    .from(sales)
    .orderBy(desc(sales.fecha))
    .limit(limit);
}

/** Una venta con sus renglones, o null si no existe. */
export async function getSaleById(
  id: string,
): Promise<{ sale: SaleRow; items: SaleItemRow[] } | null> {
  const [sale] = await db
    .select({
      id: sales.id,
      fecha: sales.fecha,
      total: sales.total,
      totalCosto: sales.totalCosto,
      totalGanancia: sales.totalGanancia,
      metodoPago: sales.metodoPago,
      clienteNombre: sales.clienteNombre,
      clienteApellido: sales.clienteApellido,
      clienteDireccion: sales.clienteDireccion,
      diaEntrega: sales.diaEntrega,
    })
    .from(sales)
    .where(eq(sales.id, id))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select({
      id: saleItems.id,
      nombreSnapshot: saleItems.nombreSnapshot,
      cantidad: saleItems.cantidad,
      precioUnitarioSnapshot: saleItems.precioUnitarioSnapshot,
      costoUnitarioSnapshot: saleItems.costoUnitarioSnapshot,
      subtotal: saleItems.subtotal,
    })
    .from(saleItems)
    .where(eq(saleItems.saleId, id));

  return { sale, items };
}

/** Últimas ventas MAYORISTAS (cabecera), más recientes primero. */
export async function getSalesMayorista(limit = 100): Promise<SaleRow[]> {
  return db
    .select({
      id: salesMayorista.id,
      fecha: salesMayorista.fecha,
      total: salesMayorista.total,
      totalCosto: salesMayorista.totalCosto,
      totalGanancia: salesMayorista.totalGanancia,
      metodoPago: salesMayorista.metodoPago,
      clienteNombre: salesMayorista.clienteNombre,
      clienteApellido: salesMayorista.clienteApellido,
      clienteDireccion: salesMayorista.clienteDireccion,
      diaEntrega: salesMayorista.diaEntrega,
    })
    .from(salesMayorista)
    .orderBy(desc(salesMayorista.fecha))
    .limit(limit);
}

/** Una venta MAYORISTA con sus renglones, o null si no existe. */
export async function getSaleMayoristaById(
  id: string,
): Promise<{ sale: SaleRow; items: SaleItemRow[] } | null> {
  const [sale] = await db
    .select({
      id: salesMayorista.id,
      fecha: salesMayorista.fecha,
      total: salesMayorista.total,
      totalCosto: salesMayorista.totalCosto,
      totalGanancia: salesMayorista.totalGanancia,
      metodoPago: salesMayorista.metodoPago,
      clienteNombre: salesMayorista.clienteNombre,
      clienteApellido: salesMayorista.clienteApellido,
      clienteDireccion: salesMayorista.clienteDireccion,
      diaEntrega: salesMayorista.diaEntrega,
    })
    .from(salesMayorista)
    .where(eq(salesMayorista.id, id))
    .limit(1);

  if (!sale) return null;

  const items = await db
    .select({
      id: saleItemsMayorista.id,
      nombreSnapshot: saleItemsMayorista.nombreSnapshot,
      cantidad: saleItemsMayorista.cantidad,
      precioUnitarioSnapshot: saleItemsMayorista.precioUnitarioSnapshot,
      costoUnitarioSnapshot: saleItemsMayorista.costoUnitarioSnapshot,
      subtotal: saleItemsMayorista.subtotal,
    })
    .from(saleItemsMayorista)
    .where(eq(saleItemsMayorista.saleId, id));

  return { sale, items };
}

/** Número de comprobante legible y estable a partir del UUID. */
export function comprobanteNro(sale: SaleRow): string {
  // Usamos la fecha en zona AR para que el número no dependa del TZ del server.
  const { year, month, day } = toARDateParts(sale.fecha);
  const ymd = `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`;
  return `${ymd}-${sale.id.slice(0, 8).toUpperCase()}`;
}
