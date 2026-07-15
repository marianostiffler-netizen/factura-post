import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function PageHeader({
  title,
  description,
  backHref = "/dashboard",
  children,
}: {
  title: string;
  description?: string;
  /** Destino de la flecha "Volver". `null` la oculta (p. ej. en la home). */
  backHref?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Button asChild variant="ghost" size="icon">
            <Link href={backHref} aria-label="Volver">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
        ) : null}
        <div>
          <h1 className="font-serif text-xl font-medium tracking-tight sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}
