"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { products } from "@/db/schema";

export type ActionState = { ok?: boolean; error?: string };

/** Convierte "1.234,56", "1234.56" o "1234" a string decimal válido, o null si vacío. */
function parseDecimal(value: FormDataEntryValue | null): string | null {
  if (value == null) return null;
  let raw = String(value).trim();
  if (raw === "") return null;
  if (raw.includes(",")) {
    // Formato es-AR: el punto es separador de miles y la coma, decimal.
    raw = raw.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(2);
}

const updateSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1, "El nombre es obligatorio"),
  categoria: z.string().min(1),
  precioVenta: z.string().regex(/^\d+(\.\d{1,2})?$/, "Precio inválido"),
  precioMayorista: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable(),
  costo: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable(),
  stock: z.number().int().nullable(),
  activo: z.boolean(),
});

export async function updateProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const stockRaw = formData.get("stock");
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    nombre: String(formData.get("nombre") ?? "").trim(),
    categoria: String(formData.get("categoria") ?? "General").trim() || "General",
    precioVenta: parseDecimal(formData.get("precioVenta")) ?? "",
    precioMayorista: parseDecimal(formData.get("precioMayorista")),
    costo: parseDecimal(formData.get("costo")),
    stock:
      stockRaw == null || String(stockRaw).trim() === ""
        ? null
        : Number.parseInt(String(stockRaw), 10),
    activo: formData.get("activo") === "on" || formData.get("activo") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { id, ...data } = parsed.data;
  await db
    .update(products)
    .set({
      nombre: data.nombre,
      categoria: data.categoria,
      precioVenta: data.precioVenta,
      precioMayorista: data.precioMayorista,
      costo: data.costo,
      stock: Number.isFinite(data.stock as number) ? data.stock : null,
      activo: data.activo,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/productos");
  revalidatePath("/pos");
  revalidatePath("/pos-mayorista");
  return { ok: true };
}

const createSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  presentacion: z.string().nullable(),
  categoria: z.string().min(1),
  precioVenta: z.string().regex(/^\d+(\.\d{1,2})?$/, "Precio inválido"),
  precioMayorista: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable(),
  costo: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable(),
  stock: z.number().int().nullable(),
});

export async function createProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const stockRaw = formData.get("stock");
  const presentacion = String(formData.get("presentacion") ?? "").trim();
  const parsed = createSchema.safeParse({
    nombre: String(formData.get("nombre") ?? "").trim(),
    presentacion: presentacion === "" ? null : presentacion,
    categoria: String(formData.get("categoria") ?? "General").trim() || "General",
    precioVenta: parseDecimal(formData.get("precioVenta")) ?? "",
    precioMayorista: parseDecimal(formData.get("precioMayorista")),
    costo: parseDecimal(formData.get("costo")),
    stock:
      stockRaw == null || String(stockRaw).trim() === ""
        ? null
        : Number.parseInt(String(stockRaw), 10),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await db.insert(products).values({
    nombre: parsed.data.nombre,
    presentacion: parsed.data.presentacion,
    categoria: parsed.data.categoria,
    precioVenta: parsed.data.precioVenta,
    precioMayorista: parsed.data.precioMayorista,
    costo: parsed.data.costo,
    stock: parsed.data.stock,
  });

  revalidatePath("/productos");
  revalidatePath("/pos");
  revalidatePath("/pos-mayorista");
  return { ok: true };
}

export async function toggleProductActivo(
  id: string,
  activo: boolean,
): Promise<ActionState> {
  await db
    .update(products)
    .set({ activo, updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidatePath("/productos");
  revalidatePath("/pos");
  return { ok: true };
}
