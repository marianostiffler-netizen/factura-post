# factura-pos

Webapp privada de **facturación + rentabilidad + analítica** para una farmacia / comercio minorista. Un solo usuario (el dueño).

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Auth)
- Drizzle ORM
- Tailwind + shadcn/ui
- Recharts
- Deploy en Vercel

## Módulos

1. **Punto de venta** (`/pos`) — carrito y generación de factura.
2. **Factura** — comprobante imprimible/PDF para el cliente (sin costos ni ganancia).
3. **Rentabilidad** (`/ventas`) — ganancia por producto/venta, margen real (privado).
4. **Dashboard** (`/dashboard`) — analítica, comparativas y gráficos.

## Puesta en marcha

### 1. Variables de entorno

Copiá `.env.example` a `.env.local` y completá:

```
NEXT_PUBLIC_SUPABASE_URL=...        # Project Settings > API
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # Project Settings > API
DATABASE_URL=...                    # Project Settings > Database > Connection string (URI)
```

> Para `DATABASE_URL` usá el connection string del **pooler** de Supabase.

### 2. Migrar la base de datos

```bash
npm run db:migrate     # aplica las migraciones de ./drizzle
# o, en desarrollo:
npm run db:push        # empuja el esquema directo
```

### 3. Crear el usuario del dueño (manual, sin registro público)

En el dashboard de Supabase → **Authentication → Users → Add user** (email + password).
No hay registro público: el middleware protege todas las rutas excepto `/login`.

### 4. (Opcional) Sembrar productos de ejemplo

```bash
npm run db:seed        # editá db/seed.ts con tu catálogo real
```

### 5. Correr en local

```bash
npm run dev            # http://localhost:3000
```

## Scripts de base de datos

| Script                | Acción                                  |
| --------------------- | --------------------------------------- |
| `npm run db:generate` | Genera migraciones desde el esquema     |
| `npm run db:migrate`  | Aplica migraciones                      |
| `npm run db:push`     | Empuja el esquema sin migraciones       |
| `npm run db:studio`   | Abre Drizzle Studio                     |
| `npm run db:seed`     | Carga el catálogo de ejemplo            |

## Modelo de datos

- `products` — `precio_venta` es una **columna generada** por Postgres: `round(costo * (1 + margen_pct/100), 2)`.
- `sales` — guarda totales ya calculados (incluida la ganancia).
- `sale_items` — **snapshots** de nombre/precio/costo al momento de la venta: editar un producto no altera reportes históricos.

## Deploy en Vercel

1. Importar el repo en Vercel.
2. Cargar las mismas variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, y las `NEXT_PUBLIC_COMERCIO_*`).
3. Build command por defecto (`next build`).
