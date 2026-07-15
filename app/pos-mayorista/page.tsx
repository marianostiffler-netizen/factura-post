import { getProductosMayoristasActivos } from "@/lib/products";
import { PageHeader } from "@/components/page-header";
import { PosClient } from "@/app/pos/pos-client";
import { checkoutMayorista } from "./actions";

export const dynamic = "force-dynamic";

export default async function PosMayoristaPage() {
  const productos = await getProductosMayoristasActivos();
  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="Punto de venta — Mayorista"
        description="Precios mayoristas. Las ventas se registran separadas de las minoristas."
      />
      <PosClient
        productos={productos}
        checkoutAction={checkoutMayorista}
        ventaPathPrefix="/ventas-mayorista"
      />
    </main>
  );
}
