"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AUTH_COOKIE, isValidPin, sessionToken } from "@/lib/auth";

const pinSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "El PIN debe tener 4 dígitos"),
});

export type LoginState = { error?: string };

// ─── Rate limiting por IP (in-memory) ─────────────────────────────────────────
// Limita la fuerza bruta sobre el PIN. Nota: en serverless la memoria es por
// instancia; para algo a prueba de balas usar un store compartido (Upstash/KV).
const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 5;
type Bucket = { count: number; resetAt: number };
const attempts = new Map<string, Bucket>();

function checkRate(ip: string): { ok: true } | { ok: false; retryMins: number } {
  const now = Date.now();
  const b = attempts.get(ip);
  if (!b || now > b.resetAt) return { ok: true };
  if (b.count >= MAX_ATTEMPTS) {
    return { ok: false, retryMins: Math.max(1, Math.ceil((b.resetAt - now) / 60000)) };
  }
  return { ok: true };
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const b = attempts.get(ip);
  if (!b || now > b.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    b.count += 1;
  }
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // BYPASS SOLO PARA DESARROLLO: permitir acceso sin PIN en localhost/development
  if (process.env.NODE_ENV === "development") {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, await sessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // En desarrollo no es necesario
      path: "/",
    });
    redirect("/");
  }

  const ip = await clientIp();

  const rate = checkRate(ip);
  if (!rate.ok) {
    return {
      error: `Demasiados intentos. Probá de nuevo en ${rate.retryMins} min.`,
    };
  }

  const parsed = pinSchema.safeParse({ pin: formData.get("pin") });
  if (!parsed.success) {
    recordFailure(ip);
    return { error: parsed.error.issues[0]?.message ?? "PIN inválido" };
  }

  if (!isValidPin(parsed.data.pin)) {
    recordFailure(ip);
    // Pequeña demora extra para frenar el scripting de intentos.
    await new Promise((r) => setTimeout(r, 350));
    return { error: "PIN incorrecto" };
  }

  // PIN correcto: limpiamos el contador de esa IP.
  attempts.delete(ip);

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Sin maxAge/expires => session cookie: se borra al cerrar el navegador,
    // por lo que el PIN se vuelve a pedir en cada sesión nueva.
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect("/login");
}
