"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { sales } from "@/db/schema";

/**
 * Elimina una venta y todos sus renglones (ON DELETE CASCADE lo maneja la DB).
 * Revalida la lista de ventas para refrescar la UI automáticamente.
 */
export async function deleteSale(id: string): Promise<void> {
  await db.delete(sales).where(eq(sales.id, id));
  revalidatePath("/ventas");
}
