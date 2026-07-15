"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { ProductRow } from "@/lib/products";
import { createProduct, updateProduct, type ActionState } from "./actions";

const TODAS = "__todas__";

function MargenBadge({ margenPct }: { margenPct: string | null }) {
  if (margenPct == null) {
    return <Badge variant="outline">sin costo</Badge>;
  }
  const n = Number(margenPct);
  const variant = n <= 0 ? "destructive" : n < 20 ? "warning" : "success";
  return <Badge variant={variant}>{formatPercent(n)}</Badge>;
}

export function ProductsTable({
  productos,
  categorias,
}: {
  productos: ProductRow[];
  categorias: string[];
}) {
  const [query, setQuery] = React.useState("");
  const [cat, setCat] = React.useState<string>(TODAS);
  const [editing, setEditing] = React.useState<ProductRow | null>(null);
  const [creating, setCreating] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos.filter((p) => {
      const matchQ =
        q === "" ||
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q);
      const matchCat = cat === TODAS || p.categoria === cat;
      return matchQ && matchCat;
    });
  }, [productos, query, cat]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o categoría…"
            className="pl-9"
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Nuevo
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Margen minorista</TableHead>
              <TableHead className="text-right">Margen mayorista</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No hay productos que coincidan.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.nombre}</div>
                    {p.presentacion ? (
                      <div className="text-xs text-muted-foreground">
                        {p.presentacion}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.categoria}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(p.precioVenta)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {p.costo == null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      formatCurrency(p.costo)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <MargenBadge margenPct={p.margenPct} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MargenBadge margenPct={p.margenMayoristaPct} />
                  </TableCell>
                  <TableCell className="text-center">
                    {p.activo ? (
                      <Badge variant="secondary">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(p)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editing ? (
        <ProductDialog
          key={editing.id}
          product={editing}
          categorias={categorias}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {creating ? (
        <ProductDialog
          key="new"
          categorias={categorias}
          onClose={() => setCreating(false)}
        />
      ) : null}
    </div>
  );
}

function ProductDialog({
  product,
  categorias,
  onClose,
}: {
  product?: ProductRow;
  categorias: string[];
  onClose: () => void;
}) {
  const isEdit = Boolean(product);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const action: (p: ActionState, f: FormData) => Promise<ActionState> =
        isEdit ? updateProduct : createProduct;
      const res = await action({}, formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(isEdit ? "Producto actualizado" : "Producto creado");
        onClose();
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar producto" : "Nuevo producto"}</DialogTitle>
          <DialogDescription>
            El precio de venta es la fuente de verdad. El costo define el margen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              name="nombre"
              defaultValue={product?.nombre ?? ""}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="presentacion">Presentación</Label>
              <Input
                id="presentacion"
                name="presentacion"
                defaultValue={product?.presentacion ?? ""}
                placeholder="X 10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Categoría</Label>
              <Input
                id="categoria"
                name="categoria"
                list="categorias-list"
                defaultValue={product?.categoria ?? "General"}
              />
              <datalist id="categorias-list">
                {categorias.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="precioVenta">Precio venta</Label>
              <Input
                id="precioVenta"
                name="precioVenta"
                inputMode="decimal"
                defaultValue={product?.precioVenta ?? ""}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="precioMayorista">Precio mayorista</Label>
              <Input
                id="precioMayorista"
                name="precioMayorista"
                inputMode="decimal"
                defaultValue={product?.precioMayorista ?? ""}
                placeholder="opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="costo">Costo</Label>
              <Input
                id="costo"
                name="costo"
                inputMode="decimal"
                defaultValue={product?.costo ?? ""}
                placeholder="opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                inputMode="numeric"
                defaultValue={product?.stock ?? ""}
                placeholder="opcional"
              />
            </div>
          </div>
          {isEdit ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={product?.activo ?? true}
                className="size-4"
              />
              Producto activo (se muestra en el POS)
            </label>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
