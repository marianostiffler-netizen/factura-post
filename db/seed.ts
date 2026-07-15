import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { products } from "./schema";
import { catalogo } from "./catalog";

/**
 * Carga el catálogo real en la tabla products.
 * Idempotente: limpia el catálogo antes de insertar.
 * Uso: `npm run db:seed`
 */
async function main() {
  console.log(`Sembrando ${catalogo.length} productos…`);
  await db.delete(products);
  await db.insert(products).values(catalogo);
  console.log(`✓ ${catalogo.length} productos insertados.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en el seed:", err);
  process.exit(1);
});
