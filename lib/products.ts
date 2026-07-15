import { asc, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";

export type ProductRow = {
  id: string;
  nombre: string;
  presentacion: string | null;
  categoria: string;
  precioVenta: string;
  precioMayorista: string | null;
  costo: string | null;
  margenPct: string | null;
  margenMayoristaPct: string | null;
  stock: number | null;
  activo: boolean;
};

/** Lista productos, opcionalmente filtrando por texto. Ordena por nombre. */
export async function getProducts(query?: string): Promise<ProductRow[]> {
  const q = query?.trim();
  const rows = await db
    .select({
      id: products.id,
      nombre: products.nombre,
      presentacion: products.presentacion,
      categoria: products.categoria,
      precioVenta: products.precioVenta,
      precioMayorista: products.precioMayorista,
      costo: products.costo,
      margenPct: products.margenPct,
      margenMayoristaPct: products.margenMayoristaPct,
      stock: products.stock,
      activo: products.activo,
    })
    .from(products)
    .where(
      q
        ? or(
            ilike(products.nombre, `%${q}%`),
            ilike(products.categoria, `%${q}%`),
          )
        : undefined,
    )
    .orderBy(asc(products.nombre));
  return rows;
}

/** Devuelve las categorías distintas existentes (para filtros). */
export async function getCategorias(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ categoria: products.categoria })
    .from(products)
    .orderBy(asc(products.categoria));
  return rows.map((r) => r.categoria);
}

/**
 * Forma "client-safe" de un producto para el POS: NO incluye costo ni margen,
 * para no filtrar datos sensibles al navegador (el bundle/HTML del cliente).
 * El checkout re-lee el costo desde la DB, así que el cliente no lo necesita.
 */
export type PosProduct = {
  id: string;
  nombre: string;
  presentacion: string | null;
  categoria: string;
  precioVenta: string;
  stock: number | null;
};

/** Productos activos para el POS minorista, sin costo ni margen. */
export async function getProductosActivos(): Promise<PosProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      nombre: products.nombre,
      presentacion: products.presentacion,
      categoria: products.categoria,
      precioVenta: products.precioVenta,
      stock: products.stock,
    })
    .from(products)
    .where(sql`${products.activo} = true`)
    .orderBy(asc(products.nombre));
  return rows;
}

/**
 * Productos activos para el POS MAYORISTA. Mapea `precio_mayorista` a
 * `precioVenta` para reusar el mismo componente de POS. Solo incluye productos
 * con precio mayorista cargado. No expone costo ni margen al cliente.
 */
export async function getProductosMayoristasActivos(): Promise<PosProduct[]> {
  const rows = await db
    .select({
      id: products.id,
      nombre: products.nombre,
      presentacion: products.presentacion,
      categoria: products.categoria,
      precioVenta: products.precioMayorista,
      stock: products.stock,
    })
    .from(products)
    .where(sql`${products.activo} = true and ${products.precioMayorista} is not null`)
    .orderBy(asc(products.nombre));
  // precioVenta viene de precio_mayorista, que es not-null por el filtro.
  return rows.map((r) => ({ ...r, precioVenta: r.precioVenta as string }));
}
