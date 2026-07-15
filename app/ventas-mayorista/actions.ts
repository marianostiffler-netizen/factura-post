"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { salesMayorista } from "@/db/schema";

/**
 * Elimina una venta MAYORISTA y sus renglones (ON DELETE CASCADE en la DB).
 * Revalida la lista de ventas mayoristas.
 */
export async function deleteSaleMayorista(id: string): Promise<void> {
  await db.delete(salesMayorista).where(eq(salesMayorista.id, id));
  revalidatePath("/ventas-mayorista");
  revalidatePath("/dashboard");
}
