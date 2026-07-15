"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initialState: LoginState = {};
const LENGTH = 4;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={disabled || pending}>
      {pending ? "Verificando…" : "Ingresar"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState);
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const pin = digits.join("");
  const complete = digits.every((d) => d !== "");

  // Foco inicial en el primer casillero.
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Al fallar, limpiar y volver al primer casillero.
  useEffect(() => {
    if (state.error) {
      setDigits(Array(LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    }
  }, [state.error]);

  function focusAt(index: number) {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }

  /** Aplica un nuevo arreglo de dígitos y, si está completo, envía. */
  function commit(next: string[]) {
    setDigits(next);
    if (next.every((d) => d !== "")) {
      // Esperar a que el input oculto `pin` tenga el valor antes de enviar.
      requestAnimationFrame(() => formRef.current?.requestSubmit());
    }
  }

  function handleChange(index: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (clean === "") {
      // Borrado dentro del casillero.
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    // Si pegaron/escribieron varios dígitos, distribuirlos desde acá.
    const chars = clean.split("");
    let i = index;
    for (const c of chars) {
      if (i >= LENGTH) break;
      next[i] = c;
      i += 1;
    }
    commit(next);
    // Avanzar al primer casillero vacío (o al último escrito).
    const nextEmpty = next.findIndex((d) => d === "");
    focusAt(nextEmpty === -1 ? LENGTH - 1 : nextEmpty);
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    let i = index;
    for (const c of pasted.split("")) {
      if (i >= LENGTH) break;
      next[i] = c;
      i += 1;
    }
    commit(next);
    const nextEmpty = next.findIndex((d) => d === "");
    focusAt(nextEmpty === -1 ? LENGTH - 1 : nextEmpty);
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Borra el dígito actual.
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        // Casillero vacío: retrocede y borra el anterior.
        e.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        focusAt(index - 1);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight" && index < LENGTH - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  // BYPASS SOLO PARA DESARROLLO: redirigir automáticamente sin PIN
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.location.href = "/";
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">
            {process.env.NEXT_PUBLIC_COMERCIO_NOMBRE || "factura-pos"}
          </CardTitle>
          <CardDescription>Ingresá tu PIN de 4 dígitos</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-5">
            <input type="hidden" name="pin" value={pin} />
            <div className="flex justify-center gap-3">
              {digits.map((d, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={(e) => handlePaste(i, e)}
                  onFocus={(e) => e.target.select()}
                  className="h-14 w-12 text-center text-2xl"
                  aria-label={`Dígito ${i + 1}`}
                />
              ))}
            </div>
            {state.error && (
              <p className="text-center text-sm text-destructive">
                {state.error}
              </p>
            )}
            <SubmitButton disabled={!complete} />
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
