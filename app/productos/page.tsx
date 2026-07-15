import { getCategorias, getProducts } from "@/lib/products";
import { PageHeader } from "@/components/page-header";
import { ProductsTable } from "./products-table";

export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const [productos, categorias] = await Promise.all([
    getProducts(),
    getCategorias(),
  ]);

  const sinCosto = productos.filter((p) => p.costo == null).length;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Productos"
        description={`${productos.length} productos · ${sinCosto} sin costo cargado`}
      />
      <ProductsTable productos={productos} categorias={categorias} />
    </main>
  );
}
