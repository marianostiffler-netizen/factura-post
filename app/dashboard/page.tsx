import Link from "next/link";
import {
  Package,
  Receipt,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  getComparativaSemanal,
  getComparativaSemanalMayorista,
  getKpis,
  getKpisMayorista,
  getMargenPorCategoria,
  getPorMetodo,
  getPorMetodoMayorista,
  getSerieDiaria,
  getSerieDiariaMayorista,
  getTopClientes,
  getTopProductos,
  getTopProductosMayorista,
  getTopProductosUnidades,
  getVentasPorCategoria,
  getVentasPorCategoriaMayorista,
  getVentasPorDiaSemana,
} from "@/lib/analytics";
import { METODO_LABEL } from "@/lib/sales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Boxes, Store } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import { BarrasHorizontales, DiaSemanaChart, VentasChart, VentasChartWithControls } from "./charts";

export const dynamic = "force-dynamic";

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card">
      <div className="border-b px-6 py-5">
        {eyebrow ? (
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-serif text-lg font-medium tracking-tight">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export default async function DashboardPage() {
  const [
    kpis,
    serie,
    porMetodo,
    top,
    comparativa,
    topUnidades,
    porCategoria,
    margenCategoria,
    topClientes,
    diaSemana,
  ] = await Promise.all([
    getKpis(),
    getSerieDiaria(30),
    getPorMetodo(),
    getTopProductos(10),
    getComparativaSemanal(),
    getTopProductosUnidades(8),
    getVentasPorCategoria(),
    getMargenPorCategoria(),
    getTopClientes(8),
    getVentasPorDiaSemana(),
  ]);

  // Analítica MAYORISTA, totalmente separada (otras tablas).
  const [
    kpisMay,
    serieMay,
    topMay,
    porMetodoMay,
    porCategoriaMay,
    comparativaMay,
  ] = await Promise.all([
    getKpisMayorista(),
    getSerieDiariaMayorista(30),
    getTopProductosMayorista(10),
    getPorMetodoMayorista(),
    getVentasPorCategoriaMayorista(),
    getComparativaSemanalMayorista(),
  ]);

  const maxCategoria = Math.max(...porCategoria.map((c) => c.total), 0);
  const maxCategoriaMay = Math.max(...porCategoriaMay.map((c) => c.total), 0);

  const comercio = process.env.NEXT_PUBLIC_COMERCIO_NOMBRE || "factura-pos";

  const statsMay = [
    { label: "Facturación total", value: formatCurrency(kpisMay.facturacion), hint: `${kpisMay.ventas} ${kpisMay.ventas === 1 ? "venta" : "ventas"}` },
    { label: "Ganancia total", value: formatCurrency(kpisMay.ganancia), hint: `Margen ${formatPercent(kpisMay.margenPct)} s/ venta` },
    { label: "Ticket promedio", value: formatCurrency(kpisMay.ticketPromedio), hint: "Por venta" },
    { label: "Margen %", value: formatPercent(kpisMay.margenPct), hint: "Ganancia s/ facturación" },
  ];

  const stats = [
    {
      label: "Facturación total",
      value: formatCurrency(kpis.facturacion),
      hint: `${kpis.ventas} ${kpis.ventas === 1 ? "venta" : "ventas"}`,
    },
    {
      label: "Ganancia total",
      value: formatCurrency(kpis.ganancia),
      hint: `Margen ${formatPercent(kpis.margenPct)} s/ venta`,
    },
    {
      label: "Ticket promedio",
      value: formatCurrency(kpis.ticketPromedio),
      hint: "Por venta",
    },
    {
      label: "Costo de mercadería",
      value: formatCurrency(kpis.costo),
      hint: "Acumulado",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
      {/* Encabezado */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {comercio}
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Resumen del negocio
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Ventas, rentabilidad y movimiento de los últimos 30 días.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/productos">
              <Package className="size-4" /> Productos
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Accesos: Minorista vs Mayorista, claramente diferenciados */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Store className="size-4 text-primary" />
            <h2 className="font-serif text-base font-medium">Minorista</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/pos">
                <ShoppingCart className="size-4" /> Vender
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/ventas">
                <Receipt className="size-4" /> Ventas
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Boxes className="size-4 text-primary" />
            <h2 className="font-serif text-base font-medium">Mayorista</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/pos-mayorista">
                <ShoppingCart className="size-4" /> Vender mayorista
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/ventas-mayorista">
                <Receipt className="size-4" /> Ventas mayoristas
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs: un solo panel con divisores hairline */}
      <dl className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-6">
            <dt className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {s.label}
            </dt>
            <dd className="mt-3 font-serif text-3xl font-medium tracking-tight tabular-nums">
              {s.value}
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">{s.hint}</dd>
          </div>
        ))}
      </dl>

      {/* Comparativa semanal */}
      <div className="mb-10">
        <Panel eyebrow="Tendencia" title="Esta semana vs. la anterior">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Esta semana
              </p>
              <p className="mt-2 font-serif text-3xl font-medium tabular-nums">
                {formatCurrency(comparativa.actual)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {comparativa.ventasActual}{" "}
                {comparativa.ventasActual === 1 ? "venta" : "ventas"}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Semana anterior
              </p>
              <p className="mt-2 font-serif text-3xl font-medium tabular-nums text-muted-foreground">
                {formatCurrency(comparativa.anterior)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {comparativa.ventasAnterior}{" "}
                {comparativa.ventasAnterior === 1 ? "venta" : "ventas"}
              </p>
            </div>
            <div className="flex items-center sm:justify-end">
              {comparativa.deltaPct === null ? (
                <Badge variant="outline">Sin base de comparación</Badge>
              ) : (
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                    comparativa.deltaPct >= 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {comparativa.deltaPct >= 0 ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  {comparativa.deltaPct >= 0 ? "+" : ""}
                  {formatPercent(comparativa.deltaPct)}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* Gráfico */}
      <div className="mb-10">
        <Panel eyebrow="Últimos 30 días" title="Ventas y ganancia">
          {serie.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Todavía no hay ventas en el período.
            </p>
          ) : (
            <VentasChartWithControls initialData={serie} />
          )}
        </Panel>
      </div>

      {/* Productos por unidades · Ventas por categoría */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Volumen" title="Más vendidos (unidades)">
          {topUnidades.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <BarrasHorizontales
              data={topUnidades.map((p) => ({
                label: p.nombre,
                value: p.unidades,
              }))}
              unidad="u"
            />
          )}
        </Panel>

        <Panel eyebrow="Mix" title="Ventas por categoría">
          {porCategoria.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <div className="space-y-4">
              <BarrasHorizontales
                data={porCategoria.map((c) => ({
                  label: c.categoria,
                  value: c.total,
                }))}
                moneda
              />
              <div className="space-y-2 border-t pt-3">
                {porCategoria.map((c) => (
                  <div
                    key={c.categoria}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{c.categoria}</span>
                    <span className="tabular-nums">
                      {maxCategoria > 0
                        ? formatPercent((c.total / maxCategoria) * 100, 0)
                        : "0%"}{" "}
                      · {c.unidades} u
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* Día de la semana · Margen por categoría */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Patrón" title="Ventas por día de la semana">
          {diaSemana.every((d) => d.total === 0) ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <DiaSemanaChart data={diaSemana} />
          )}
        </Panel>

        <Panel eyebrow="Rentabilidad" title="Margen promedio por categoría">
          {margenCategoria.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[0.7rem] uppercase tracking-wider">
                    Categoría
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Facturado
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Margen
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {margenCategoria.map((c) => (
                  <TableRow key={c.categoria}>
                    <TableCell className="font-medium">{c.categoria}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(c.facturado)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          c.margenPct <= 0
                            ? "destructive"
                            : c.margenPct < 20
                              ? "warning"
                              : "success"
                        }
                      >
                        {formatPercent(c.margenPct)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>

      {/* Top clientes · Por método de pago */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Clientes" title="Quiénes más compran">
          {topClientes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Todavía no se cargaron datos de clientes en las ventas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[0.7rem] uppercase tracking-wider">
                    Cliente
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Compras
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Total gastado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topClientes.map((c) => (
                  <TableRow key={c.cliente}>
                    <TableCell className="font-medium">{c.cliente}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {c.compras}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(c.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>

        <Panel eyebrow="Distribución" title="Por método de pago">
          {porMetodo.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[0.7rem] uppercase tracking-wider">
                    Método
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Ventas
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porMetodo.map((m) => (
                  <TableRow key={m.metodoPago}>
                    <TableCell className="font-medium">
                      {METODO_LABEL[m.metodoPago]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {m.ventas}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(m.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>

      {/* Top productos por facturación */}
      <Panel eyebrow="Ranking" title="Top productos por facturación">
        {top.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sin datos.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[0.7rem] uppercase tracking-wider">
                  Producto
                </TableHead>
                <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                  Cant.
                </TableHead>
                <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                  Facturado
                </TableHead>
                <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                  Ganancia
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((p) => (
                <TableRow key={p.nombre}>
                  <TableCell className="max-w-[220px] truncate font-medium">
                    {p.nombre}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {p.cantidad}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.total)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.ganancia)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      {/* ───────────────────────── MAYORISTA ───────────────────────── */}
      <div className="mt-14 mb-8 flex items-center gap-3">
        <Boxes className="size-5 text-primary" />
        <h2 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">
          Analítica mayorista
        </h2>
        <span className="rounded-full border px-2.5 py-0.5 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
          Separado de minorista
        </span>
      </div>

      <dl className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
        {statsMay.map((s) => (
          <div key={s.label} className="bg-card p-6">
            <dt className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {s.label}
            </dt>
            <dd className="mt-3 font-serif text-3xl font-medium tracking-tight tabular-nums">
              {s.value}
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">{s.hint}</dd>
          </div>
        ))}
      </dl>

      {/* Comparativa semanal mayorista */}
      <div className="mb-10">
        <Panel eyebrow="Mayorista · Tendencia" title="Esta semana vs. la anterior">
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Esta semana
              </p>
              <p className="mt-2 font-serif text-3xl font-medium tabular-nums">
                {formatCurrency(comparativaMay.actual)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {comparativaMay.ventasActual}{" "}
                {comparativaMay.ventasActual === 1 ? "venta" : "ventas"}
              </p>
            </div>
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Semana anterior
              </p>
              <p className="mt-2 font-serif text-3xl font-medium tabular-nums text-muted-foreground">
                {formatCurrency(comparativaMay.anterior)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {comparativaMay.ventasAnterior}{" "}
                {comparativaMay.ventasAnterior === 1 ? "venta" : "ventas"}
              </p>
            </div>
            <div className="flex items-center sm:justify-end">
              {comparativaMay.deltaPct === null ? (
                <Badge variant="outline">Sin base de comparación</Badge>
              ) : (
                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                    comparativaMay.deltaPct >= 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {comparativaMay.deltaPct >= 0 ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}
                  {comparativaMay.deltaPct >= 0 ? "+" : ""}
                  {formatPercent(comparativaMay.deltaPct)}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* Serie diaria mayorista */}
      <div className="mb-10">
        <Panel eyebrow="Mayorista · últimos 30 días" title="Ventas y ganancia">
          {serieMay.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Todavía no hay ventas mayoristas en el período.
            </p>
          ) : (
            <VentasChartWithControls initialData={serieMay} esMayorista />
          )}
        </Panel>
      </div>

      {/* Por categoría · Por método de pago (mayorista) */}
      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <Panel eyebrow="Mayorista · Mix" title="Ventas por categoría">
          {porCategoriaMay.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <div className="space-y-4">
              <BarrasHorizontales
                data={porCategoriaMay.map((c) => ({
                  label: c.categoria,
                  value: c.total,
                }))}
                moneda
              />
              <div className="space-y-2 border-t pt-3">
                {porCategoriaMay.map((c) => (
                  <div
                    key={c.categoria}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{c.categoria}</span>
                    <span className="tabular-nums">
                      {maxCategoriaMay > 0
                        ? formatPercent((c.total / maxCategoriaMay) * 100, 0)
                        : "0%"}{" "}
                      · {c.unidades} u
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel eyebrow="Mayorista · Distribución" title="Por método de pago">
          {porMetodoMay.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[0.7rem] uppercase tracking-wider">
                    Método
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Ventas
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {porMetodoMay.map((m) => (
                  <TableRow key={m.metodoPago}>
                    <TableCell className="font-medium">
                      {METODO_LABEL[m.metodoPago]}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {m.ventas}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(m.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
      </div>

      {/* Top 10 productos por rentabilidad (mayorista) */}
      <Panel eyebrow="Mayorista · Ranking" title="Top 10 productos por rentabilidad">
        {topMay.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sin datos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[0.7rem] uppercase tracking-wider">
                    Producto
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Cant.
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Facturado
                  </TableHead>
                  <TableHead className="text-right text-[0.7rem] uppercase tracking-wider">
                    Ganancia
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topMay.map((p) => (
                  <TableRow key={p.nombre}>
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {p.nombre}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.cantidad}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(p.total)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.ganancia)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Panel>
    </main>
  );
}
