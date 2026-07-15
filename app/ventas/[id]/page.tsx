import Link from "next/link";
import { notFound } from "next/navigation";

import {
  comprobanteNro,
  getSaleById,
  METODO_LABEL,
} from "@/lib/sales";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, fmtFechaAR } from "@/lib/utils";
import { FacturaActions } from "./factura-actions";

export const dynamic = "force-dynamic";

function fmtFecha(d: Date) {
  return fmtFechaAR(d, { dateStyle: "long", timeStyle: "short" });
}

/** Formatea "YYYY-MM-DD" como fecha local sin corrimiento de zona horaria. */
function fmtDia(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(
    new Date(y, m - 1, d),
  );
}

export default async function FacturaPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getSaleById(params.id);
  if (!data) notFound();

  const { sale, items } = data;
  const comercio = {
    nombre: process.env.NEXT_PUBLIC_COMERCIO_NOMBRE || "Mi Comercio",
    direccion: process.env.NEXT_PUBLIC_COMERCIO_DIRECCION || "",
    cuit: process.env.NEXT_PUBLIC_COMERCIO_CUIT || "",
  };

  return (
    <main className="mx-auto max-w-3xl p-4 sm:p-6">
      <PageHeader title="Factura" description={comprobanteNro(sale)} backHref="/ventas">
        <FacturaActions filename={`factura-${comprobanteNro(sale)}`} />
      </PageHeader>

      <article
        id="factura-doc"
        className="rounded-lg border bg-white p-6 text-zinc-900 shadow-sm print:border-0 print:shadow-none"
      >
        {/* Encabezado */}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold">{comercio.nombre}</h2>
            {comercio.direccion ? (
              <p className="text-sm text-muted-foreground">{comercio.direccion}</p>
            ) : null}
            {comercio.cuit ? (
              <p className="text-sm text-muted-foreground">CUIT: {comercio.cuit}</p>
            ) : null}
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Comprobante</p>
            <p className="font-mono">{comprobanteNro(sale)}</p>
            <p className="mt-1 text-muted-foreground">{fmtFecha(sale.fecha)}</p>
            <p className="text-muted-foreground">
              Pago: {METODO_LABEL[sale.metodoPago]}
            </p>
          </div>
        </header>

        {/* Cliente / entrega (solo si se cargaron datos) */}
        {(sale.clienteNombre ||
          sale.clienteApellido ||
          sale.clienteDireccion ||
          sale.diaEntrega) && (
          <section className="grid gap-4 border-b py-4 text-sm sm:grid-cols-2">
            {(sale.clienteNombre ||
              sale.clienteApellido ||
              sale.clienteDireccion) && (
              <div>
                <p className="font-semibold">Cliente</p>
                {(sale.clienteNombre || sale.clienteApellido) && (
                  <p>
                    {[sale.clienteNombre, sale.clienteApellido]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                )}
                {sale.clienteDireccion && (
                  <p className="text-muted-foreground">{sale.clienteDireccion}</p>
                )}
              </div>
            )}
            {sale.diaEntrega && (
              <div className="sm:text-right">
                <p className="font-semibold">Día de entrega</p>
                <p>{fmtDia(sale.diaEntrega)}</p>
              </div>
            )}
          </section>
        )}

        {/* Detalle */}
        <Table className="my-4">
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-center">Cant.</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.nombreSnapshot}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {it.cantidad}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(it.precioUnitarioSnapshot)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(it.subtotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Total */}
        <div className="flex justify-end border-t pt-4">
          <div className="w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">{formatCurrency(sale.total)}</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Comprobante interno · no válido como factura fiscal (AFIP).
        </p>
      </article>

      <div className="mt-4 flex justify-center gap-3 print:hidden">
        <Link
          href="/pos"
          className="text-sm font-medium text-primary hover:underline"
        >
          Nueva venta
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link
          href="/ventas"
          className="text-sm font-medium text-primary hover:underline"
        >
          Ver todas las ventas
        </Link>
      </div>
    </main>
  );
}
