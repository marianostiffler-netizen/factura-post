"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DiaSemana, SerieDia } from "@/lib/analytics";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getSerieDiariaRangoAction,
  getSerieDiariaRangoMayoristaAction,
  getKpisRangoAction,
  getKpisRangoMayoristaAction,
} from "./actions";
import type { Kpis } from "@/lib/analytics";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
} as const;

function fmtDiaCorto(dia: string) {
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

function fmtDiaLargo(dia: string) {
  const [year, month, day] = dia.split("-");
  return `${day}/${month}/${year}`;
}

function fmtMesLargo(mes: string): string {
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const index = parseInt(mes, 10) - 1;
  return meses[index] || mes;
}

function fmtRangoFechas(inicio: string, fin: string, viewMode: ViewMode): string {
  if (viewMode === "mensual") {
    const [year, month] = inicio.split("-");
    return `${fmtMesLargo(month)} ${year}`;
  }
  return `${fmtDiaLargo(inicio)} - ${fmtDiaLargo(fin)}`;
}

function fmtAxisMoneda(v: number) {
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${v}`;
}

export function VentasChart({ data }: { data: SerieDia[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="2 4"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="dia"
          tickFormatter={fmtDiaCorto}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
          minTickGap={16}
        />
        <YAxis
          tickFormatter={fmtAxisMoneda}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            name === "total" ? "Facturado" : "Ganancia",
          ]}
          labelFormatter={(label) => fmtDiaCorto(String(label))}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 12,
            fontSize: 12,
            boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
          itemStyle={{ color: "hsl(var(--popover-foreground))" }}
        />
        <Bar
          dataKey="total"
          name="total"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          maxBarSize={26}
        />
        <Line
          dataKey="ganancia"
          name="ganancia"
          type="monotone"
          stroke="hsl(var(--foreground))"
          strokeWidth={1.5}
          strokeOpacity={0.55}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

type BarraItem = { label: string; value: number };

/**
 * Barras horizontales reutilizables (ideal para nombres largos).
 * `moneda` formatea los valores como pesos; si no, se muestran como número.
 */
export function BarrasHorizontales({
  data,
  moneda = false,
  unidad,
}: {
  data: BarraItem[];
  moneda?: boolean;
  unidad?: string;
}) {
  const fmt = (v: number) =>
    moneda ? formatCurrency(v) : `${v}${unidad ? ` ${unidad}` : ""}`;
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          horizontal={false}
          stroke="hsl(var(--border))"
          strokeDasharray="2 4"
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => (moneda ? `$${Math.round(v / 1000)}k` : `${v}`)}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={130}
          tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          formatter={(v) => [fmt(Number(v)), ""]}
          separator=""
          contentStyle={tooltipStyle}
          itemStyle={{ color: "hsl(var(--popover-foreground))" }}
        />
        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Ventas por día de la semana (barras verticales, los 7 días). */
export function DiaSemanaChart({ data }: { data: DiaSemana[] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 0);
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="dia"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
          formatter={(v) => [formatCurrency(Number(v)), "Facturado"]}
          contentStyle={tooltipStyle}
          labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
          itemStyle={{ color: "hsl(var(--popover-foreground))" }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((d) => (
            <Cell
              key={d.dow}
              fill="hsl(var(--primary))"
              fillOpacity={maxTotal > 0 && d.total === maxTotal ? 1 : 0.45}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ───────────────────────── NUEVO COMPONENTE CON CONTROLES ─────────────────────────

type ViewMode = "diario" | "mensual";

/**
 * Agrupa datos diarios por mes para visualización mensual.
 * NO modifica los cálculos, solo agrupa los datos existentes.
 */
function agruparPorMes(data: SerieDia[]): SerieDia[] {
  const agrupado = new Map<string, { total: number; ganancia: number; ventas: number }>();

  for (const item of data) {
    const [, mes] = item.dia.split("-");
    const claveMes = mes; // Solo el mes (ej: "01", "02", etc.)

    const existente = agrupado.get(claveMes) || { total: 0, ganancia: 0, ventas: 0 };
    existente.total += item.total;
    existente.ganancia += item.ganancia;
    existente.ventas += item.ventas;
    agrupado.set(claveMes, existente);
  }

  // Convertir a array y ordenar por mes
  return Array.from(agrupado.entries())
    .map(([mes, valores]) => ({
      dia: mes, // Usar el mes como etiqueta
      total: valores.total,
      ganancia: valores.ganancia,
      ventas: valores.ventas,
    }))
    .sort((a, b) => a.dia.localeCompare(b.dia));
}

/**
 * Formateador para etiquetas mensuales (ej: "01" -> "Ene", "02" -> "Feb", etc.)
 */
function fmtMesCorto(mes: string): string {
  const meses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];
  const index = parseInt(mes, 10) - 1;
  return meses[index] || mes;
}

/**
 * Componente con controles para el gráfico de ventas.
 * Permite cambiar entre vista diaria/mensual y navegar en el historial.
 * NO modifica el componente VentasChart existente, solo lo envuelve.
 */
export function VentasChartWithControls({
  esMayorista = false,
}: {
  esMayorista?: boolean;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("diario");
  const [data, setData] = useState<SerieDia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rangoActual, setRangoActual] = useState<{
    inicio: string;
    fin: string;
  } | null>(null);
  const [kpisRango, setKpisRango] = useState<Kpis | null>(null);

  // Calcular el rango inicial basado en el mes calendario actual completo
  const calcularRangoInicial = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = hoy.getMonth();

    // Primer día del mes actual
    const inicio = new Date(year, month, 1);
    // Último día del mes actual
    const fin = new Date(year, month + 1, 0);

    return {
      inicio: inicio.toISOString().split("T")[0],
      fin: fin.toISOString().split("T")[0],
    };
  };

  // Navegar al período anterior (mes calendario completo)
  const navegarAnterior = async () => {
    if (!rangoActual || isLoading) return;

    setIsLoading(true);
    try {
      const inicio = new Date(rangoActual.inicio);
      const year = inicio.getFullYear();
      const month = inicio.getMonth();

      // Mes anterior completo (basado siempre desde día 1)
      const nuevoInicio = new Date(year, month - 1, 1);
      const nuevoFin = new Date(year, month, 0);

      const inicioStr = nuevoInicio.toISOString().split("T")[0];
      const finStr = nuevoFin.toISOString().split("T")[0];

      const action = esMayorista
        ? getSerieDiariaRangoMayoristaAction
        : getSerieDiariaRangoAction;

      const kpisAction = esMayorista
        ? getKpisRangoMayoristaAction
        : getKpisRangoAction;

      const [nuevosDatos, nuevosKpis] = await Promise.all([
        action(inicioStr, finStr),
        kpisAction(inicioStr, finStr),
      ]);

      setData(nuevosDatos);
      setRangoActual({ inicio: inicioStr, fin: finStr });
      setKpisRango(nuevosKpis);
    } catch (error) {
      console.error("Error al navegar al período anterior:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navegar al período siguiente (mes calendario completo)
  const navegarSiguiente = async () => {
    if (!rangoActual || isLoading) return;

    setIsLoading(true);
    try {
      const inicio = new Date(rangoActual.inicio);
      const year = inicio.getFullYear();
      const month = inicio.getMonth();

      // Mes siguiente completo (basado siempre desde día 1)
      const nuevoInicio = new Date(year, month + 1, 1);
      const nuevoFin = new Date(year, month + 2, 0);

      const inicioStr = nuevoInicio.toISOString().split("T")[0];
      const finStr = nuevoFin.toISOString().split("T")[0];

      const action = esMayorista
        ? getSerieDiariaRangoMayoristaAction
        : getSerieDiariaRangoAction;

      const kpisAction = esMayorista
        ? getKpisRangoMayoristaAction
        : getKpisRangoAction;

      const [nuevosDatos, nuevosKpis] = await Promise.all([
        action(inicioStr, finStr),
        kpisAction(inicioStr, finStr),
      ]);

      setData(nuevosDatos);
      setRangoActual({ inicio: inicioStr, fin: finStr });
      setKpisRango(nuevosKpis);
    } catch (error) {
      console.error("Error al navegar al período siguiente:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar el rango y cargar datos del mes calendario actual
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const cargarMesActual = async () => {
      const rango = calcularRangoInicial();
      if (!rango) return;

      setIsLoading(true);
      try {
        const action = esMayorista
          ? getSerieDiariaRangoMayoristaAction
          : getSerieDiariaRangoAction;

        const kpisAction = esMayorista
          ? getKpisRangoMayoristaAction
          : getKpisRangoAction;

        const [datos, kpis] = await Promise.all([
          action(rango.inicio, rango.fin),
          kpisAction(rango.inicio, rango.fin),
        ]);

        setData(datos);
        setRangoActual(rango);
        setKpisRango(kpis);
      } catch (error) {
        console.error("Error al cargar datos del mes actual:", error);
      } finally {
        setIsLoading(false);
      }
    };

    cargarMesActual();
  }, []);

  // Verificar si estamos en el período actual (mes calendario actual)
  const esPeriodoActual = () => {
    if (!rangoActual) return false;
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = hoy.getMonth();

    // Primer y último día del mes actual
    const inicioMesActual = new Date(year, month, 1).toISOString().split("T")[0];
    const finMesActual = new Date(year, month + 1, 0).toISOString().split("T")[0];

    // Solo deshabilitar si estamos exactamente en el mes calendario actual
    return rangoActual.inicio === inicioMesActual;
  };

  // Determinar qué datos mostrar según el modo de vista
  const datosAMostrar = viewMode === "mensual" ? agruparPorMes(data) : data;

  // Formateador según el modo
  const tickFormatter = viewMode === "mensual" ? fmtMesCorto : fmtDiaCorto;

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diario">Diario</SelectItem>
              <SelectItem value="mensual">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={navegarAnterior}
            disabled={isLoading}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={navegarSiguiente}
            disabled={isLoading || esPeriodoActual()}
          >
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Rango de fechas */}
      {rangoActual && (
        <div className="text-sm text-muted-foreground">
          {fmtRangoFechas(rangoActual.inicio, rangoActual.fin, viewMode)}
        </div>
      )}

      {/* KPIs del rango actual */}
      {kpisRango && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Total del período
            </p>
            <p className="mt-1 font-serif text-lg font-medium tabular-nums">
              {formatCurrency(kpisRango.facturacion)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {kpisRango.ventas} {kpisRango.ventas === 1 ? "venta" : "ventas"}
            </p>
          </div>
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
              Ganancia del período
            </p>
            <p className="mt-1 font-serif text-lg font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(kpisRango.ganancia)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Margen {formatPercent(kpisRango.margenPct)}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico */}
      {isLoading ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Cargando...
        </div>
      ) : datosAMostrar.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          No hay datos en este período.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={datosAMostrar} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="dia"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={fmtAxisMoneda}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === "total" ? "Facturado" : "Ganancia",
              ]}
              labelFormatter={(label) => tickFormatter(String(label))}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
                boxShadow: "0 4px 16px rgb(0 0 0 / 0.08)",
              }}
              labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
              itemStyle={{ color: "hsl(var(--popover-foreground))" }}
            />
            <Bar
              dataKey="total"
              name="total"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={26}
            />
            <Line
              dataKey="ganancia"
              name="ganancia"
              type="monotone"
              stroke="hsl(var(--foreground))"
              strokeWidth={1.5}
              strokeOpacity={0.55}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Tabla de datos */}
      {!isLoading && datosAMostrar.length > 0 && (
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[0.7rem] uppercase tracking-wider">
                  {viewMode === "diario" ? "Fecha" : "Mes"}
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
              {datosAMostrar.map((item) => (
                <TableRow key={item.dia}>
                  <TableCell className="font-medium">
                    {viewMode === "diario" ? fmtDiaLargo(item.dia) : fmtMesLargo(item.dia)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {item.ventas}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
