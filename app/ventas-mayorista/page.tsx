import Link from "next/link";

import { getSalesMayorista, METODO_LABEL } from "@/lib/sales";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { DeleteSaleButton } from "@/app/ventas/delete-sale-button";
import { deleteSaleMayorista } from "./actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, fmtFechaAR, isSameDayAR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VentasMayoristaPage() {
  const ventas = await getSalesMayorista();
  const hoy = new Date();
  const totalDia = ventas
    .filter((v) => isSameDayAR(v.fecha, hoy))
    .reduce((a, v) => a + Number(v.total), 0);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <PageHeader
        title="Ventas mayoristas"
        description={`${ventas.length} ventas · hoy ${formatCurrency(totalDia)}`}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Ganancia</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Todavía no hay ventas mayoristas registradas.
                </TableCell>
              </TableRow>
            ) : (
              ventas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{fmtFechaAR(v.fecha)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{METODO_LABEL[v.metodoPago]}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatCurrency(v.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600">
                    {formatCurrency(v.totalGanancia)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/ventas-mayorista/${v.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ver factura
                      </Link>
                      <DeleteSaleButton saleId={v.id} onDelete={deleteSaleMayorista} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
