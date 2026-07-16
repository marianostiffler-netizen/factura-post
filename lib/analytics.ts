import { sql } from "drizzle-orm";

import { db } from "@/db";
import type { MetodoPago } from "@/db/schema";

/**
 * Zona horaria del comercio. Las columnas `fecha` son `timestamptz` (UTC en
 * disco); para agrupar por día/semana usamos la hora local Argentina, así una
 * venta a las 23 hs no cae en el día siguiente.
 */
const AR_TZ = "America/Argentina/Buenos_Aires";

export type Kpis = {
  ventas: number;
  facturacion: number;
  ganancia: number;
  costo: number;
  ticketPromedio: number;
  margenPct: number; // ganancia / facturación * 100
};

export type SerieDia = {
  dia: string; // YYYY-MM-DD
  total: number;
  ganancia: number;
  ventas: number;
};

export type PorMetodo = {
  metodoPago: MetodoPago;
  total: number;
  ventas: number;
};

export type TopProducto = {
  nombre: string;
  cantidad: number;
  total: number;
  ganancia: number;
};

async function kpisFrom(salesTable: string): Promise<Kpis> {
  const rows = await db.execute<{
    n: number;
    fact: string;
    gan: string;
    costo: string;
  }>(sql`
    select
      count(*)::int as n,
      coalesce(sum(total), 0) as fact,
      coalesce(sum(total_ganancia), 0) as gan,
      coalesce(sum(total_costo), 0) as costo
    from ${sql.raw(salesTable)}
  `);
  const r = rows[0] ?? { n: 0, fact: "0", gan: "0", costo: "0" };
  const ventas = Number(r.n);
  const facturacion = Number(r.fact);
  const ganancia = Number(r.gan);
  const costo = Number(r.costo);
  return {
    ventas,
    facturacion,
    ganancia,
    costo,
    ticketPromedio: ventas > 0 ? facturacion / ventas : 0,
    margenPct: facturacion > 0 ? (ganancia / facturacion) * 100 : 0,
  };
}

async function kpisFromRango(
  salesTable: string,
  fechaInicio: string,
  fechaFin: string,
): Promise<Kpis> {
  const rows = await db.execute<{
    n: number;
    fact: string;
    gan: string;
    costo: string;
  }>(sql`
    select
      count(*)::int as n,
      coalesce(sum(total), 0) as fact,
      coalesce(sum(total_ganancia), 0) as gan,
      coalesce(sum(total_costo), 0) as costo
    from ${sql.raw(salesTable)}
    where fecha >= ${fechaInicio}::date and fecha <= ${fechaFin}::date
  `);
  const r = rows[0] ?? { n: 0, fact: "0", gan: "0", costo: "0" };
  const ventas = Number(r.n);
  const facturacion = Number(r.fact);
  const ganancia = Number(r.gan);
  const costo = Number(r.costo);
  return {
    ventas,
    facturacion,
    ganancia,
    costo,
    ticketPromedio: ventas > 0 ? facturacion / ventas : 0,
    margenPct: facturacion > 0 ? (ganancia / facturacion) * 100 : 0,
  };
}

// Minorista usa la tabla `sales`; mayorista, `sales_mayorista`. Nunca se mezclan.
export const getKpis = () => kpisFrom("sales");
export const getKpisMayorista = () => kpisFrom("sales_mayorista");
export const getKpisRango = (fechaInicio: string, fechaFin: string) =>
  kpisFromRango("sales", fechaInicio, fechaFin);
export const getKpisRangoMayorista = (fechaInicio: string, fechaFin: string) =>
  kpisFromRango("sales_mayorista", fechaInicio, fechaFin);

async function serieDiariaFrom(
  salesTable: string,
  dias: number,
): Promise<SerieDia[]> {
  const rows = await db.execute<{
    dia: string;
    total: string;
    ganancia: string;
    ventas: number;
  }>(sql`
    select
      to_char(date_trunc('day', (fecha at time zone ${AR_TZ})), 'YYYY-MM-DD') as dia,
      sum(total) as total,
      sum(total_ganancia) as ganancia,
      count(*)::int as ventas
    from ${sql.raw(salesTable)}
    where fecha >= now() - (${dias} || ' days')::interval
    group by 1
    order by 1
  `);
  return rows.map((r) => ({
    dia: r.dia,
    total: Number(r.total),
    ganancia: Number(r.ganancia),
    ventas: Number(r.ventas),
  }));
}
export const getSerieDiaria = (dias = 30) => serieDiariaFrom("sales", dias);
export const getSerieDiariaMayorista = (dias = 30) =>
  serieDiariaFrom("sales_mayorista", dias);

async function porMetodoFrom(salesTable: string): Promise<PorMetodo[]> {
  const rows = await db.execute<{
    metodo_pago: MetodoPago;
    total: string;
    ventas: number;
  }>(sql`
    select metodo_pago, sum(total) as total, count(*)::int as ventas
    from ${sql.raw(salesTable)}
    group by 1
    order by 2 desc
  `);
  return rows.map((r) => ({
    metodoPago: r.metodo_pago,
    total: Number(r.total),
    ventas: Number(r.ventas),
  }));
}
export const getPorMetodo = () => porMetodoFrom("sales");
export const getPorMetodoMayorista = () => porMetodoFrom("sales_mayorista");

async function topProductosFrom(
  itemsTable: string,
  limit: number,
  orderBy: "total" | "ganancia" = "total",
): Promise<TopProducto[]> {
  const orderCol = orderBy === "ganancia" ? sql.raw("ganancia") : sql.raw("total");
  const rows = await db.execute<{
    nombre: string;
    cantidad: number;
    total: string;
    ganancia: string;
  }>(sql`
    select
      nombre_snapshot as nombre,
      sum(cantidad)::int as cantidad,
      sum(subtotal) as total,
      sum((precio_unitario_snapshot - costo_unitario_snapshot) * cantidad) as ganancia
    from ${sql.raw(itemsTable)}
    group by 1
    order by ${orderCol} desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    nombre: r.nombre,
    cantidad: Number(r.cantidad),
    total: Number(r.total),
    ganancia: Number(r.ganancia),
  }));
}
export const getTopProductos = (limit = 10) => topProductosFrom("sale_items", limit);
// Mayorista: top por RENTABILIDAD (ganancia).
export const getTopProductosMayorista = (limit = 10) =>
  topProductosFrom("sale_items_mayorista", limit, "ganancia");

// ───────────────────────── Analytics expandido ─────────────────────────

export type ProductoUnidades = { nombre: string; unidades: number; total: number };

/** Productos más vendidos por UNIDADES (no por facturación). */
export async function getTopProductosUnidades(
  limit = 8,
): Promise<ProductoUnidades[]> {
  const rows = await db.execute<{
    nombre: string;
    unidades: number;
    total: string;
  }>(sql`
    select nombre_snapshot as nombre, sum(cantidad)::int as unidades, sum(subtotal) as total
    from sale_items
    group by 1
    order by unidades desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    nombre: r.nombre,
    unidades: Number(r.unidades),
    total: Number(r.total),
  }));
}

export type PorCategoria = {
  categoria: string;
  total: number;
  unidades: number;
};

/** Facturación y unidades por categoría (join con products por product_id). */
async function ventasPorCategoriaFrom(itemsTable: string): Promise<PorCategoria[]> {
  const rows = await db.execute<{
    categoria: string;
    total: string;
    unidades: number;
  }>(sql`
    select
      coalesce(p.categoria, 'Sin categoría') as categoria,
      sum(si.subtotal) as total,
      sum(si.cantidad)::int as unidades
    from ${sql.raw(itemsTable)} si
    left join products p on p.id = si.product_id
    group by 1
    order by total desc
  `);
  return rows.map((r) => ({
    categoria: r.categoria,
    total: Number(r.total),
    unidades: Number(r.unidades),
  }));
}
export const getVentasPorCategoria = () => ventasPorCategoriaFrom("sale_items");
export const getVentasPorCategoriaMayorista = () =>
  ventasPorCategoriaFrom("sale_items_mayorista");

export type MargenCategoria = {
  categoria: string;
  facturado: number;
  ganancia: number;
  margenPct: number;
};

/** Margen promedio (ponderado) por categoría. */
export async function getMargenPorCategoria(): Promise<MargenCategoria[]> {
  const rows = await db.execute<{
    categoria: string;
    facturado: string;
    ganancia: string;
  }>(sql`
    select
      coalesce(p.categoria, 'Sin categoría') as categoria,
      sum(si.subtotal) as facturado,
      sum((si.precio_unitario_snapshot - si.costo_unitario_snapshot) * si.cantidad) as ganancia
    from sale_items si
    left join products p on p.id = si.product_id
    group by 1
    order by facturado desc
  `);
  return rows.map((r) => {
    const facturado = Number(r.facturado);
    const ganancia = Number(r.ganancia);
    return {
      categoria: r.categoria,
      facturado,
      ganancia,
      margenPct: facturado > 0 ? (ganancia / facturado) * 100 : 0,
    };
  });
}

export type TopCliente = { cliente: string; total: number; compras: number };

/** Clientes que más gastaron (solo ventas con datos de cliente cargados). */
export async function getTopClientes(limit = 8): Promise<TopCliente[]> {
  const rows = await db.execute<{
    cliente: string;
    total: string;
    compras: number;
  }>(sql`
    select
      trim(coalesce(cliente_nombre, '') || ' ' || coalesce(cliente_apellido, '')) as cliente,
      sum(total) as total,
      count(*)::int as compras
    from sales
    where cliente_nombre is not null or cliente_apellido is not null
    group by 1
    having trim(coalesce(cliente_nombre, '') || ' ' || coalesce(cliente_apellido, '')) <> ''
    order by total desc
    limit ${limit}
  `);
  return rows.map((r) => ({
    cliente: r.cliente,
    total: Number(r.total),
    compras: Number(r.compras),
  }));
}

export type DiaSemana = {
  dow: number; // 1=Lun .. 7=Dom
  dia: string; // etiqueta corta
  total: number;
  ventas: number;
};

const DOW_LABEL = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Ventas agregadas por día de la semana (siempre devuelve los 7 días). */
export async function getVentasPorDiaSemana(): Promise<DiaSemana[]> {
  const rows = await db.execute<{
    dow: number;
    total: string;
    ventas: number;
  }>(sql`
    select
      extract(isodow from (fecha at time zone ${AR_TZ}))::int as dow,
      sum(total) as total,
      count(*)::int as ventas
    from sales
    group by 1
  `);
  const byDow = new Map(rows.map((r) => [Number(r.dow), r]));
  return DOW_LABEL.map((dia, i) => {
    const dow = i + 1;
    const r = byDow.get(dow);
    return {
      dow,
      dia,
      total: r ? Number(r.total) : 0,
      ventas: r ? Number(r.ventas) : 0,
    };
  });
}

export type ComparativaSemanal = {
  actual: number;
  anterior: number;
  ventasActual: number;
  ventasAnterior: number;
  deltaPct: number | null; // null si la semana anterior fue 0
};

/** Semana actual (desde el lunes) vs la semana anterior completa. */
async function comparativaSemanalFrom(
  salesTable: string,
): Promise<ComparativaSemanal> {
  const rows = await db.execute<{
    actual: string;
    anterior: string;
    ventas_actual: number;
    ventas_anterior: number;
  }>(sql`
    with b as (
      select date_trunc('week', (now() at time zone ${AR_TZ})) as ws
    ),
    s as (
      select total, (fecha at time zone ${AR_TZ}) as f from ${sql.raw(salesTable)}
    )
    select
      coalesce(sum(s.total) filter (where s.f >= b.ws), 0) as actual,
      coalesce(sum(s.total) filter (
        where s.f >= b.ws - interval '7 days' and s.f < b.ws
      ), 0) as anterior,
      coalesce(count(*) filter (where s.f >= b.ws), 0)::int as ventas_actual,
      coalesce(count(*) filter (
        where s.f >= b.ws - interval '7 days' and s.f < b.ws
      ), 0)::int as ventas_anterior
    from s cross join b
  `);
  const r = rows[0] ?? {
    actual: "0",
    anterior: "0",
    ventas_actual: 0,
    ventas_anterior: 0,
  };
  const actual = Number(r.actual);
  const anterior = Number(r.anterior);
  return {
    actual,
    anterior,
    ventasActual: Number(r.ventas_actual),
    ventasAnterior: Number(r.ventas_anterior),
    deltaPct: anterior > 0 ? ((actual - anterior) / anterior) * 100 : null,
  };
}
export const getComparativaSemanal = () => comparativaSemanalFrom("sales");
export const getComparativaSemanalMayorista = () =>
  comparativaSemanalFrom("sales_mayorista");

// ───────────────────────── NUEVA FUNCIÓN PARA NAVEGACIÓN TEMPORAL ─────────────────────────

/**
 * Serie diaria para un rango de fechas específico (para navegación temporal).
 * Usa la misma lógica que serieDiariaFrom pero con fechas explícitas.
 */
async function serieDiariaRangoFrom(
  salesTable: string,
  fechaInicio: string, // YYYY-MM-DD
  fechaFin: string, // YYYY-MM-DD
): Promise<SerieDia[]> {
  const rows = await db.execute<{
    dia: string;
    total: string;
    ganancia: string;
    ventas: number;
  }>(sql`
    select
      to_char(date_trunc('day', (fecha at time zone ${AR_TZ})), 'YYYY-MM-DD') as dia,
      sum(total) as total,
      sum(total_ganancia) as ganancia,
      count(*)::int as ventas
    from ${sql.raw(salesTable)}
    where fecha >= ${fechaInicio}::date and fecha <= ${fechaFin}::date
    group by 1
    order by 1
  `);
  return rows.map((r) => ({
    dia: r.dia,
    total: Number(r.total),
    ganancia: Number(r.ganancia),
    ventas: Number(r.ventas),
  }));
}

export const getSerieDiariaRango = (
  fechaInicio: string,
  fechaFin: string,
) => serieDiariaRangoFrom("sales", fechaInicio, fechaFin);
export const getSerieDiariaRangoMayorista = (
  fechaInicio: string,
  fechaFin: string,
) => serieDiariaRangoFrom("sales_mayorista", fechaInicio, fechaFin);
