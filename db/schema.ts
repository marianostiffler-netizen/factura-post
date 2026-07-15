import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Métodos de pago admitidos. */
export const metodoPagoEnum = pgEnum("metodo_pago", [
  "efectivo",
  "tarjeta",
  "transferencia",
  "qr",
  "otro",
]);

/**
 * Productos del catálogo.
 *
 * Modelo: el `precio_venta` es la FUENTE DE VERDAD (viene de la lista de
 * precios del comercio). El `costo` se carga después (puede quedar nulo).
 * `margen_pct` es una columna GENERADA = margen real sobre el costo:
 *   round((precio_venta - costo) / costo * 100, 2)
 * y queda NULL mientras no haya costo cargado.
 */
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  presentacion: text("presentacion"), // ej. "X 10"
  categoria: text("categoria").notNull().default("General"),
  // Precio de venta al público (lo que paga el cliente). Fuente de verdad.
  precioVenta: numeric("precio_venta", { precision: 12, scale: 2 }).notNull(),
  // Costo de compra. Se completa más adelante; nulo = "sin costo cargado".
  costo: numeric("costo", { precision: 12, scale: 2 }),
  // Margen real generado a partir de precio y costo (NULL si no hay costo).
  margenPct: numeric("margen_pct", { precision: 6, scale: 2 }).generatedAlwaysAs(
    sql`round((precio_venta - costo) / nullif(costo, 0) * 100, 2)`,
  ),
  // Precio de venta mayorista (mismo costo; lista de precios aparte).
  precioMayorista: numeric("precio_mayorista", { precision: 12, scale: 2 }),
  // Margen mayorista generado: round((precio_mayorista - costo)/costo*100, 2).
  margenMayoristaPct: numeric("margen_mayorista_pct", { precision: 6, scale: 2 })
    .generatedAlwaysAs(
      sql`round((precio_mayorista - costo) / nullif(costo, 0) * 100, 2)`,
    ),
  stock: integer("stock"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Cabecera de venta. Los totales se persisten ya calculados
 * (incluida la ganancia) para no recomputarlos en cada reporte.
 */
export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  totalCosto: numeric("total_costo", { precision: 12, scale: 2 }).notNull(),
  totalGanancia: numeric("total_ganancia", { precision: 12, scale: 2 }).notNull(),
  metodoPago: metodoPagoEnum("metodo_pago").notNull().default("efectivo"),
  // Datos del cliente (todos opcionales). Se muestran en la factura.
  clienteNombre: text("cliente_nombre"),
  clienteApellido: text("cliente_apellido"),
  clienteDireccion: text("cliente_direccion"),
  // Día de entrega pactado (opcional).
  diaEntrega: date("dia_entrega"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Renglones de la venta. Guarda SNAPSHOTS de nombre, precio y costo
 * al momento de la venta: si luego editás el producto, los reportes
 * históricos no cambian.
 */
export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  nombreSnapshot: text("nombre_snapshot").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitarioSnapshot: numeric("precio_unitario_snapshot", {
    precision: 12,
    scale: 2,
  }).notNull(),
  costoUnitarioSnapshot: numeric("costo_unitario_snapshot", {
    precision: 12,
    scale: 2,
  }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

/**
 * Ventas MAYORISTAS. Tabla espejo de `sales`, totalmente separada: las ventas
 * mayoristas y minoristas nunca se mezclan en reportes.
 */
export const salesMayorista = pgTable("sales_mayorista", {
  id: uuid("id").defaultRandom().primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  totalCosto: numeric("total_costo", { precision: 12, scale: 2 }).notNull(),
  totalGanancia: numeric("total_ganancia", { precision: 12, scale: 2 }).notNull(),
  metodoPago: metodoPagoEnum("metodo_pago").notNull().default("efectivo"),
  clienteNombre: text("cliente_nombre"),
  clienteApellido: text("cliente_apellido"),
  clienteDireccion: text("cliente_direccion"),
  diaEntrega: date("dia_entrega"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Renglones de ventas mayoristas. Espejo de `sale_items`. */
export const saleItemsMayorista = pgTable("sale_items_mayorista", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id")
    .notNull()
    .references(() => salesMayorista.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  nombreSnapshot: text("nombre_snapshot").notNull(),
  cantidad: integer("cantidad").notNull(),
  precioUnitarioSnapshot: numeric("precio_unitario_snapshot", {
    precision: 12,
    scale: 2,
  }).notNull(),
  costoUnitarioSnapshot: numeric("costo_unitario_snapshot", {
    precision: 12,
    scale: 2,
  }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
});

// Tipos inferidos para usar en servicios y UI.
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type SaleMayorista = typeof salesMayorista.$inferSelect;
export type NewSaleMayorista = typeof salesMayorista.$inferInsert;
export type SaleItemMayorista = typeof saleItemsMayorista.$inferSelect;
export type NewSaleItemMayorista = typeof saleItemsMayorista.$inferInsert;
export type MetodoPago = (typeof metodoPagoEnum.enumValues)[number];
