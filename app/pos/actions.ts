"use server";

import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  metodoPagoEnum,
  products,
  saleItems,
  sales,
} from "@/db/schema";

/** Normaliza un texto opcional: trim y "" -> null. */
const optionalText = z
  .string()
  .optional()
  .nullable()
  .transform((v) => {
    const t = (v ?? "").trim();
    return t === "" ? null : t;
  });

const checkoutSchema = z.object({
  metodoPago: z.enum(metodoPagoEnum.enumValues),
  cliente: z
    .object({
      nombre: optionalText,
      apellido: optionalText,
      direccion: optionalText,
      diaEntrega: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
        .optional()
        .nullable()
        .transform((v) => (v && v !== "" ? v : null)),
    })
    .optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        cantidad: z.number().int().positive(),
      }),
    )
    .min(1, "El carrito está vacío"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; saleId: string }
  | { ok: false; error: string };

/**
 * Registra una venta. Los precios y costos se RE-LEEN de la base (no se confía
 * en el cliente) y se guardan como snapshots en cada renglón. Los totales se
 * persisten ya calculados. Todo dentro de una transacción.
 */
export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { items, metodoPago, cliente } = parsed.data;
  const ids = Array.from(new Set(items.map((i) => i.productId)));

  const rows = await db
    .select({
      id: products.id,
      nombre: products.nombre,
      precioVenta: products.precioVenta,
      costo: products.costo,
      activo: products.activo,
      stock: products.stock,
    })
    .from(products)
    .where(inArray(products.id, ids));

  const byId = new Map(rows.map((r) => [r.id, r]));
  for (const i of items) {
    const p = byId.get(i.productId);
    if (!p) return { ok: false, error: "Un producto del carrito ya no existe" };
    if (!p.activo) return { ok: false, error: `"${p.nombre}" está inactivo` };
  }

  let total = 0;
  let totalCosto = 0;
  const itemsToInsert = items.map((i) => {
    const p = byId.get(i.productId)!;
    const precio = Number(p.precioVenta);
    const costo = p.costo == null ? 0 : Number(p.costo);
    const subtotal = precio * i.cantidad;
    total += subtotal;
    totalCosto += costo * i.cantidad;
    return {
      productId: p.id,
      nombreSnapshot: p.nombre,
      cantidad: i.cantidad,
      precioUnitarioSnapshot: precio.toFixed(2),
      costoUnitarioSnapshot: costo.toFixed(2),
      subtotal: subtotal.toFixed(2),
    };
  });
  const totalGanancia = total - totalCosto;

  // Cantidad total por producto (el carrito ya viene deduplicado, pero por
  // las dudas agregamos por si llegan renglones repetidos).
  const qtyByProduct = new Map<string, number>();
  for (const i of items) {
    qtyByProduct.set(i.productId, (qtyByProduct.get(i.productId) ?? 0) + i.cantidad);
  }

  try {
    const saleId = await db.transaction(async (tx) => {
      const [sale] = await tx
        .insert(sales)
        .values({
          total: total.toFixed(2),
          totalCosto: totalCosto.toFixed(2),
          totalGanancia: totalGanancia.toFixed(2),
          metodoPago,
          clienteNombre: cliente?.nombre ?? null,
          clienteApellido: cliente?.apellido ?? null,
          clienteDireccion: cliente?.direccion ?? null,
          diaEntrega: cliente?.diaEntrega ?? null,
        })
        .returning({ id: sales.id });

      await tx
        .insert(saleItems)
        .values(itemsToInsert.map((it) => ({ ...it, saleId: sale.id })));

      // Descontar stock SOLO de los productos que lo tienen habilitado
      // (stock != null). La condición `gte(stock, qty)` hace el chequeo y el
      // descuento atómicos: si no alcanza, no actualiza ninguna fila -> abortamos.
      for (const [productId, qty] of Array.from(qtyByProduct)) {
        const p = byId.get(productId)!;
        if (p.stock == null) continue;
        const updated = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${qty}`, updatedAt: new Date() })
          .where(and(eq(products.id, productId), gte(products.stock, qty)))
          .returning({ id: products.id });
        if (updated.length === 0) {
          throw new Error(`Stock insuficiente de "${p.nombre}"`);
        }
      }

      return sale.id;
    });

    revalidatePath("/ventas");
    revalidatePath("/dashboard");
    revalidatePath("/productos");
    revalidatePath("/pos");
    return { ok: true, saleId };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "No se pudo registrar la venta",
    };
  }
}
