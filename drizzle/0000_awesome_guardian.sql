CREATE TYPE "public"."metodo_pago" AS ENUM('efectivo', 'tarjeta', 'transferencia', 'qr', 'otro');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"presentacion" text,
	"categoria" text DEFAULT 'General' NOT NULL,
	"precio_venta" numeric(12, 2) NOT NULL,
	"costo" numeric(12, 2),
	"margen_pct" numeric(6, 2) GENERATED ALWAYS AS (round((precio_venta - costo) / nullif(costo, 0) * 100, 2)) STORED,
	"stock" integer,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid,
	"nombre_snapshot" text NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario_snapshot" numeric(12, 2) NOT NULL,
	"costo_unitario_snapshot" numeric(12, 2) NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"total_costo" numeric(12, 2) NOT NULL,
	"total_ganancia" numeric(12, 2) NOT NULL,
	"metodo_pago" "metodo_pago" DEFAULT 'efectivo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;