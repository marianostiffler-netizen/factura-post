import { getProductosActivos } from "@/lib/products";
import { PageHeader } from "@/components/page-header";
import { PosClient } from "./pos-client";
import { checkout } from "./actions";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const productos = await getProductosActivos();
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Punto de venta"
        description="Buscá productos, armá el carrito y registrá la venta"
      />
      <PosClient
        productos={productos}
        checkoutAction={checkout}
        ventaPathPrefix="/ventas"
      />
    </main>
  );
}
