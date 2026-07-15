"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { PosProduct } from "@/lib/products";
import type { MetodoPago } from "@/db/schema";
import type { CheckoutInput, CheckoutResult } from "./actions";

type CheckoutFn = (input: CheckoutInput) => Promise<CheckoutResult>;

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "transferencia", label: "Transferencia" },
  { value: "qr", label: "QR" },
  { value: "otro", label: "Otro" },
];

type CartLine = { product: PosProduct; cantidad: number };

export function PosClient({
  productos,
  checkoutAction,
  ventaPathPrefix = "/ventas",
}: {
  productos: PosProduct[];
  checkoutAction: CheckoutFn;
  /** A dónde redirigir tras la venta (factura). Ej: "/ventas" o "/ventas-mayorista". */
  ventaPathPrefix?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [cart, setCart] = React.useState<Map<string, CartLine>>(new Map());
  const [metodoPago, setMetodoPago] = React.useState<MetodoPago>("efectivo");
  const [cliente, setCliente] = React.useState({
    nombre: "",
    apellido: "",
    direccion: "",
    diaEntrega: "",
  });
  const [pending, startTransition] = React.useTransition();

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return productos;
    return productos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q),
    );
  }, [productos, query]);

  function addToCart(product: PosProduct) {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      next.set(product.id, {
        product,
        cantidad: (existing?.cantidad ?? 0) + 1,
      });
      return next;
    });
  }

  function setQty(id: string, cantidad: number) {
    setCart((prev) => {
      const next = new Map(prev);
      const line = next.get(id);
      if (!line) return prev;
      if (cantidad <= 0) next.delete(id);
      else next.set(id, { ...line, cantidad });
      return next;
    });
  }

  const lines = Array.from(cart.values());
  const total = lines.reduce(
    (acc, l) => acc + Number(l.product.precioVenta) * l.cantidad,
    0,
  );
  const totalItems = lines.reduce((acc, l) => acc + l.cantidad, 0);

  function onCheckout() {
    if (lines.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }
    startTransition(async () => {
      const res = await checkoutAction({
        metodoPago,
        cliente: {
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          direccion: cliente.direccion,
          diaEntrega: cliente.diaEntrega || null,
        },
        items: lines.map((l) => ({
          productId: l.product.id,
          cantidad: l.cantidad,
        })),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Venta registrada");
      router.push(`${ventaPathPrefix}/${res.saleId}`);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Catálogo */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto…"
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addToCart(p)}
              className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{p.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {p.presentacion ? `${p.presentacion} · ` : ""}
                  {p.categoria}
                </div>
              </div>
              <div className="ml-2 shrink-0 font-semibold tabular-nums">
                {formatCurrency(p.precioVenta)}
              </div>
            </button>
          ))}
          {filtered.length === 0 ? (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              Sin resultados.
            </p>
          ) : null}
        </div>
      </div>

      {/* Carrito */}
      <Card className="h-fit lg:sticky lg:top-4">
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <ShoppingCart className="size-5" /> Carrito
            </h2>
            {totalItems > 0 ? (
              <Badge variant="secondary">{totalItems} ítems</Badge>
            ) : null}
          </div>

          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Tocá un producto para agregarlo.
            </p>
          ) : (
            <ul className="space-y-2">
              {lines.map((l) => (
                <li key={l.product.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {l.product.nombre}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {formatCurrency(l.product.precioVenta)} c/u
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setQty(l.product.id, l.cantidad - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">
                      {l.cantidad}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      onClick={() => setQty(l.product.id, l.cantidad + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() => setQty(l.product.id, 0)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Método de pago</label>
            <Select
              value={metodoPago}
              onValueChange={(v) => setMetodoPago(v as MetodoPago)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <details className="rounded-md border px-3 py-2 [&_summary]:cursor-pointer">
            <summary className="text-sm font-medium text-muted-foreground">
              Datos del cliente (opcional)
            </summary>
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="cli-nombre" className="text-xs">
                    Nombre
                  </Label>
                  <Input
                    id="cli-nombre"
                    value={cliente.nombre}
                    onChange={(e) =>
                      setCliente((c) => ({ ...c, nombre: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cli-apellido" className="text-xs">
                    Apellido
                  </Label>
                  <Input
                    id="cli-apellido"
                    value={cliente.apellido}
                    onChange={(e) =>
                      setCliente((c) => ({ ...c, apellido: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cli-direccion" className="text-xs">
                  Dirección
                </Label>
                <Input
                  id="cli-direccion"
                  value={cliente.direccion}
                  onChange={(e) =>
                    setCliente((c) => ({ ...c, direccion: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cli-entrega" className="text-xs">
                  Día de entrega
                </Label>
                <Input
                  id="cli-entrega"
                  type="date"
                  value={cliente.diaEntrega}
                  onChange={(e) =>
                    setCliente((c) => ({ ...c, diaEntrega: e.target.value }))
                  }
                />
              </div>
            </div>
          </details>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-bold tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={pending || lines.length === 0}
            onClick={onCheckout}
          >
            {pending ? "Registrando…" : "Cobrar y facturar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
